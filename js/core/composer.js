import { STEPS, REST, isNote } from './theory.js';

export const DRUM = Object.freeze({ NONE: 0, KICK: 1, SNARE: 2, HAT: 3 });

const DRUM_VALUES = [0, 1, 2, 3];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function emptySequence() {
  return {
    melody: Array(STEPS).fill(REST),
    bass: Array(STEPS).fill(REST),
    drums: Array(STEPS).fill(DRUM.NONE)
  };
}

export function composeSong(genre) {
  const { scales, sounds } = genre;
  const { intensity, variation } = sounds.drums;
  const sequence = emptySequence();

  for (let i = 0; i < STEPS; i++) {
    let drum = DRUM.NONE;
    if (i % 8 === 0) drum = DRUM.KICK;
    else if (i % 8 === 4) drum = DRUM.SNARE;

    if (drum === DRUM.NONE && Math.random() < intensity) {
      if (variation > 0 && Math.random() > 1 - variation) {
        drum = Math.random() > 0.5 ? DRUM.KICK : DRUM.SNARE;
      } else {
        drum = DRUM.HAT;
      }
    }
    sequence.drums[i] = drum;

    sequence.melody[i] = Math.random() < sounds.melodyChance ? pick(scales.melody) : REST;
    const bassChance = i % 4 === 0 ? sounds.bassChance.onBeat : sounds.bassChance.offBeat;
    sequence.bass[i] = Math.random() < bassChance ? pick(scales.bass) : REST;
  }

  return sequence;
}

export function sanitizeSequence(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const clean = (list, fallback, isValid) => {
    if (!Array.isArray(list)) return fallback.slice();
    const out = Array.from({ length: STEPS }, (_, i) => {
      const value = list[i];
      return isValid(value) ? value : fallback[i];
    });
    return out;
  };
  return {
    melody: clean(source.melody, emptySequence().melody, isNote),
    bass: clean(source.bass, emptySequence().bass, isNote),
    drums: clean(source.drums, emptySequence().drums, (value) => DRUM_VALUES.includes(value))
  };
}

export function hasContent(sequence) {
  if (!sequence) return false;
  return [sequence.melody, sequence.bass, sequence.drums].some((track) =>
    Array.isArray(track) && track.some((value) => value !== REST && value !== DRUM.NONE)
  );
}
