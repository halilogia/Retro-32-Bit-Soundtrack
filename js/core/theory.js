const PITCH_CLASS = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_PATTERN = /^([A-G])([#b]?)(-?\d+)$/;

export const REST = 'x';
export const A4_FREQ = 440;
export const STEPS_PER_BEAT = 4;
export const STEP_LENGTHS = [16, 32, 64];
export const DEFAULT_STEPS = 32;

export function midiToFreq(midi) {
  return A4_FREQ * Math.pow(2, (midi - 69) / 12);
}

export function noteToMidi(name) {
  if (typeof name !== 'string') return null;
  const match = NOTE_PATTERN.exec(name.trim());
  if (!match) return null;
  const [, letter, accidental, octave] = match;
  let value = PITCH_CLASS[letter.toLowerCase()] + (Number(octave) + 1) * 12;
  if (accidental === '#') value += 1;
  if (accidental === 'b') value -= 1;
  return value;
}

export function midiToNote(midi) {
  const rounded = Math.round(midi);
  return `${PITCH_NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}

export function transposeNote(name, semitones) {
  const midi = noteToMidi(name);
  if (midi === null) return name;
  return midiToNote(midi + semitones);
}

export function noteToFreq(name) {
  const midi = noteToMidi(name);
  return midi === null ? 0 : midiToFreq(midi);
}

export function isNote(value) {
  return typeof value === 'string' && value !== REST && noteToMidi(value) !== null;
}

export function rootOf(name) {
  const midi = noteToMidi(name);
  if (midi === null) return 'C';
  return PITCH_NAMES[((midi % 12) + 12) % 12];
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function normalizeSteps(value, fallback = DEFAULT_STEPS) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return STEP_LENGTHS.includes(parsed) ? parsed : fallback;
}

export function secondsPerStep(bpm) {
  return 60 / bpm / STEPS_PER_BEAT;
}
