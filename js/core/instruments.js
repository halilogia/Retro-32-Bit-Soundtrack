import { noteToFreq, clamp } from './theory.js';
import { DRUM } from './composer.js';

const NOISE_SECONDS = 2;
const CLEANUP_MARGIN = 0.15;

function safeExp(value) {
  return Math.max(1, value);
}

export class NoisePool {
  constructor(context, useWorklet) {
    this.context = context;
    this.kind = useWorklet ? 'worklet' : 'buffer';
    this.activated = false;
    this.timers = new Set();

    if (useWorklet) {
      this.node = new AudioWorkletNode(context, 'retro-noise', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1]
      });
    } else {
      const length = Math.floor(context.sampleRate * NOISE_SECONDS);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.node = context.createBufferSource();
      this.node.buffer = buffer;
      this.node.loop = true;
      this.node.start();
    }
  }

  activate() {
    if (this.activated || this.kind !== 'worklet') return;
    this.activated = true;
    this.node.port.postMessage({ active: true });
  }

  hit(destination, { filterType, filterFreq, level, decay, time }) {
    this.activate();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const end = time + decay + 0.02;

    filter.type = filterType;
    filter.frequency.setValueAtTime(clamp(filterFreq, 20, this.context.sampleRate / 2 - 100), time);
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + decay);
    gain.gain.setValueAtTime(0, end);

    this.node.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    this.release([filter, gain], end);
    return end;
  }

  release(nodes, endTime) {
    const wait = Math.max(0, (endTime - this.context.currentTime + CLEANUP_MARGIN) * 1000);
    const id = setTimeout(() => {
      this.timers.delete(id);
      for (const node of nodes) {
        try {
          node.disconnect();
        } catch (error) {
          void error;
        }
      }
    }, wait);
    this.timers.add(id);
  }

  dispose() {
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    if (this.kind === 'worklet' && this.activated) {
      this.node.port.postMessage({ active: false });
      this.activated = false;
    }
    try {
      this.node.disconnect();
    } catch (error) {
      void error;
    }
  }
}

export function playLead(context, destination, genre, note, time) {
  const freq = noteToFreq(note);
  if (!freq) return false;
  const settings = genre.sounds.lead;
  const filter = settings.filter;

  const osc = context.createOscillator();
  const filterNode = context.createBiquadFilter();
  const gain = context.createGain();

  osc.type = settings.type;
  osc.frequency.setValueAtTime(freq, time);

  filterNode.type = filter.type;
  filterNode.frequency.setValueAtTime(safeExp(filter.start), time);
  filterNode.frequency.exponentialRampToValueAtTime(safeExp(filter.to), time + filter.sweep);

  const settle = filter.settle;
  if (settle) {
    const target = safeExp(settle.to === undefined ? filter.start : settle.to);
    if (settle.linear) filterNode.frequency.linearRampToValueAtTime(target, time + settle.at);
    else filterNode.frequency.exponentialRampToValueAtTime(target, time + settle.at);
  }

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(settings.level, time + settings.attack);
  gain.gain.exponentialRampToValueAtTime(0.01, time + settings.release);

  osc.connect(filterNode);
  filterNode.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + settings.release + 0.1);
  return true;
}

export function playBass(context, destination, genre, note, time) {
  const freq = noteToFreq(note);
  if (!freq) return false;
  const settings = genre.sounds.bass;

  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = settings.type;
  osc.frequency.setValueAtTime(freq, time);
  if (settings.detune) osc.detune.setValueAtTime(settings.detune, time);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(settings.level, time + settings.attack);
  gain.gain.exponentialRampToValueAtTime(0.01, time + settings.release);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + settings.release + 0.1);
  return true;
}

export function playDrum(context, destination, noise, genre, type, time) {
  const settings = genre.sounds.drums;
  const level = settings.level;

  if (type === DRUM.KICK) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(settings.kick.start, time);
    osc.frequency.exponentialRampToValueAtTime(settings.kick.to, time + settings.kick.decay);
    gain.gain.setValueAtTime(settings.kick.level * level, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + settings.kick.decay);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + settings.kick.decay + 0.05);
    return true;
  }

  if (type === DRUM.SNARE) {
    noise.hit(destination, {
      filterType: settings.snare.filter.type,
      filterFreq: settings.snare.filter.freq,
      level: settings.snare.level * level,
      decay: settings.snare.decay,
      time
    });
    return true;
  }

  if (type === DRUM.HAT) {
    noise.hit(destination, {
      filterType: settings.hat.filter.type,
      filterFreq: settings.hat.filter.freq,
      level: settings.hat.level * level,
      decay: settings.hat.decay,
      time
    });
    return true;
  }

  return false;
}
