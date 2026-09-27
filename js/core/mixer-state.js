import { clamp } from './theory.js';

export const CHANNELS = Object.freeze([
  { key: 'lead', label: 'LEAD' },
  { key: 'bass', label: 'BASS' },
  { key: 'drums', label: 'DRUMS' }
]);

export const DELAY_DIVISIONS = Object.freeze([
  { value: 0.25, label: '1/16' },
  { value: 0.5, label: '1/8' },
  { value: 0.75, label: '3/16' },
  { value: 1, label: '1/4' }
]);

export const EQ_BANDS = Object.freeze([
  { key: 'bass', label: 'BASS', frequency: 220, type: 'lowshelf' },
  { key: 'treble', label: 'TREBLE', frequency: 3600, type: 'highshelf' }
]);

export const MAX_EQ_DB = 12;
export const MAX_PREDELAY = 0.2;

export const DEFAULT_MIXER = Object.freeze({
  master: { volume: 0.35, mute: false, crush: 0 },
  channels: {
    lead: { volume: 1, mute: false, pan: 0, reverb: 0.1, delay: 0.05 },
    bass: { volume: 1, mute: false, pan: 0, reverb: 0.02, delay: 0 },
    drums: { volume: 1, mute: false, pan: 0, reverb: 0.16, delay: 0.03 }
  },
  reverb: { size: 1.6, preDelay: 0.02, damp: 0.6 },
  delay: { division: 0.75, feedback: 0.35, damp: 0.4 },
  eq: { bass: 0, treble: 0 }
});

function num(value, fallback, min, max) {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return clamp(parsed, min, max);
}

function flag(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function snapDivision(value, fallback) {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return DELAY_DIVISIONS.reduce(
    (best, item) => (Math.abs(item.value - parsed) < Math.abs(best - parsed) ? item.value : best),
    DELAY_DIVISIONS[0].value
  );
}

function channel(value, fallback) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    volume: num(source.volume, fallback.volume, 0, 1),
    mute: flag(source.mute, fallback.mute),
    pan: num(source.pan, fallback.pan, -1, 1),
    reverb: num(source.reverb, fallback.reverb, 0, 1),
    delay: num(source.delay, fallback.delay, 0, 1)
  };
}

export function sanitizeMixer(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const masterSource = source.master && typeof source.master === 'object' ? source.master : {};
  const reverbSource = source.reverb && typeof source.reverb === 'object' ? source.reverb : {};
  const delaySource = source.delay && typeof source.delay === 'object' ? source.delay : {};
  const eqSource = source.eq && typeof source.eq === 'object' ? source.eq : {};
  const channelsSource = source.channels && typeof source.channels === 'object' ? source.channels : {};

  const channels = {};
  for (const { key } of CHANNELS) {
    channels[key] = channel(channelsSource[key], DEFAULT_MIXER.channels[key]);
  }

  return {
    master: {
      volume: num(masterSource.volume, DEFAULT_MIXER.master.volume, 0, 1),
      mute: flag(masterSource.mute, DEFAULT_MIXER.master.mute),
      crush: num(masterSource.crush, DEFAULT_MIXER.master.crush, 0, 1)
    },
    channels,
    reverb: {
      size: num(reverbSource.size, DEFAULT_MIXER.reverb.size, 0.2, 4),
      preDelay: num(reverbSource.preDelay, DEFAULT_MIXER.reverb.preDelay, 0, MAX_PREDELAY),
      damp: num(reverbSource.damp, DEFAULT_MIXER.reverb.damp, 0, 1)
    },
    delay: {
      division: snapDivision(delaySource.division, DEFAULT_MIXER.delay.division),
      feedback: num(delaySource.feedback, DEFAULT_MIXER.delay.feedback, 0, 0.85),
      damp: num(delaySource.damp, DEFAULT_MIXER.delay.damp, 0, 1)
    },
    eq: {
      bass: num(eqSource.bass, DEFAULT_MIXER.eq.bass, -MAX_EQ_DB, MAX_EQ_DB),
      treble: num(eqSource.treble, DEFAULT_MIXER.eq.treble, -MAX_EQ_DB, MAX_EQ_DB)
    }
  };
}

export function patchMixer(state, changes) {
  const next = {
    master: { ...state.master },
    channels: {},
    reverb: { ...state.reverb },
    delay: { ...state.delay },
    eq: { ...state.eq }
  };
  for (const key of Object.keys(state.channels)) next.channels[key] = { ...state.channels[key] };
  for (const [path, value] of Object.entries(changes)) {
    const parts = path.split('.');
    let node = next;
    for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]];
    node[parts[parts.length - 1]] = value;
  }
  return sanitizeMixer(next);
}
