import { rootOf, transposeNote } from './theory.js';

export const SCALES = Object.freeze([
  { id: 'genre', label: 'TÜR KİTABI' },
  { id: 'major-pentatonic', label: 'MAJOR PENTATONİK', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', label: 'MİNÖR PENTATONİK', intervals: [0, 3, 5, 7, 10] },
  { id: 'dorian', label: 'DORİAN', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian-dominant', label: 'PHRYGIAN DOMİNANT', intervals: [0, 1, 4, 5, 7, 8, 10] },
  { id: 'minor', label: 'MİNÖR (DOĞAL)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic-minor', label: 'HARMONİK MİNÖR', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'lydian', label: 'LİDYAN', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', label: 'MİKSOLİDYEN', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'blues', label: 'BLUES', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'chromatic', label: 'KROMATİK', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
]);

export const ARP_MODES = Object.freeze([
  { value: 'random', label: 'RASTGELE' },
  { value: 'up', label: 'YUKARI' },
  { value: 'down', label: 'AŞAĞI' }
]);

export function getScale(id) {
  return SCALES.find((scale) => scale.id === id) || SCALES[0];
}

export function scaleOptions() {
  return SCALES.map((scale) => ({ value: scale.id, label: scale.label }));
}

export function hasScale(id) {
  return SCALES.some((scale) => scale.id === id);
}

export function buildScaleNotes(root, intervals, octaves = 2, startOctave = 4) {
  const notes = [];
  for (let octave = 0; octave < octaves; octave++) {
    for (const semitone of intervals) {
      notes.push(transposeNote(`${root}${startOctave + octave}`, semitone));
    }
  }
  return notes;
}

export function resolveScales(genre, scaleId) {
  const scale = getScale(scaleId);
  if (scale.id === 'genre' || !scale.intervals) {
    return { melody: genre.scales.melody.slice(), bass: genre.scales.bass.slice(), scale };
  }
  const root = rootOf(genre.scales.melody[0]);
  const bassRoot = transposeNote(root, -12);
  return {
    melody: buildScaleNotes(root, scale.intervals, 2, 4),
    bass: [transposeNote(bassRoot, -12), bassRoot, transposeNote(bassRoot, 7)],
    scale
  };
}
