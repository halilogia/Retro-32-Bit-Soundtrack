import { DEFAULT_MIXER } from './mixer-state.js';

const BASE_SOUNDS = {
  melodyChance: 0.6,
  bassChance: { onBeat: 0.8, offBeat: 0.1 },
  lead: {
    type: 'sawtooth',
    level: 0.3,
    attack: 0.02,
    release: 0.4,
    noteLength: 4,
    filter: { type: 'lowpass', start: 2000, to: 3000, sweep: 0.05, settle: { at: 0.2 } }
  },
  bass: {
    type: 'square',
    level: 0.4,
    attack: 0.01,
    release: 0.3,
    noteLength: 2,
    detune: 0
  },
  drums: {
    level: 1,
    intensity: 0.8,
    variation: 0,
    kick: { start: 150, to: 0.01, decay: 0.5, level: 1 },
    snare: { level: 0.7, decay: 0.2, filter: { type: 'bandpass', freq: 1000 } },
    hat: { level: 0.3, decay: 0.05, filter: { type: 'highpass', freq: 5000 } }
  }
};

const BASE_MIXER = DEFAULT_MIXER;

function merge(base, override) {
  const result = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    const mergeable = value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object';
    result[key] = mergeable ? merge(current, value) : value;
  }
  return result;
}

const RAW_GENRES = {
  arcade: {
    label: 'ARCADE',
    icon: '🕹️',
    name: 'ARCADE RUNNER',
    tempo: 140,
    scales: {
      melody: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5'],
      bass: ['A2', 'C3', 'D3', 'E3', 'G3']
    },
    sounds: {
      lead: { filter: { start: 800, to: 3000, settle: { to: 800 } } },
      drums: { intensity: 0.8 }
    }
  },
  lofi: {
    label: 'LO-FI',
    icon: '☕',
    name: 'CHILL LO-FI',
    tempo: 85,
    scales: {
      melody: ['C4', 'E4', 'G4', 'B4', 'D5'],
      bass: ['C3', 'G2', 'A2', 'F2']
    },
    sounds: {
      melodyChance: 0.3,
      lead: { type: 'triangle', release: 0.6, filter: { start: 400, to: 1200, settle: { to: 400 } } },
      bass: { type: 'sine', release: 0.5 },
      drums: { level: 0.6, intensity: 0.4, snare: { filter: { freq: 800 } } }
    },
    mixer: { channels: { drums: { reverb: 0.28 } }, reverb: { size: 1.2 } }
  },
  dark: {
    label: 'DARK',
    icon: '🌑',
    name: 'DARK CYBER',
    tempo: 110,
    scales: {
      melody: ['E4', 'F4', 'G#4', 'A4', 'B4', 'C5'],
      bass: ['E2', 'F2', 'E2', 'B1']
    },
    sounds: {
      lead: { release: 0.2, filter: { start: 200, to: 4000, settle: { to: 200 } } },
      bass: { type: 'sawtooth', release: 0.4, detune: 10 },
      drums: { intensity: 0.6, kick: { start: 180 } }
    },
    mixer: { channels: { lead: { reverb: 0.32, delay: 0.12 } }, reverb: { size: 2.6, preDelay: 0.05 } }
  },
  glitch: {
    label: 'GLITCH',
    icon: '👾',
    name: 'GLITCH CHAOS',
    tempo: 160,
    scales: {
      melody: ['C4', 'C#4', 'F4', 'F#4', 'G4'],
      bass: ['C2', 'F#2', 'C3']
    },
    sounds: {
      lead: { type: 'square', release: 0.1, filter: { start: 2000, to: 500, settle: { at: 0.1, to: 100, linear: true } } },
      bass: { type: 'triangle', release: 0.2 },
      drums: { intensity: 0.9, variation: 0.3 }
    },
    mixer: { master: { crush: 0.35 }, channels: { drums: { reverb: 0.05 } }, delay: { division: 0.25, feedback: 0.45 } }
  },
  synthwave: {
    label: 'SYNTHWAVE',
    icon: '🌇',
    name: 'NEON DRIVE',
    tempo: 100,
    scales: {
      melody: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'],
      bass: ['A2', 'E3', 'F3', 'G3']
    },
    sounds: {
      melodyChance: 0.45,
      lead: {
        type: 'sawtooth',
        release: 0.9,
        noteLength: 2,
        filter: { start: 500, to: 4200, sweep: 0.12, settle: { at: 0.7, to: 1400 } }
      },
      bass: { type: 'sawtooth', release: 0.5, noteLength: 2 },
      drums: { intensity: 0.35, kick: { start: 130, decay: 0.6 }, snare: { level: 0.5, decay: 0.3, filter: { freq: 1600 } } }
    },
    mixer: {
      channels: { lead: { reverb: 0.34, delay: 0.3 }, bass: { reverb: 0.1 } },
      reverb: { size: 2.2, preDelay: 0.04 },
      delay: { division: 0.75, feedback: 0.42 },
      eq: { bass: 2, treble: 1.5 }
    }
  },
  chiptune: {
    label: 'CHIPTUNE',
    icon: '👾',
    name: 'PIXEL PIPELINE',
    tempo: 150,
    scales: {
      melody: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
      bass: ['C3', 'G2', 'A2', 'F2']
    },
    sounds: {
      melodyChance: 0.75,
      lead: {
        type: 'square',
        release: 0.14,
        noteLength: 1,
        filter: { start: 8000, to: 6500, sweep: 0.02, settle: { at: 0.1, to: 6000 } }
      },
      bass: { type: 'triangle', release: 0.18, noteLength: 1 },
      drums: { level: 0.85, intensity: 0.85, kick: { start: 200, decay: 0.25, level: 0.9 }, snare: { level: 0.6, decay: 0.12, filter: { freq: 2400 } }, hat: { level: 0.35, decay: 0.04, filter: { freq: 7000 } } }
    },
    mixer: {
      channels: { lead: { reverb: 0, delay: 0.05 }, drums: { reverb: 0, delay: 0 } },
      reverb: { size: 0.8, damp: 0.8 },
      delay: { division: 0.25, feedback: 0.2 }
    }
  },
  dungeon: {
    label: 'DUNGEON',
    icon: '🕯️',
    name: 'CRYPT DEPTHS',
    tempo: 80,
    scales: {
      melody: ['D3', 'E3', 'F3', 'A3', 'Bb3', 'C4'],
      bass: ['D2', 'A1', 'C2', 'F2']
    },
    sounds: {
      melodyChance: 0.35,
      lead: {
        type: 'triangle',
        level: 0.34,
        attack: 0.06,
        release: 1.1,
        noteLength: 4,
        filter: { start: 700, to: 1600, sweep: 0.3, settle: { at: 0.9, to: 500 } }
      },
      bass: { type: 'sine', release: 0.8, noteLength: 4 },
      drums: {
        level: 0.9,
        intensity: 0.3,
        kick: { start: 110, decay: 0.7, level: 1.1 },
        snare: { level: 0.45, decay: 0.35, filter: { freq: 600 } },
        hat: { level: 0.2, decay: 0.08, filter: { freq: 3600 } }
      }
    },
    mixer: {
      channels: { lead: { reverb: 0.45, delay: 0.18 }, drums: { reverb: 0.4 } },
      reverb: { size: 3.4, preDelay: 0.08, damp: 0.7 },
      delay: { division: 1, feedback: 0.3 },
      eq: { bass: 2.5, treble: -2 }
    }
  }
};

export const Genres = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_GENRES).map(([key, raw]) => {
      const { sounds, mixer, ...rest } = raw;
      return [key, Object.freeze({ ...rest, sounds: merge(BASE_SOUNDS, sounds || {}), mixer: merge(BASE_MIXER, mixer || {}) })];
    })
  )
);

export const GENRE_KEYS = Object.keys(RAW_GENRES);

export const GENRE_LIST = GENRE_KEYS.map((key) => ({ key, ...RAW_GENRES[key] }));

export function getGenre(key) {
  return Genres[key] || Genres.arcade;
}

export function hasGenre(key) {
  return Object.prototype.hasOwnProperty.call(Genres, key);
}
