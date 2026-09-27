import { hasGenre } from '../core/genres.js';
import { sanitizeSequence } from '../core/composer.js';
import { sanitizeSettings } from '../core/song-settings.js';
import { sanitizeMixer } from '../core/mixer-state.js';
import { downloadBlob, slugify, timestamp } from './download.js';

const APP = 'retro-32-bit-soundtrack';
const VERSION = 2;
const STORE_KEY = `${APP}.presets.v2`;
const SESSION_KEY = `${APP}.session.v2`;
const MAX_PRESETS = 40;
const MAX_NAME = 24;

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Depolama okunamadı:', error);
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Depolamaya yazılamadı:', error);
    return false;
  }
}

export function cleanName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  return (name || 'PRESET').slice(0, MAX_NAME);
}

export function createPreset({ name, genre, mixer, sequence, settings }) {
  const clean = sanitizeSettings(settings);
  return {
    app: APP,
    version: VERSION,
    name: cleanName(name),
    createdAt: new Date().toISOString(),
    genre: hasGenre(genre) ? genre : 'arcade',
    settings: clean,
    mixer: sanitizeMixer(mixer),
    sequence: sanitizeSequence(sequence, clean.steps)
  };
}

export function validatePreset(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Geçersiz preset dosyası.');
  if (raw.app && raw.app !== APP) throw new Error('Bu dosya farklı bir uygulamaya ait.');
  if (typeof raw.version === 'number' && raw.version > VERSION) {
    console.warn(`Preset v${raw.version} daha yeni, bilinmeyen alanlar atlandı.`);
  }
  return createPreset({
    name: raw.name,
    genre: raw.genre,
    mixer: raw.mixer,
    sequence: raw.sequence,
    settings: raw.settings
  });
}

export function listPresets() {
  const store = readStore(STORE_KEY);
  if (!Array.isArray(store)) return [];
  return store
    .map((item) => {
      try {
        return validatePreset(item);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

export function savePreset(input) {
  const preset = validatePreset(input);
  const existing = listPresets().filter((item) => item.name !== preset.name);
  const next = [...existing, preset].slice(-MAX_PRESETS);
  if (!writeStore(STORE_KEY, next)) throw new Error('Tarayıcı depolaması dolu, preset kaydedilemedi.');
  return preset;
}

export function deletePreset(name) {
  const next = listPresets().filter((item) => item.name !== name);
  writeStore(STORE_KEY, next);
  return next;
}

export function getPreset(name) {
  return listPresets().find((item) => item.name === name) || null;
}

export function saveSession(state) {
  const settings = sanitizeSettings(state.settings);
  const session = {
    app: APP,
    version: VERSION,
    savedAt: new Date().toISOString(),
    genre: hasGenre(state.genre) ? state.genre : 'arcade',
    settings,
    mixer: sanitizeMixer(state.mixer),
    sequence: sanitizeSequence(state.sequence, settings.steps)
  };
  writeStore(SESSION_KEY, session);
  return session;
}

export function loadSession() {
  const session = readStore(SESSION_KEY);
  if (!session) return null;
  try {
    return validatePreset(session);
  } catch (error) {
    clearSession();
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    void error;
  }
}

export function exportPresetFile(preset) {
  const json = JSON.stringify(validatePreset(preset), null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), `retro-synth-${slugify(preset.name)}-${timestamp()}.json`);
}

export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch (error) {
        reject(new Error('JSON çözümlenemedi.'));
      }
    };
    reader.readAsText(file);
  });
}

export async function importPresetFile(file) {
  return validatePreset(await readJSONFile(file));
}
