import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');

const DESIGN = 512;
const BG = [26, 11, 46];
const GRID = [46, 26, 71];
const GREEN = [74, 246, 38];
const BLUE = [5, 217, 232];
const PINK = [255, 42, 109];

const BARS = [
  { x: 112, height: 96, color: GREEN },
  { x: 172, height: 192, color: BLUE },
  { x: 232, height: 272, color: PINK },
  { x: 292, height: 144, color: BLUE },
  { x: 352, height: 216, color: GREEN }
];

const BASELINE = 392;

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  const source = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    source.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function fillRect(pixels, size, x, y, width, height, color) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(size, x + width);
  const y1 = Math.min(size, y + height);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const index = (py * size + px) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = 255;
    }
  }
}

function renderIcon(size, { maskable = false } = {}) {
  const pixels = new Uint8Array(size * size * 4);
  const scale = maskable ? 0.7 : 1;
  const offset = (DESIGN * (1 - scale)) / 2;
  const k = (size / DESIGN) * scale;
  const map = (value) => Math.round(offset * (size / DESIGN) + value * k);
  const span = (value) => Math.max(1, Math.round(value * k));

  fillRect(pixels, size, 0, 0, size, size, BG);

  for (const y of [96, 192, 288, 384]) {
    fillRect(pixels, size, map(0), map(y), size, span(2), GRID);
  }

  for (const bar of BARS) {
    fillRect(pixels, size, map(bar.x), map(BASELINE - bar.height), span(40), span(bar.height), bar.color);
  }

  fillRect(pixels, size, map(96), map(400), span(320), span(8), PINK);

  if (!maskable) {
    const thickness = span(8);
    fillRect(pixels, size, map(16), map(16), span(480), thickness, BLUE);
    fillRect(pixels, size, map(16), map(496 - 8), span(480), thickness, BLUE);
    fillRect(pixels, size, map(16), map(16), thickness, span(480), BLUE);
    fillRect(pixels, size, map(496 - 8), map(16), thickness, span(480), BLUE);
  }

  return encodePng(size, size, pixels);
}

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['maskable-512.png', 512, { maskable: true }]
];

for (const [name, size, options] of targets) {
  const png = renderIcon(size, options);
  writeFileSync(join(ASSETS, name), png);
  console.log(`assets/${name} (${size}x${size}, ${png.length} bayt)`);
}
