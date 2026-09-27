import { DEFAULT_STEPS, REST, isNote } from './theory.js';
import { resolveScales } from './scales.js';

export const DRUM = Object.freeze({ NONE: 0, KICK: 1, SNARE: 2, HAT: 3 });

const DRUM_VALUES = [0, 1, 2, 3];

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

export function emptySequence(steps = DEFAULT_STEPS) {
  return {
    melody: new Array(steps).fill(REST),
    bass: new Array(steps).fill(REST),
    drums: new Array(steps).fill(DRUM.NONE)
  };
}

export function composeSong(genre, options = {}) {
  const { steps = DEFAULT_STEPS, scaleId = 'genre', arp = 'random', rng = Math.random } = options;
  const { melody, bass } = resolveScales(genre, scaleId);
  const { intensity, variation } = genre.sounds.drums;
  const sequence = emptySequence(steps);
  const direction = arp === 'down' ? -1 : 1;
  let cursor = 0;

  for (let i = 0; i < steps; i++) {
    let drum = DRUM.NONE;
    if (i % 8 === 0) drum = DRUM.KICK;
    else if (i % 8 === 4) drum = DRUM.SNARE;

    if (drum === DRUM.NONE && rng() < intensity) {
      if (variation > 0 && rng() > 1 - variation) {
        drum = rng() > 0.5 ? DRUM.KICK : DRUM.SNARE;
      } else {
        drum = DRUM.HAT;
      }
    }
    sequence.drums[i] = drum;

    if (arp === 'random') {
      sequence.melody[i] = rng() < genre.sounds.melodyChance ? pick(melody, rng) : REST;
    } else {
      sequence.melody[i] = melody[cursor % melody.length];
      cursor = (cursor + direction + melody.length) % melody.length;
    }

    const bassChance = i % 4 === 0 ? genre.sounds.bassChance.onBeat : genre.sounds.bassChance.offBeat;
    sequence.bass[i] = rng() < bassChance ? pick(bass, rng) : REST;
  }

  return sequence;
}

export function sanitizeSequence(raw, steps = DEFAULT_STEPS) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const isValid = (value) => (typeof value === 'string' ? isNote(value) : DRUM_VALUES.includes(value));
  const clean = (list, rest) =>
    Array.isArray(list)
      ? Array.from({ length: steps }, (_, i) => (isValid(list[i]) ? list[i] : rest))
      : new Array(steps).fill(rest);
  return {
    melody: clean(source.melody, REST),
    bass: clean(source.bass, REST),
    drums: clean(source.drums, DRUM.NONE)
  };
}

export function hasContent(sequence) {
  if (!sequence) return false;
  return [sequence.melody, sequence.bass, sequence.drums].some((track) =>
    Array.isArray(track) && track.some((value) => value !== REST && value !== DRUM.NONE)
  );
}

export function fitSequence(sequence, steps) {
  const fit = (track) => {
    if (!Array.isArray(track) || track.length === 0) return new Array(steps);
    if (track.length === steps) return track.slice();
    return Array.from({ length: steps }, (_, i) => track[i % track.length]);
  };
  return { melody: fit(sequence.melody), bass: fit(sequence.bass), drums: fit(sequence.drums) };
}
