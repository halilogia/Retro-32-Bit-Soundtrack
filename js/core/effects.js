import { clamp } from './theory.js';

const MAX_DELAY = 2;
const IR_CACHE_LIMIT = 6;
const DAMP_MIN_HZ = 700;
const DAMP_MAX_HZ = 20000;
const IR_DECAY = 4.5;

function dampFrequency(value) {
  return DAMP_MAX_HZ * Math.pow(DAMP_MIN_HZ / DAMP_MAX_HZ, clamp(value, 0, 1));
}

export function createImpulseResponse(context, seconds) {
  const rate = context.sampleRate;
  const length = Math.max(1, Math.floor(rate * clamp(seconds, 0.1, 6)));
  const buffer = context.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const progress = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-IR_DECAY * progress);
    }
  }
  return buffer;
}

export class ReverbBus {
  constructor(context, destination) {
    this.context = context;
    this.input = context.createGain();
    this.convolver = context.createConvolver();
    this.damp = context.createBiquadFilter();
    this.output = context.createGain();
    this.cache = new Map();
    this.size = 1.6;
    this.dampValue = 0.6;
    this.timer = null;

    this.damp.type = 'lowpass';
    this.damp.Q.value = 0.0001;
    this.input.connect(this.convolver);
    this.convolver.connect(this.damp);
    this.damp.connect(this.output);
    this.output.connect(destination);
    this.setSize(this.size);
    this.setDamp(this.dampValue);
  }

  impulseFor(size) {
    const key = size.toFixed(2);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const buffer = createImpulseResponse(this.context, key);
    this.cache.set(key, buffer);
    while (this.cache.size > IR_CACHE_LIMIT) {
      this.cache.delete(this.cache.keys().next().value);
    }
    return buffer;
  }

  setSize(seconds) {
    this.size = clamp(seconds, 0.2, 4);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.convolver.buffer = this.impulseFor(this.size);
    }, 120);
  }

  setDamp(value) {
    this.dampValue = clamp(value, 0, 1);
    this.damp.frequency.setTargetAtTime(dampFrequency(this.dampValue), this.context.currentTime, 0.02);
  }
}

export class DelayBus {
  constructor(context, destination) {
    this.context = context;
    this.input = context.createGain();
    this.delayNode = context.createDelay(MAX_DELAY);
    this.damp = context.createBiquadFilter();
    this.feedback = context.createGain();
    this.output = context.createGain();
    this.time = 0.5;
    this.dampValue = 0.4;
    this.feedbackValue = 0.35;

    this.damp.type = 'lowpass';
    this.damp.Q.value = 0.0001;
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.damp);
    this.damp.connect(this.feedback);
    this.feedback.connect(this.delayNode);
    this.delayNode.connect(this.output);
    this.output.connect(destination);

    this.setTime(0.5);
    this.setFeedback(this.feedbackValue);
    this.setDamp(this.dampValue);
  }

  setTime(seconds) {
    this.time = clamp(seconds, 0.01, MAX_DELAY - 0.05);
    this.delayNode.delayTime.setTargetAtTime(this.time, this.context.currentTime, 0.05);
  }

  setFeedback(value) {
    this.feedbackValue = clamp(value, 0, 0.85);
    this.feedback.gain.setTargetAtTime(this.feedbackValue, this.context.currentTime, 0.02);
  }

  setDamp(value) {
    this.dampValue = clamp(value, 0, 1);
    this.damp.frequency.setTargetAtTime(dampFrequency(this.dampValue), this.context.currentTime, 0.02);
  }
}
