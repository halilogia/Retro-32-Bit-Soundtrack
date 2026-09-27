import { secondsPerStep, clamp } from './theory.js';
import { getGenre, hasGenre } from './genres.js';
import { composeSong, emptySequence, sanitizeSequence, fitSequence, hasContent, DRUM } from './composer.js';
import { sanitizeMixer, patchMixer, DEFAULT_MIXER, CHANNELS } from './mixer-state.js';
import { DEFAULT_SETTINGS, sanitizeSettings } from './song-settings.js';
import { NoisePool, playLead, playBass, playDrum } from './instruments.js';
import { ReverbBus, DelayBus, MasterEq } from './effects.js';
import { Crusher } from './crush.js';
import { loadProcessors } from '../worklets/registry.js';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;
const START_DELAY = 0.08;
const METER_FFT = 256;
const METER_FLOOR_DB = -54;
const GLIDE = 0.01;
const RENDER_TAIL = 2.5;
const RENDER_START = 0.05;

function createMeter(context) {
  const analyser = context.createAnalyser();
  analyser.fftSize = METER_FFT;
  analyser.smoothingTimeConstant = 0;
  return { analyser, data: new Float32Array(METER_FFT) };
}

function createStrip(context, key, bus, reverbInput, delayInput) {
  const input = context.createGain();
  const gain = context.createGain();
  const panner = context.createStereoPanner();
  const meter = createMeter(context);
  const reverbSend = context.createGain();
  const delaySend = context.createGain();

  input.connect(gain);
  gain.connect(panner);
  panner.connect(bus);
  panner.connect(meter.analyser);
  panner.connect(reverbSend);
  panner.connect(delaySend);
  reverbSend.connect(reverbInput);
  delaySend.connect(delayInput);

  return { key, input, gain, panner, meter, reverbSend, delaySend };
}

export function createGraph(context, options = {}) {
  const { processors = new Set(), media = false } = options;

  const bus = context.createGain();
  const masterGain = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const masterMeter = createMeter(context);

  compressor.threshold.value = -10;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  const eq = new MasterEq(context, compressor);
  const crusher = new Crusher(context, eq.input, { useWorklet: processors.has('retro-crush') });

  bus.connect(masterGain);
  masterGain.connect(crusher.input);
  compressor.connect(masterMeter.analyser);
  masterMeter.analyser.connect(context.destination);

  const mediaDest = media ? context.createMediaStreamDestination() : null;
  if (mediaDest) compressor.connect(mediaDest);

  const reverb = new ReverbBus(context, bus);
  const delay = new DelayBus(context, bus);
  const strips = {};
  for (const { key } of CHANNELS) {
    strips[key] = createStrip(context, key, bus, reverb.input, delay.input);
  }
  const noise = new NoisePool(context, processors.has('retro-noise'));

  return { context, bus, masterGain, eq, crusher, compressor, masterMeter, mediaDest, reverb, delay, strips, noise };
}

export function applyMixer(graph, mixer, options = {}) {
  const { tempo = 120 } = options;
  const time = graph.context.currentTime;
  const glide = (param, value) => param.setTargetAtTime(value, time, GLIDE);

  for (const { key } of CHANNELS) {
    const state = mixer.channels[key];
    const strip = graph.strips[key];
    glide(strip.gain.gain, state.mute ? 0 : state.volume);
    glide(strip.panner.pan, state.pan);
    glide(strip.reverbSend.gain, state.reverb);
    glide(strip.delaySend.gain, state.delay);
  }

  glide(graph.masterGain.gain, mixer.master.mute ? 0 : mixer.master.volume);
  for (const key of Object.keys(graph.eq.bands)) graph.eq.setGain(key, mixer.eq[key]);
  graph.reverb.setSize(mixer.reverb.size);
  graph.reverb.setDamp(mixer.reverb.damp);
  graph.reverb.setPreDelay(mixer.reverb.preDelay);
  graph.delay.setFeedback(mixer.delay.feedback);
  graph.delay.setDamp(mixer.delay.damp);
  graph.delay.setTime((mixer.delay.division * 60) / tempo);
  graph.crusher.setAmount(mixer.master.crush);
}

function defaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

export class SequencerEngine {
  constructor() {
    this.context = null;
    this.graph = null;
    this.ready = false;
    this.pending = null;
    this.worklets = new Set();
    this.events = [];
    this.stateListeners = new Set();
    this.frameListeners = new Set();
    this.mixerListeners = new Set();
    this.timer = null;
    this.raf = null;
    this.genreKey = 'arcade';
    this.settings = defaultSettings();
    this.noteLengthCustom = false;
    this.sequence = emptySequence(this.settings.steps);
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

  get steps() {
    return this.settings.steps;
  }

  get stepDuration() {
    return secondsPerStep(this.tempo);
  }

  getStream() {
    return this.graph && this.graph.mediaDest ? this.graph.mediaDest.stream : null;
  }

  voiceOptions() {
    return { stepDuration: this.stepDuration, noteLength: this.settings.noteLength };
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
    this.graph = createGraph(context, { processors: this.worklets, media: true });

    this.ready = true;
    this.applyMixerState();
    this.startFrameLoop();
    this.emit('context', {
      worklets: [...this.worklets],
      crusher: this.graph.crusher.useWorklet ? 'worklet' : 'waveshaper',
      sampleRate: context.sampleRate
    });
    return this.context;
  }

  setGenre(key) {
    if (!hasGenre(key)) return this.genreKey;
    this.genreKey = key;
    if (!this.noteLengthCustom) {
      this.settings = sanitizeSettings({ ...this.settings, noteLength: this.genre.sounds.lead.noteLength });
    }
    this.newSong();
    this.setMixer(this.genre.mixer);
    this.emit('settings', this.settings);
    this.emit('genre', this.genre);
    return this.genreKey;
  }

  newSong() {
    this.setSequence(
      composeSong(this.genre, {
        steps: this.settings.steps,
        scaleId: this.settings.scaleId,
        arp: this.settings.arp
      })
    );
    return this.sequence;
  }

  setSequence(sequence) {
    this.sequence = sanitizeSequence(sequence, this.settings.steps);
    this.events.length = 0;
    this.emit('sequence', this.sequence);
    return this.sequence;
  }

  setSettings(patch) {
    const next = sanitizeSettings({ ...this.settings, ...patch });
    if (patch && patch.noteLength !== undefined) this.noteLengthCustom = true;
    this.settings = next;
    if (next.steps !== this.sequence.melody.length) {
      this.setSequence(fitSequence(this.sequence, next.steps));
    }
    this.emit('settings', next);
    return this.settings;
  }

  setMixer(mixer) {
    this.mixer = sanitizeMixer(mixer);
    this.applyMixerState();
    this.notifyMixer();
    return this.mixer;
  }

  update(changes) {
    this.mixer = patchMixer(this.mixer, changes);
    this.applyMixerState();
    this.notifyMixer();
    return this.mixer;
  }

  notifyMixer() {
    for (const listener of this.mixerListeners) listener(this.mixer);
  }

  loadState({ genre, sequence, mixer, settings }) {
    if (hasGenre(genre)) this.genreKey = genre;
    if (settings) {
      this.noteLengthCustom = true;
      this.setSettings(settings);
    }
    if (sequence) this.setSequence(sequence);
    else this.newSong();
    if (mixer) this.setMixer(mixer);
    this.emit('genre', this.genre);
    return this.sequence;
  }

  applyMixerState() {
    if (!this.ready) return;
    applyMixer(this.graph, this.mixer, { time: this.context.currentTime, tempo: this.tempo });
  }

  updateDelayTime() {
    if (!this.ready) return;
    this.graph.delay.setTime((this.mixer.delay.division * 60) / this.tempo);
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
      this.step = (this.step + 1) % this.settings.steps;
      this.nextNoteTime += this.stepDuration;
    }
    this.timer = setTimeout(() => this.scheduler(), LOOKAHEAD_MS);
  }

  scheduleStep(step, time) {
    const context = this.context;
    const genre = this.genre;
    const options = this.voiceOptions();
    const event = (kind) => this.events.push({ time, index: step, kind });

    if (playLead(context, this.graph.strips.lead.input, genre, this.sequence.melody[step], time, options)) event('lead');
    if (playBass(context, this.graph.strips.bass.input, genre, this.sequence.bass[step], time, options)) event('bass');
    const drum = this.sequence.drums[step];
    if (drum !== DRUM.NONE && playDrum(context, this.graph.strips.drums.input, this.graph.noise, genre, drum, time) && drum === DRUM.KICK) {
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
    for (const { key } of CHANNELS) levels[key] = this.ready ? this.readPeak(this.graph.strips[key].meter) : 0;
    levels.master = this.ready ? this.readPeak(this.graph.masterMeter) : 0;
    return levels;
  }

  async renderOffline(options = {}) {
    const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineContext) throw new Error('Bu tarayıcı çevrimdışı render desteklemiyor.');

    const loops = clamp(Math.floor(options.loops || 2), 1, 8);
    const sampleRate = clamp(Math.floor(options.sampleRate || 44100), 8000, 96000);
    const stepDuration = this.stepDuration;
    const totalSteps = this.settings.steps * loops;
    const duration = RENDER_START + totalSteps * stepDuration + RENDER_TAIL;

    const offline = new OfflineContext(2, Math.ceil(duration * sampleRate), sampleRate);
    const processors = await loadProcessors(offline).catch(() => new Set());
    const graph = createGraph(offline, { processors });
    applyMixer(graph, this.mixer, { time: 0, tempo: this.tempo });

    const voice = this.voiceOptions();
    for (let index = 0; index < totalSteps; index++) {
      const step = index % this.settings.steps;
      const time = RENDER_START + index * stepDuration;
      playLead(offline, graph.strips.lead.input, this.genre, this.sequence.melody[step], time, voice);
      playBass(offline, graph.strips.bass.input, this.genre, this.sequence.bass[step], time, voice);
      if (this.sequence.drums[step] !== DRUM.NONE) {
        playDrum(offline, graph.strips.drums.input, graph.noise, this.genre, this.sequence.drums[step], time);
      }
    }

    const buffer = await offline.startRendering();
    return { buffer, duration, loops, sampleRate, crusher: graph.crusher.useWorklet ? 'worklet' : 'waveshaper' };
  }

  async dispose() {
    this.pause();
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.graph && this.graph.noise) this.graph.noise.dispose();
    if (this.context) await this.context.close();
    this.ready = false;
  }
}
