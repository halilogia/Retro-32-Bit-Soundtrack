import { GENRE_LIST } from './core/genres.js';
import { SequencerEngine } from './core/engine.js';
import { Visualizer } from './ui/visualizer.js';
import { MixerUI } from './ui/mixer-ui.js';
import { PresetsUI } from './ui/presets-ui.js';
import { SettingsUI } from './ui/settings-ui.js';
import { StatusLog } from './ui/status-log.js';
import { initTheme } from './ui/theme.js';
import { el } from './ui/controls.js';
import { Recorder } from './io/recorder.js';
import { exportMidi } from './io/midi.js';
import { encodeWav } from './io/wav.js';
import { downloadBlob, slugify, timestamp } from './io/download.js';
import { loadSession, saveSession } from './io/presets.js';
import { shareFromLocation } from './io/share.js';

const byId = (id) => document.getElementById(id);

const dom = {
  genre: byId('genreSelect'),
  play: byId('btnPlay'),
  random: byId('btnRandom'),
  record: byId('btnRecord'),
  midi: byId('btnMidi'),
  wav: byId('btnWav'),
  theme: byId('btnTheme'),
  status: byId('statusText'),
  log: byId('statusLog'),
  info: byId('engineInfo'),
  visualizer: byId('visualizer'),
  settings: byId('songSettings'),
  channels: byId('mixerChannels'),
  buses: byId('mixerBuses'),
  presetPanel: byId('presetPanel'),
  presetList: byId('presetList'),
  presetName: byId('presetName'),
  presetFile: byId('presetFile')
};

const TONE_CLASS = { info: '', ok: 'status-ok', warn: 'status-warn', error: 'status-error' };
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';

const statusLog = new StatusLog(dom.log);

function setStatus(text, tone = 'info') {
  dom.status.textContent = text;
  dom.status.className = `status ${TONE_CLASS[tone] || ''}`.trim();
  statusLog.push(text, tone);
}

const engine = new SequencerEngine();
const visualizer = new Visualizer(dom.visualizer, engine.steps);
const mixerUI = new MixerUI(engine, { channelsRoot: dom.channels, busesRoot: dom.buses });
const settingsUI = new SettingsUI(engine, dom.settings);

let saveTimer = null;
function scheduleSessionSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveSession({
      genre: engine.genreKey,
      mixer: engine.mixer,
      sequence: engine.sequence,
      settings: engine.settings
    });
  }, 600);
}

const presetsUI = new PresetsUI(engine, {
  list: dom.presetList,
  nameInput: dom.presetName,
  onApply: (preset) => {
    engine.loadState(preset);
    settingsUI.sync(engine.settings);
    visualizer.setStepCount(engine.steps);
    setStatus(`PRESET UYGULANDI: ${preset.name}`, 'ok');
  },
  onStatus: setStatus
});

const recorder = new Recorder({
  getStream: () => engine.getStream(),
  onStart: () => {
    dom.record.textContent = 'DURDUR';
    dom.record.classList.add('recording');
    setStatus('KAYIT YAPILIYOR...', 'error');
  },
  onComplete: (blob, extension) => {
    downloadBlob(blob, `pixel-synth-${engine.genreKey}-${timestamp()}.${extension}`);
    setStatus('KAYIT İNDİRİLDİ.', 'ok');
  },
  onError: (message) => setStatus(message, 'error')
});

let wavBusy = false;

function fillGenres() {
  dom.genre.textContent = '';
  for (const genre of GENRE_LIST) {
    dom.genre.append(el('option', { value: genre.key, text: `${genre.icon} ${genre.label}` }));
  }
}

function syncTransport() {
  dom.play.textContent = engine.isPlaying ? 'DURDUR' : 'BAŞLAT';
  dom.play.classList.toggle('is-active', engine.isPlaying);
  dom.record.disabled = !engine.isPlaying || !recorder.supported;
  dom.record.classList.toggle('recording', recorder.recording);
  dom.record.textContent = recorder.recording ? 'DURDUR' : 'REC';
}

function setEngineInfo(detail) {
  if (!dom.info) return;
  const rate = detail.sampleRate ? `${(detail.sampleRate / 1000).toFixed(1)} KHZ` : '';
  const crusher = detail.crusher === 'waveshaper' ? 'WAVESHAPER' : 'AUDIOWORKLET';
  dom.info.textContent = `İŞLEMCİ: ${crusher} · GÜRÜLTÜ: ${
    detail.worklets && detail.worklets.includes('retro-noise') ? 'WORKLET' : 'BUFFER'
  } ${rate}`;
}

async function togglePlay() {
  try {
    await engine.toggle();
    syncTransport();
    if (engine.isPlaying) {
      setStatus(`ÇALIYOR: ${engine.genre.name} [${engine.tempo} BPM]`, 'ok');
    } else {
      setStatus('DURAKLATILDI.');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function newSong() {
  engine.newSong();
  setStatus(`YENİ ${engine.genre.name} OLUŞTURULDU.`, 'warn');
}

function changeGenre() {
  engine.setGenre(dom.genre.value);
  settingsUI.sync(engine.settings);
  if (engine.isPlaying) {
    setStatus(`MOD DEĞİŞTİ: ${engine.genre.name} ÇALIYOR...`, 'warn');
  } else {
    setStatus(`MOD: ${engine.genre.name} [${engine.tempo} BPM]`, 'warn');
  }
}

function toggleRecord() {
  if (recorder.recording) recorder.stop();
  else recorder.start();
  syncTransport();
}

function exportMidiFile() {
  try {
    const size = exportMidi(engine.sequence, engine.genre);
    setStatus(`MIDI İNDİRİLDİ (${size} BAYT).`, 'ok');
  } catch (error) {
    setStatus(`MIDI HATASI: ${error.message}`, 'error');
  }
}

async function exportWavFile() {
  if (wavBusy) return;
  wavBusy = true;
  dom.wav.disabled = true;
  setStatus('ÇEVRİMDIŞI RENDER EDİLİYOR...', 'warn');
  try {
    const { buffer, loops } = await engine.renderOffline({ loops: 2, sampleRate: 44100 });
    const blob = encodeWav(buffer);
    downloadBlob(blob, `retro-synth-${slugify(engine.genre.name)}-${timestamp()}.wav`);
    setStatus(`WAV İNDİRİLDİ (${loops} DÖNGÜ, ${buffer.duration.toFixed(1)} SN).`, 'ok');
  } catch (error) {
    setStatus(`WAV HATASI: ${error.message}`, 'error');
  } finally {
    wavBusy = false;
    dom.wav.disabled = false;
  }
}

function bindControls() {
  dom.play.addEventListener('click', togglePlay);
  dom.random.addEventListener('click', newSong);
  dom.genre.addEventListener('change', changeGenre);
  dom.record.addEventListener('click', toggleRecord);
  dom.midi.addEventListener('click', exportMidiFile);
  dom.wav.addEventListener('click', exportWavFile);
  initTheme(dom.theme);

  byId('presetSave').addEventListener('click', () => presetsUI.save());
  byId('presetExport').addEventListener('click', () => presetsUI.export());
  byId('presetImport').addEventListener('click', () => dom.presetFile.click());
  byId('presetShare').addEventListener('click', () => presetsUI.share());
  dom.presetFile.addEventListener('change', async () => {
    const [file] = dom.presetFile.files;
    dom.presetFile.value = '';
    if (file) await presetsUI.import(file);
  });
  dom.presetName.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') presetsUI.save();
  });
  presetsUI.bindDropZone(dom.presetPanel);
}

function bindKeyboard() {
  window.addEventListener('keydown', (event) => {
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    } else if (event.key.toLowerCase() === 'r') {
      newSong();
    } else if (event.key.toLowerCase() === 'm') {
      engine.update({ 'master.mute': !engine.mixer.master.mute });
    } else if (event.key.toLowerCase() === 'w') {
      exportWavFile();
    }
  });
}

function bindEngine() {
  engine.onState(({ type, detail }) => {
    if (type === 'play' || type === 'pause') syncTransport();
    if (type === 'genre') {
      dom.genre.value = engine.genreKey;
      settingsUI.sync(engine.settings);
      scheduleSessionSave();
    }
    if (type === 'settings') {
      settingsUI.sync(detail);
      visualizer.setStepCount(detail.steps);
      scheduleSessionSave();
    }
    if (type === 'sequence') scheduleSessionSave();
    if (type === 'context') setEngineInfo(detail);
  });
  engine.onMixer(() => scheduleSessionSave());
  engine.onFrame(({ events, levels }) => {
    for (const event of events) visualizer.pulse(event.index, event.kind);
    mixerUI.updateMeters(levels);
  });
}

function bindVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && engine.isPlaying) {
      engine.ensureContext().then(() => engine.resync()).catch(() => {});
    }
  });
}

function loadRetroFont() {
  if (!document.head || document.querySelector(`link[data-font="${FONT_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  link.dataset.font = FONT_HREF;
  document.head.append(link);
}

function registerServiceWorker() {
  if (globalThis.__RETRO_STANDALONE__) return;
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service Worker kaydedilemedi:', error);
    });
  });
}

function boot() {
  fillGenres();
  bindControls();
  bindKeyboard();
  bindEngine();
  bindVisibility();
  registerServiceWorker();

  const shared = shareFromLocation();
  const session = shared || loadSession();
  if (session) {
    engine.loadState(session);
    dom.genre.value = engine.genreKey;
    dom.presetName.value = session.name;
    mixerUI.sync(engine.mixer);
    settingsUI.sync(engine.settings);
    visualizer.setStepCount(engine.steps);
    setStatus(
      shared ? `PAYLAŞILAN ŞARKI YÜKLENDİ: ${session.name}` : `OTURUM GERİ YÜKLENDİ: ${session.name}`,
      'info'
    );
  } else {
    engine.newSong();
    setStatus('SİSTEM HAZIR. TÜRÜ SEÇ VE BAŞLAT.');
  }

  presetsUI.render();
  mixerUI.sync(engine.mixer);
  syncTransport();
  loadRetroFont();
}

boot();
