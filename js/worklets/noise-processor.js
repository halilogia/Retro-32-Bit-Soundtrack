class RetroNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.active = false;
    this.port.onmessage = (event) => {
      this.active = !!(event.data && event.data.active);
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    for (let ch = 0; ch < output.length; ch++) {
      const channel = output[ch];
      if (!this.active) {
        channel.fill(0);
        continue;
      }
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    }
    return true;
  }
}

registerProcessor('retro-noise', RetroNoiseProcessor);
