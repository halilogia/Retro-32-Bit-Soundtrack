const BASE_SOUNDS = {
  melodyChance: 0.6,
  bassChance: { onBeat: 0.8, offBeat: 0.1 },
  lead: {
    type: 'sawtooth',
    level: 0.3,
    attack: 0.02,
    release: 0.4,
    filter: { type: 'lowpass', start: 2000, to: 3000, sweep: 0.05, settle: { at: 0.2 } }
  },
  bass: {
    type: 'square',
    level: 0.4,
    attack: 0.01,
    release: 0.3,
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
    }
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
    }
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
    }
  }
};

export const Genres = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_GENRES).map(([key, raw]) => {
      const { sounds, ...rest } = raw;
      return [key, Object.freeze({ ...rest, sounds: merge(BASE_SOUNDS, sounds || {}) })];
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
