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

export const DEFAULT_MIXER = Object.freeze({
  master: { volume: 0.35, mute: false, crush: 0 },
  channels: {
    lead: { volume: 1, mute: false, reverb: 0.1, delay: 0.05 },
    bass: { volume: 1, mute: false, reverb: 0.02, delay: 0 },
    drums: { volume: 1, mute: false, reverb: 0.16, delay: 0.03 }
  },
  reverb: { size: 1.6, damp: 0.6 },
  delay: { division: 0.75, feedback: 0.35, damp: 0.4 }
});

function num(value, fallback, min, max) {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return clamp(parsed, min, max);
}

function flag(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function channel(value, fallback) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    volume: num(source.volume, fallback.volume, 0, 1),
    mute: flag(source.mute, fallback.mute),
    reverb: num(source.reverb, fallback.reverb, 0, 1),
    delay: num(source.delay, fallback.delay, 0, 1)
  };
}

export function sanitizeMixer(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const masterSource = source.master && typeof source.master === 'object' ? source.master : {};
  const reverbSource = source.reverb && typeof source.reverb === 'object' ? source.reverb : {};
  const delaySource = source.delay && typeof source.delay === 'object' ? source.delay : {};
  const channelsSource = source.channels && typeof source.channels === 'object' ? source.channels : {};

  const channels = {};
  for (const { key } of CHANNELS) {
    channels[key] = channel(channelsSource[key], DEFAULT_MIXER.channels[key]);
  }

  const division = num(delaySource.division, DEFAULT_MIXER.delay.division, 0.25, 1);
  const matched = DELAY_DIVISIONS.find((item) => item.value === division);

  return {
    master: {
      volume: num(masterSource.volume, DEFAULT_MIXER.master.volume, 0, 1),
      mute: flag(masterSource.mute, DEFAULT_MIXER.master.mute),
      crush: num(masterSource.crush, DEFAULT_MIXER.master.crush, 0, 1)
    },
    channels,
    reverb: {
      size: num(reverbSource.size, DEFAULT_MIXER.reverb.size, 0.2, 4),
      damp: num(reverbSource.damp, DEFAULT_MIXER.reverb.damp, 0, 1)
    },
    delay: {
      division: matched ? matched.value : DEFAULT_MIXER.delay.division,
      feedback: num(delaySource.feedback, DEFAULT_MIXER.delay.feedback, 0, 0.85),
      damp: num(delaySource.damp, DEFAULT_MIXER.delay.damp, 0, 1)
    }
  };
}

export function patchMixer(state, changes) {
  const next = {
    master: { ...state.master },
    channels: {},
    reverb: { ...state.reverb },
    delay: { ...state.delay }
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
