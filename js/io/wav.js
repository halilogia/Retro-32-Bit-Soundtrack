const HEADER_BYTES = 44;
const BITS = 16;

function writeText(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeWav(buffer) {
  const channels = Math.max(1, Math.min(2, buffer.numberOfChannels || 1));
  const rate = buffer.sampleRate;
  const frames = buffer.length;
  const blockAlign = channels * (BITS / 8);
  const dataBytes = frames * blockAlign;
  const view = new DataView(new ArrayBuffer(HEADER_BYTES + dataBytes));

  writeText(view, 0, 'RIFF');
  view.setUint32(4, view.byteLength - 8, true);
  writeText(view, 8, 'WAVE');
  writeText(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS, true);
  writeText(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  const data = [];
  for (let channel = 0; channel < channels; channel++) data.push(buffer.getChannelData(channel));

  let offset = HEADER_BYTES;
  for (let frame = 0; frame < frames; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, data[channel][frame] || 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([view.buffer], { type: 'audio/wav' });
}
