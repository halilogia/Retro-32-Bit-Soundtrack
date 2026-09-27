import { clamp } from './theory.js';

const CRUSH_CURVE = 4096;
const GLIDE = 0.02;

function quantizeCurve(bits, drive) {
  const curve = new Float32Array(CRUSH_CURVE);
  const step = Math.pow(2, bits);
  const normalise = Math.tanh(drive);
  for (let i = 0; i < CRUSH_CURVE; i++) {
    const input = (i / (CRUSH_CURVE - 1)) * 2 - 1;
    const driven = Math.tanh(input * drive) / normalise;
    curve[i] = Math.round(driven * step) / step;
  }
  return curve;
}

export class Crusher {
  constructor(context, destination, { useWorklet = false } = {}) {
    this.context = context;
    this.useWorklet = useWorklet;
    this.input = context.createGain();
    this.output = context.createGain();
    this.dry = context.createGain();
    this.wet = context.createGain();
    this.dry.gain.value = 1;
    this.wet.gain.value = 0;

    this.input.connect(this.dry);
    this.dry.connect(this.output);

    if (useWorklet) {
      this.node = new AudioWorkletNode(context, 'retro-crush', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        parameterData: { bits: 16, drive: 1, wet: 0 }
      });
    } else {
      this.node = context.createWaveShaper();
      this.node.oversample = 'none';
      this.node.curve = quantizeCurve(16, 1);
    }
    this.node.connect(this.wet);
    this.wet.connect(this.output);
    if (destination) this.output.connect(destination);

    this.state = { bits: 16, drive: 1 };
  }

  setAmount(amount) {
    const value = clamp(amount, 0, 1);
    const now = this.context.currentTime;
    const bits = Math.round(16 - 12 * value);
    const drive = 1 + 2.5 * value;
    const wet = clamp(value * 1.6, 0, 1);

    if (this.useWorklet) {
      const params = this.node.parameters;
      params.get('bits').setTargetAtTime(bits, now, GLIDE);
      params.get('drive').setTargetAtTime(drive, now, GLIDE);
      params.get('wet').setTargetAtTime(wet, now, GLIDE);
      return;
    }

    this.dry.gain.setTargetAtTime(1 - wet, now, GLIDE);
    this.wet.gain.setTargetAtTime(wet, now, GLIDE);
    if (bits !== this.state.bits || Math.round(drive * 100) !== Math.round(this.state.drive * 100)) {
      this.state = { bits, drive };
      this.node.curve = quantizeCurve(bits, drive);
    }
  }
}
