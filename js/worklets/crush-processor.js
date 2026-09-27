class RetroCrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bits', defaultValue: 16, minValue: 2, maxValue: 16, automationRate: 'k-rate' },
      { name: 'drive', defaultValue: 1, minValue: 0.25, maxValue: 6, automationRate: 'k-rate' },
      { name: 'wet', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const input = inputs[0];
    if (!input || input.length === 0) {
      for (const channel of output) channel.fill(0);
      return true;
    }

    const wet = parameters.wet[0];
    if (wet <= 0.0005) {
      for (let ch = 0; ch < output.length; ch++) {
        output[ch].set(input[ch] || input[0]);
      }
      return true;
    }

    const bits = Math.round(parameters.bits[0]);
    const drive = parameters.drive[0];
    const step = Math.pow(2, bits);
    const normalise = Math.tanh(drive);
    const dryMix = 1 - wet;

    for (let ch = 0; ch < output.length; ch++) {
      const source = input[ch] || input[0];
      const target = output[ch];
      for (let i = 0; i < target.length; i++) {
        const dry = source[i];
        const driven = Math.tanh(dry * drive) / normalise;
        const crushed = Math.round(driven * step) / step;
        target[i] = dry * dryMix + crushed * wet;
      }
    }
    return true;
  }
}

registerProcessor('retro-crush', RetroCrushProcessor);
