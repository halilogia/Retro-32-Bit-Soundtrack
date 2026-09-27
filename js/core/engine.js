import { STEPS, secondsPerStep, clamp } from './theory.js';
import { getGenre, hasGenre } from './genres.js';
import { composeSong, emptySequence, sanitizeSequence, hasContent, DRUM } from './composer.js';
import { sanitizeMixer, patchMixer, DEFAULT_MIXER, CHANNELS } from './mixer-state.js';
import { NoisePool, playLead, playBass, playDrum } from './instruments.js';
import { ReverbBus, DelayBus } from './effects.js';
import { loadProcessors } from '../worklets/registry.js';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;
const START_DELAY = 0.08;
const METER_FFT = 256;
const METER_FLOOR_DB = -54;
const GLIDE = 0.01;

export class SequencerEngine {
  constructor() {
    this.context = null;
    this.ready = false;
    this.pending = null;
    this.worklets = new Set();
    this.noise = null;
    this.strips = {};
    this.events = [];
    this.stateListeners = new Set();
    this.frameListeners = new Set();
    this.mixerListeners = new Set();
    this.timer = null;
    this.raf = null;
    this.genreKey = 'arcade';
    this.sequence = emptySequence();
    this.mixer = sanitizeMixer(DEFAULT_MIXER);
    this.isPlaying = false;
    this.step = 0;
    this.nextNoteTime = 0;
  }

  get genre() {
    return getGenre(this.genreKey);
  }

  get tempo() {
    return this.genre.tempo;
  }

  get usingWorklets() {
    return this.worklets.size > 0;
  }

  getStream() {
    return this.mediaDest ? this.mediaDest.stream : null;
  }

  onState(listener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onFrame(listener) {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  onMixer(listener) {
    this.mixerListeners.add(listener);
    return () => this.mixerListeners.delete(listener);
  }

  emit(type, detail) {
    for (const listener of this.stateListeners) listener({ type, detail });
  }

  async ensureContext() {
    if (this.ready) {
      if (this.context.state === 'suspended') await this.context.resume();
      return this.context;
    }
    if (!this.pending) this.pending = this.build();
    await this.pending;
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }

  async build() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Bu tarayıcı Web Audio API desteklemiyor.');

    const context = new AudioContextClass({ latencyHint: 'interactive' });
    this.context = context;
    this.worklets = await loadProcessors(context);

    this.bus = context.createGain();
    this.masterGain = context.createGain();
    this.compressor = context.createDynamicsCompressor();
    this.masterMeter = this.createMeter();
    this.mediaDest = context.createMediaStreamDestination();

    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 40;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0;
    this.compressor.release.value = 0.25;

    this.bus.connect(this.masterGain);

    if (this.worklets.has('retro-crush')) {
      this.crush = new AudioWorkletNode(context, 'retro-crush', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        parameterData: { bits: 16, drive: 1, wet: 0 }
      });
      this.masterGain.connect(this.crush);
      this.crush.connect(this.compressor);
    } else {
      this.crush = null;
      this.masterGain.connect(this.compressor);
    }

    this.compressor.connect(this.masterMeter.analyser);
    this.masterMeter.analyser.connect(context.destination);
    this.compressor.connect(this.mediaDest);

    this.reverb = new ReverbBus(context, this.bus);
    this.delay = new DelayBus(context, this.bus);

    for (const { key } of CHANNELS) this.strips[key] = this.createStrip(key);

    this.noise = new NoisePool(context, this.worklets.has('retro-noise'));

    this.ready = true;
    this.applyMixerState(this.mixer);
    this.startFrameLoop();
    this.emit('context', { worklets: [...this.worklets], sampleRate: context.sampleRate });
    return this.context;
  }

  createMeter() {
    const analyser = this.context.createAnalyser();
    analyser.fftSize = METER_FFT;
    analyser.smoothingTimeConstant = 0;
    return { analyser, data: new Float32Array(METER_FFT) };
  }

  createStrip(key) {
    const context = this.context;
    const input = context.createGain();
    const gain = context.createGain();
    const meter = this.createMeter();
    const reverbSend = context.createGain();
    const delaySend = context.createGain();

    input.connect(gain);
    gain.connect(this.bus);
    gain.connect(meter.analyser);
    gain.connect(reverbSend);
    gain.connect(delaySend);
    reverbSend.connect(this.reverb.input);
    delaySend.connect(this.delay.input);

    return { key, input, gain, meter, reverbSend, delaySend };
  }

  setGenre(key) {
    if (!hasGenre(key)) return this.genreKey;
    this.genreKey = key;
    this.newSong();
    this.updateDelayTime();
    this.emit('genre', this.genre);
    return this.genreKey;
  }

  newSong() {
    this.setSequence(composeSong(this.genre));
    return this.sequence;
  }

  setSequence(sequence) {
    this.sequence = sanitizeSequence(sequence);
    this.events.length = 0;
    this.emit('sequence', this.sequence);
    return this.sequence;
  }

  setMixer(mixer) {
    this.mixer = sanitizeMixer(mixer);
    this.applyMixerState(this.mixer);
    this.notifyMixer();
    return this.mixer;
  }

  update(changes) {
    this.mixer = patchMixer(this.mixer, changes);
    this.applyMixerState(this.mixer);
    this.notifyMixer();
    return this.mixer;
  }

  notifyMixer() {
    for (const listener of this.mixerListeners) listener(this.mixer);
  }

  loadState({ genre, sequence, mixer }) {
    if (hasGenre(genre)) this.genreKey = genre;
    if (sequence) this.setSequence(sequence);
    else this.newSong();
    if (mixer) this.setMixer(mixer);
    this.updateDelayTime();
    this.emit('genre', this.genre);
    return this.sequence;
  }

  applyMixerState(mixer) {
    if (!this.ready) return;
    const now = this.context.currentTime;
    const glide = (param, value) => param.setTargetAtTime(value, now, GLIDE);

    for (const { key } of CHANNELS) {
      const state = mixer.channels[key];
      const strip = this.strips[key];
      glide(strip.gain.gain, state.mute ? 0 : state.volume);
      glide(strip.reverbSend.gain, state.reverb);
      glide(strip.delaySend.gain, state.delay);
    }

    glide(this.masterGain.gain, mixer.master.mute ? 0 : mixer.master.volume);
    this.reverb.setSize(mixer.reverb.size);
    this.reverb.setDamp(mixer.reverb.damp);
    this.delay.setFeedback(mixer.delay.feedback);
    this.delay.setDamp(mixer.delay.damp);
    this.applyCrush(mixer.master.crush);
    this.updateDelayTime();
  }

  applyCrush(amount) {
    if (!this.crush) return;
    const now = this.context.currentTime;
    const params = this.crush.parameters;
    params.get('bits').setTargetAtTime(Math.round(16 - 12 * amount), now, GLIDE);
    params.get('drive').setTargetAtTime(1 + 2.5 * amount, now, GLIDE);
    params.get('wet').setTargetAtTime(clamp(amount * 1.6, 0, 1), now, GLIDE);
  }

  updateDelayTime() {
    if (!this.ready) return;
    this.delay.setTime((this.mixer.delay.division * 60) / this.tempo);
  }

  async play() {
    await this.ensureContext();
    if (!hasContent(this.sequence)) this.newSong();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.restartSchedule();
    this.emit('play');
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.events.length = 0;
    this.emit('pause');
  }

  async toggle() {
    if (this.isPlaying) {
      this.pause();
      return false;
    }
    await this.play();
    return true;
  }

  restartSchedule() {
    if (this.timer) clearTimeout(this.timer);
    this.nextNoteTime = this.context.currentTime + START_DELAY;
    this.scheduler();
  }

  resync() {
    if (this.isPlaying) this.restartSchedule();
  }

  scheduler() {
    if (!this.isPlaying || !this.ready) return;
    const horizon = this.context.currentTime + SCHEDULE_AHEAD;
    while (this.nextNoteTime < horizon) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.step = (this.step + 1) % STEPS;
      this.nextNoteTime += secondsPerStep(this.tempo);
    }
    this.timer = setTimeout(() => this.scheduler(), LOOKAHEAD_MS);
  }

  scheduleStep(step, time) {
    const context = this.context;
    const genre = this.genre;
    const event = (kind) => this.events.push({ time, index: step, kind });

    if (playLead(context, this.strips.lead.input, genre, this.sequence.melody[step], time)) event('lead');
    if (playBass(context, this.strips.bass.input, genre, this.sequence.bass[step], time)) event('bass');
    const drum = this.sequence.drums[step];
    if (drum !== DRUM.NONE && playDrum(context, this.strips.drums.input, this.noise, genre, drum, time) && drum === DRUM.KICK) {
      event('kick');
    }
  }

  startFrameLoop() {
    if (this.raf !== null) return;
    const frame = () => {
      this.raf = requestAnimationFrame(frame);
      const now = this.context.currentTime;
      const due = [];
      while (this.events.length > 0 && this.events[0].time <= now) due.push(this.events.shift());
      const levels = this.readLevels();
      for (const listener of this.frameListeners) listener({ events: due, levels, now });
    };
    this.raf = requestAnimationFrame(frame);
  }

  readPeak(meter) {
    meter.analyser.getFloatTimeDomainData(meter.data);
    let peak = 0;
    for (let i = 0; i < meter.data.length; i++) {
      const value = Math.abs(meter.data[i]);
      if (value > peak) peak = value;
    }
    if (peak <= 0.0001) return 0;
    return clamp((20 * Math.log10(peak) - METER_FLOOR_DB) / -METER_FLOOR_DB, 0, 1);
  }

  readLevels() {
    const levels = { master: 0 };
    for (const { key } of CHANNELS) levels[key] = this.ready ? this.readPeak(this.strips[key].meter) : 0;
    levels.master = this.ready ? this.readPeak(this.masterMeter) : 0;
    return levels;
  }

  async dispose() {
    this.pause();
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.noise) this.noise.dispose();
    if (this.context) await this.context.close();
    this.ready = false;
  }
}
