import { DEFAULT_STEPS, clamp, normalizeSteps } from './theory.js';
import { hasScale } from './scales.js';

export const ARP_MODES = Object.freeze(['random', 'up', 'down']);

export const DEFAULT_SETTINGS = Object.freeze({
  steps: DEFAULT_STEPS,
  noteLength: 4,
  arp: 'random',
  scaleId: 'genre'
});

export const NOTE_LENGTHS = Object.freeze([0.25, 0.5, 1, 2, 4, 8]);

export function sanitizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const noteLength = typeof source.noteLength === 'number' && Number.isFinite(source.noteLength)
    ? clamp(source.noteLength, 0.25, 8)
    : DEFAULT_SETTINGS.noteLength;
  return {
    steps: normalizeSteps(source.steps),
    noteLength,
    arp: ARP_MODES.includes(source.arp) ? source.arp : DEFAULT_SETTINGS.arp,
    scaleId: hasScale(source.scaleId) ? source.scaleId : DEFAULT_SETTINGS.scaleId
  };
}
