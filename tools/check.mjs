import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
let failures = 0;

function assert(label, condition, detail = '') {
  const ok = !!condition;
  if (!ok) failures += 1;
  checks.push(`${ok ? 'GECTI' : 'KALDI'}  ${label}${detail ? ` -> ${detail}` : ''}`);
}

function equal(label, actual, expected) {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  assert(label, same, same ? '' : `beklenen ${JSON.stringify(expected)}, gelen ${JSON.stringify(actual)}`);
}

function listFiles(dir, extensions) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, extensions));
    else if (extensions.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    get length() {
      return map.size;
    }
  };
}

globalThis.window = globalThis.window || {};
globalThis.localStorage = createStorage();

class FakeParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }
  setValueAtTime(value) {
    this.value = value;
    this.events.push(['set', value]);
  }
  setTargetAtTime(value) {
    this.value = value;
    this.events.push(['target', value]);
  }
  exponentialRampToValueAtTime(value) {
    this.value = value;
    this.events.push(['exp', value]);
  }
  linearRampToValueAtTime(value) {
    this.value = value;
    this.events.push(['lin', value]);
  }
}

class FakeNode {
  constructor(kind) {
    this.kind = kind;
    this.gain = new FakeParam(1);
    this.frequency = new FakeParam(350);
    this.detune = new FakeParam(0);
    this.delayTime = new FakeParam(0);
    this.Q = new FakeParam(1);
    this.threshold = new FakeParam(-24);
    this.knee = new FakeParam(30);
    this.ratio = new FakeParam(12);
    this.attack = new FakeParam(0);
    this.release = new FakeParam(0.25);
    this.type = 'sine';
    this.buffer = null;
    this.loop = false;
    this.outputs = [];
    this.inputs = [];
    this.started = [];
    this.stopped = [];
    this.disconnected = false;
  }
  connect(target) {
    this.outputs.push(target);
    if (target && target.inputs) target.inputs.push(this);
    return target;
  }
  disconnect() {
    this.disconnected = true;
  }
  getFloatTimeDomainData(array) {
    array.fill(0);
  }
  start(time) {
    this.started.push(time);
  }
  stop(time) {
    this.stopped.push(time);
  }
}

function createFakeContext() {
  return {
    currentTime: 0,
    sampleRate: 48000,
    state: 'running',
    resume: async () => {},
    close: async () => {},
    destination: new FakeNode('destination'),
    createGain: () => new FakeNode('gain'),
    createOscillator: () => new FakeNode('osc'),
    createBiquadFilter: () => new FakeNode('filter'),
    createConvolver: () => new FakeNode('convolver'),
    createDelay: (max) => {
      const node = new FakeNode('delay');
      node.maxDelay = max;
      return node;
    },
    createBufferSource: () => new FakeNode('bufferSource'),
    createDynamicsCompressor: () => new FakeNode('compressor'),
    createAnalyser: () => new FakeNode('analyser'),
    createMediaStreamDestination: () => {
      const node = new FakeNode('streamDest');
      node.stream = { getAudioTracks: () => [{ kind: 'audio' }] };
      return node;
    },
    createBuffer: (channels, length, sampleRate) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return {
        length,
        sampleRate,
        numberOfChannels: channels,
        getChannelData: (index = 0) => data[index]
      };
    }
  };
}

async function importModule(relativePath) {
  const url = pathToFileURL(join(ROOT, relativePath)).href;
  return import(url);
}

function parseMidi(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const readText = () => {
    let text = '';
    for (let i = 0; i < 4; i++) text += String.fromCharCode(bytes[offset + i]);
    offset += 4;
    return text;
  };
  const readU32 = () => {
    const value = view.getUint32(offset);
    offset += 4;
    return value;
  };

  const headerId = readText();
  const headerLength = readU32();
  const format = view.getUint16(offset);
  const trackCount = view.getUint16(offset + 2);
  const division = view.getUint16(offset + 4);
  offset += headerLength;

  const tracks = [];
  while (offset < bytes.length) {
    const id = readText();
    const length = readU32();
    const data = bytes.slice(offset, offset + length);
    offset += length;
    let index = 0;
    let tick = 0;
    let running = 0;
    const events = [];
    while (index < data.length) {
      let delta = 0;
      let byte = 0;
      do {
        byte = data[index++];
        delta = (delta << 7) | (byte & 0x7f);
      } while (byte & 0x80);
      tick += delta;
      let status = data[index];
      if (status & 0x80) {
        running = status;
        index += 1;
      } else {
        status = running;
      }
      if (status === 0xff) {
        const type = data[index++];
        const size = data[index++];
        const body = Array.from(data.slice(index, index + size));
        index += size;
        events.push({ tick, kind: 'meta', type, body });
      } else if (status === 0xf0 || status === 0xf7) {
        const size = data[index++];
        index += size;
        events.push({ tick, kind: 'sysex' });
      } else {
        const type = status & 0xf0;
        const channel = status & 0x0f;
        const d1 = data[index++];
        const d2 = type === 0xc0 || type === 0xd0 ? undefined : data[index++];
        events.push({ tick, kind: 'midi', type, channel, d1, d2 });
      }
    }
    tracks.push({ id, length, tick, events });
  }

  return { headerId, headerLength, format, trackCount, division, tracks, consumed: offset, total: bytes.length };
}

function countNotes(track, type) {
  return track.events.filter((event) => event.kind === 'midi' && event.type === type).length;
}

async function run() {
  const sourceFiles = [...listFiles(join(ROOT, 'js'), ['.js']), join(ROOT, 'sw.js')];
  const buildFiles = listFiles(join(ROOT, 'tools'), ['.mjs']);
  for (const file of [...sourceFiles, ...buildFiles]) {
    const name = relative(ROOT, file).split(sep).join('/');
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      assert(`sozdizimi ${name}`, true);
    } catch (error) {
      assert(`sozdizimi ${name}`, false, String(error.stderr || error.message).split('\n')[0]);
    }
  }

  const theory = await importModule('js/core/theory.js');
  equal('noteToMidi C4', theory.noteToMidi('C4'), 60);
  equal('noteToMidi A4', theory.noteToMidi('A4'), 69);
  equal('noteToMidi G#4', theory.noteToMidi('G#4'), 68);
  equal('noteToMidi B1', theory.noteToMidi('B1'), 35);
  equal('noteToMidi x', theory.noteToMidi('x'), null);
  assert('noteToFreq A3', Math.abs(theory.noteToFreq('A3') - 220) < 0.01, String(theory.noteToFreq('A3')));
  assert(
    'nota Perde donusumu',
    Math.abs(theory.midiToFreq(theory.noteToMidi('C4')) - 261.63) < 0.01,
    String(theory.midiToFreq(theory.noteToMidi('C4')))
  );

  const genresModule = await importModule('js/core/genres.js');
  equal('tur sayisi', genresModule.GENRE_KEYS.length, 4);
  for (const key of genresModule.GENRE_KEYS) {
    const genre = genresModule.getGenre(key);
    assert(`${key} tempo`, genre.tempo > 0 && genre.tempo < 300, String(genre.tempo));
    assert(
      `${key} gamlar gecerli`,
      [...genre.scales.melody, ...genre.scales.bass].every((note) => theory.isNote(note))
    );
    assert(
      `${key} ses parametreleri tam`,
      genre.sounds.lead.type &&
        genre.sounds.lead.filter.start > 0 &&
        genre.sounds.lead.filter.to > 0 &&
        genre.sounds.bass.type &&
        genre.sounds.drums.kick.start > 0 &&
        genre.sounds.drums.snare.filter.freq > 0 &&
        genre.sounds.drums.hat.filter.freq > 0 &&
        genre.sounds.melodyChance > 0 &&
        genre.sounds.bassChance.offBeat >= 0
    );
  }
  equal('bilinmeyen tur yedek doner', genresModule.hasGenre('bossa'), false);

  const composer = await importModule('js/core/composer.js');
  const song = composer.composeSong(genresModule.getGenre('arcade'));
  equal('beste uzunlugu', song.melody.length, 32);
  assert('melodi gecerli', song.melody.every((note) => theory.isNote(note) || note === 'x'));
  assert('bas gecerli', song.bass.every((note) => theory.isNote(note) || note === 'x'));
  assert('davul gecerli', song.drums.every((value) => [0, 1, 2, 3].includes(value)));
  const sanitized = composer.sanitizeSequence({ melody: ['C4', 5, null], bass: 'nope', drums: [9] });
  equal('bozuk veri temizlenir', sanitized.melody.length, 32);
  equal('bozuk eleman atilir', sanitized.melody[1], 'x');
  assert('davul varsayilana doner', sanitized.drums.every((value) => [0, 1, 2, 3].includes(value)));

  const mixerState = await importModule('js/core/mixer-state.js');
  const mixer = mixerState.sanitizeMixer({
    master: { volume: 5, mute: 'yes', crush: -1 },
    channels: { lead: { volume: 0.5, reverb: 9 } },
    delay: { division: 0.4, feedback: 4 }
  });
  equal('master volume kirpilir', mixer.master.volume, 1);
  equal('master mute varsayilan', mixer.master.mute, false);
  equal('crush kirpilir', mixer.master.crush, 0);
  equal('lead volume korunur', mixer.channels.lead.volume, 0.5);
  equal('reverb kirpilir', mixer.channels.lead.reverb, 1);
  equal('gecersiz division yedek', mixer.delay.division, 0.75);
  equal('feedback kirpilir', mixer.delay.feedback, 0.85);
  equal('kanal sayisi', Object.keys(mixer.channels).length, 3);
  const patched = mixerState.patchMixer(mixer, { 'channels.bass.mute': true, 'reverb.size': 2.5 });
  equal('yol bazli patch mute', patched.channels.bass.mute, true);
  equal('yol bazli patch reverb', patched.reverb.size, 2.5);
  equal('patch kaynak nesneyi bozmaz', mixer.channels.bass.mute, false);

  const effects = await importModule('js/core/effects.js');
  const fakeContext = createFakeContext();
  const destination = new FakeNode('mix');
  const delay = new effects.DelayBus(fakeContext, destination);
  delay.setTime(0.75);
  equal('delay suresi', delay.delayNode.delayTime.value, 0.75);
  delay.setTime(9);
  assert('delay ust sinirla kirpilir', delay.delayNode.delayTime.value < 2, String(delay.delayNode.delayTime.value));
  delay.setFeedback(3);
  equal('feedback ust sinirla kirpilir', delay.feedback.gain.value, 0.85);
  delay.setDamp(0);
  assert('damp en yuksek frekans', delay.damp.frequency.value > 15000, String(delay.damp.frequency.value));
  delay.setDamp(1);
  assert('damp en dusuk frekans', delay.damp.frequency.value < 1000, String(delay.damp.frequency.value));
  const reverb = new effects.ReverbBus(fakeContext, destination);
  assert('reverb zinciri bagli', reverb.input.outputs.includes(reverb.convolver));
  const impulse = effects.createImpulseResponse(fakeContext, 1);
  const data = impulse.getChannelData(0);
  const head = data.slice(0, Math.floor(data.length * 0.1));
  const tail = data.slice(Math.floor(data.length * 0.9));
  const rms = (chunk) => Math.sqrt(chunk.reduce((sum, value) => sum + value * value, 0) / chunk.length);
  assert('impulse sonu sifirliyor', rms(tail) < rms(head) * 0.2, `${rms(tail).toFixed(5)} / ${rms(head).toFixed(5)}`);
  assert('impulse sonlu', data.every((value) => Number.isFinite(value)));

  const instruments = await importModule('js/core/instruments.js');
  const arcade = genresModule.getGenre('arcade');
  const glitch = genresModule.getGenre('glitch');
  const leadDest = new FakeNode('strip');
  assert('durak notasi calinmaz', instruments.playLead(fakeContext, leadDest, arcade, 'x', 0) === false);
  assert('melodi notasi calinir', instruments.playLead(fakeContext, leadDest, arcade, 'A3', 1) === true);
  const leadGain = leadDest.inputs[0];
  const leadFilter = leadGain.inputs[0];
  const leadOsc = leadFilter.inputs[0];
  equal('lead osilator tipi', leadOsc.type, 'sawtooth');
  equal('lead osilator frekansi', leadOsc.frequency.value, 220);
  equal('lead filtresi turu', leadFilter.type, 'lowpass');
  equal('lead filtresi settle', leadFilter.frequency.value, 800);
  equal('lead kazanc zarfı', leadGain.gain.value, 0.01);
  equal('lead baslangic zamanı', leadOsc.started[0], 1);
  assert('lead durdurma suresi', leadOsc.stopped[0] > 1.4 && leadOsc.stopped[0] < 1.6, String(leadOsc.stopped[0]));
  instruments.playLead(fakeContext, leadDest, glitch, 'C4', 0);
  const glitchGain = leadDest.inputs[leadDest.inputs.length - 1];
  equal('glitch osilator tipi', glitchGain.inputs[0].inputs[0].type, 'square');
  equal('glitch filtresi settle', glitchGain.inputs[0].frequency.value, 100);
  const bassDest = new FakeNode('strip');
  instruments.playBass(fakeContext, bassDest, genresModule.getGenre('dark'), 'E2', 0);
  equal('dark bas detune', bassDest.inputs[0].inputs[0].detune.value, 10);
  const bassDestLofi = new FakeNode('strip');
  instruments.playBass(fakeContext, bassDestLofi, genresModule.getGenre('lofi'), 'E2', 0);
  equal('lofi bas tipi', bassDestLofi.inputs[0].inputs[0].type, 'sine');

  const noise = new instruments.NoisePool(fakeContext, false);
  const drumDest = new FakeNode('strip');
  const end = noise.hit(drumDest, { filterType: 'bandpass', filterFreq: 1000, level: 0.7, decay: 0.2, time: 0 });
  assert('gürültü vuruşu bitis suresi', end > 0.2 && end < 0.3, String(end));
  const noiseHit = drumDest.inputs[drumDest.inputs.length - 1];
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, (end + 0.15) * 1000) + 80));
  assert('gürültü zinciri temizlendi', noiseHit.disconnected === true);

  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.window.AudioContext = function AudioContextShim() {
    return createFakeContext();
  };

  const engineModule = await importModule('js/core/engine.js');
  const engine = new engineModule.SequencerEngine();
  await engine.ensureContext();
  assert('motor hazır', engine.ready === true);
  assert('kayıt akışı var', !!engine.getStream());
  equal('kayıt parçası kanal içeriyor', engine.getStream().getAudioTracks().length, 1);
  assert('lead girişi şeride bağlı', engine.strips.lead.input.outputs[0] === engine.strips.lead.gain);
  assert('şerit reverb gönderimi bağlı', engine.strips.lead.reverbSend.outputs[0] === engine.reverb.input);
  assert('şerit delay gönderimi bağlı', engine.strips.lead.delaySend.outputs[0] === engine.delay.input);
  assert('şerit master hattına bağlı', engine.strips.lead.gain.outputs.includes(engine.bus));
  assert('master zinciri', engine.bus.outputs[0] === engine.masterGain);
  assert('kompresör master kazancına bağlı', engine.masterGain.outputs[0] === engine.compressor);
  assert('analizör kompresöre bağlı', engine.compressor.outputs.includes(engine.masterMeter.analyser));

  engine.update({ 'channels.lead.volume': 0.25, 'master.mute': true });
  equal('fader değeri düğümlere yazılır', engine.strips.lead.gain.gain.value, 0.25);
  equal('master mute uygulanır', engine.masterGain.gain.value, 0);
  engine.update({ 'master.mute': false });
  equal('master mute açılır', engine.masterGain.gain.value, 0.35);
  equal('varsayılan master seviyesi', engine.mixer.master.volume, 0.35);

  equal('tür değiştirilir', engine.setGenre('lofi'), 'lofi');
  equal('tempo türden gelir', engine.tempo, 85);
  equal('yeni beste üretilir', engine.sequence.melody.length, 32);
  equal('geçersiz tür reddedilir', engine.setGenre('yok-böyle'), 'lofi');
  engine.update({ 'reverb.size': 3 });
  equal('reverb boyutu güncellenir', engine.reverb.size, 3);

  engine.loadState({ genre: 'dark', mixer, sequence: song });
  equal('oturum türü yüklenir', engine.genreKey, 'dark');
  equal('oturum mikseri yüklenir', engine.mixer.channels.lead.volume, mixer.channels.lead.volume);
  equal('oturum bestesi yüklenir', engine.sequence.melody, song.melody);
  equal('tempo oturumdan', engine.tempo, 110);

  await engine.play();
  assert('çalmaya başlar', engine.isPlaying === true);
  assert('zamanlayıcı adım planladı', engine.events.length > 0, String(engine.events.length));
  assert('görsel olaylar geçerli', engine.events.every((event) => event.index >= 0 && event.index < 32));
  engine.pause();
  assert('duraklar', engine.isPlaying === false);
  equal('durdurulunca olaylar temizlenir', engine.events.length, 0);
  const levels = engine.readLevels();
  assert('seviye kanalları', Object.keys(levels).length === 4, Object.keys(levels).join(','));
  equal('sessizlik seviyesi sıfır', levels.master, 0);
  await engine.dispose();
  assert('kaynaklar serbest bırakıldı', engine.ready === false);

  const midi = await importModule('js/io/midi.js');
  const melody = new Array(32).fill('x');
  const bass = new Array(32).fill('x');
  const drums = new Array(32).fill(0);
  for (const step of [0, 8, 16, 24]) melody[step] = 'C4';
  for (const step of [0, 16]) bass[step] = 'C2';
  for (const step of [0, 16]) drums[step] = 1;
  for (const step of [4, 20]) drums[step] = 2;
  for (const step of [2, 6]) drums[step] = 3;

  const file = parseMidi(midi.buildMidi({ melody, bass, drums }, arcade));
  equal('MThd başlığı', file.headerId, 'MThd');
  equal('MThd uzunluğu', file.headerLength, 6);
  equal('format 1', file.format, 1);
  equal('dört parça', file.trackCount, 4);
  equal('bölme çözünürlüğü', file.division, 480);
  equal('parça sayısı', file.tracks.length, 4);
  equal('dosya tamamen okundu', file.consumed, file.total);
  assert('tüm parçalar biter', file.tracks.every((track) => track.length > 0 && track.id === 'MTrk'));
  const tempoEvent = file.tracks[0].events.find((event) => event.kind === 'meta' && event.type === 0x51);
  const microseconds = (tempoEvent.body[0] << 16) | (tempoEvent.body[1] << 8) | tempoEvent.body[2];
  equal('tempo değeri', Math.round(60000000 / microseconds), arcade.tempo);
  assert('tempo izi bulundu', !!tempoEvent);
  const loopTicks = 32 * 120;
  assert(
    'nota parçaları döngü sonunda bitiyor',
    file.tracks.slice(1).every((track) => track.tick === loopTicks),
    file.tracks.map((track) => track.tick).join(',')
  );
  assert('tempo parçası 0da bitiyor', file.tracks[0].tick === 0);
  const [meta, leadTrack, bassTrack, drumTrack] = file.tracks;
  assert('melodi parçası 4 nota', countNotes(leadTrack, 0x90) === 4, String(countNotes(leadTrack, 0x90)));
  assert('bas parçası 2 nota', countNotes(bassTrack, 0x90) === 2, String(countNotes(bassTrack, 0x90)));
  assert('davul parçası 6 nota', countNotes(drumTrack, 0x90) === 6, String(countNotes(drumTrack, 0x90)));
  assert('melodi kanalı 0', leadTrack.events.filter((e) => e.kind === 'midi' && e.type === 0x90).every((e) => e.channel === 0));
  assert('davul kanalı 9', drumTrack.events.filter((e) => e.kind === 'midi' && e.type === 0x90).every((e) => e.channel === 9));
  assert(
    'davul notaları GM',
    drumTrack.events.filter((e) => e.kind === 'midi' && e.type === 0x90).every((e) => [36, 38, 42].includes(e.d1))
  );
  assert(
    'melodi perde C4=60',
    leadTrack.events.filter((e) => e.kind === 'midi' && e.type === 0x90).every((e) => e.d1 === 60)
  );
  assert(
    'nota kapatma sayıları eşit',
    file.tracks.every((track) => countNotes(track, 0x90) === countNotes(track, 0x80)),
    file.tracks.map((track) => `${countNotes(track, 0x90)}/${countNotes(track, 0x80)}`).join(' ')
  );
  assert('her parça end-of-track ile bitiyor', file.tracks.every((track) => {
    const last = track.events[track.events.length - 1];
    return last.kind === 'meta' && last.type === 0x2f;
  }));
  assert('tempo parçasında nota yok', countNotes(meta, 0x90) === 0);

  const presets = await importModule('js/io/presets.js');
  const preset = presets.createPreset({ name: '  Test Preset  ', genre: 'lofi', mixer, sequence: song });
  equal('preset adı temizlenir', preset.name, 'Test Preset');
  equal('preset sürümü', preset.version, 2);
  assert('preset dizileri dolu', preset.sequence.melody.length === 32);
  presets.savePreset(preset);
  presets.savePreset({ ...preset, name: 'ikinci' });
  equal('preset listesi', presets.listPresets().map((item) => item.name), ['ikinci', 'Test Preset']);
  equal('preset yüklenir', presets.getPreset('Test Preset').genre, 'lofi');
  presets.savePreset({ ...preset, name: 'Test Preset', mixer: { master: { volume: 0.8 } } });
  equal('preset güncellenir', presets.getPreset('Test Preset').mixer.master.volume, 0.8);
  presets.deletePreset('ikinci');
  equal('preset silinir', presets.listPresets().length, 1);
  let rejected = 0;
  try {
    presets.validatePreset({ app: 'başka-uygulama' });
  } catch (error) {
    rejected = 1;
  }
  assert('yabancı preset reddedilir', rejected === 1);
  assert('bozuk preset reddedilir', (() => {
    try {
      presets.validatePreset({ name: 'x', genre: 'yok-böyle-tür', sequence: { melody: 'çöp' } });
      return true;
    } catch (error) {
      return false;
    }
  })());
  presets.saveSession({ genre: 'dark', mixer, sequence: song });
  equal('oturum geri yüklenir', presets.loadSession().genre, 'dark');
  presets.clearSession();
  equal('oturum temizlenir', presets.loadSession(), null);

  const recorder = await importModule('js/io/recorder.js');
  equal('webm uzantısı', recorder.recordingExtension('audio/webm;codecs=opus'), 'webm');
  equal('ogg uzantısı', recorder.recordingExtension('audio/ogg;codecs=opus'), 'ogg');
  const errored = [];
  const testRecorder = new recorder.Recorder({
    getStream: () => null,
    onError: (message) => errored.push(message)
  });
  equal('kayıt desteği yok', testRecorder.supported, false);
  equal('destek yokken başlatma başarısız', testRecorder.start(), false);
  assert('hata bildirildi', errored.length === 1, errored.join('|'));

  const registered = new Map();
  class AudioWorkletProcessorStub {
    constructor() {
      this.port = { onmessage: null, postMessage: () => {} };
    }
  }
  const workletFiles = ['noise-processor.js', 'crush-processor.js'];
  for (const file of workletFiles) {
    const source = readFileSync(join(ROOT, 'js', 'worklets', file), 'utf8');
    new Function('AudioWorkletProcessor', 'registerProcessor', source)(AudioWorkletProcessorStub, (name, ctor) =>
      registered.set(name, ctor)
    );
    assert(`${file} yüklendi`, registered.has(file.replace('.js', '').includes('noise') ? 'retro-noise' : 'retro-crush'));
  }

  const NoiseProcessor = registered.get('retro-noise');
  const noiseProcessor = new NoiseProcessor();
  const outBuffer = [[new Float32Array(128)]];
  noiseProcessor.process([], outBuffer);
  assert('kapalı gürültü sessiz', outBuffer[0][0].every((value) => value === 0));
  noiseProcessor.port.onmessage({ data: { active: true } });
  noiseProcessor.process([], outBuffer);
  assert('açık gürültü rastgele', outBuffer[0][0].every((value) => value >= -1 && value <= 1));
  assert('açık gürültü sabit değil', new Set(outBuffer[0][0]).size > 100);

  const CrushProcessor = registered.get('retro-crush');
  const crush = new CrushProcessor();
  const input = new Float32Array(128);
  const output = new Float32Array(128);
  for (let i = 0; i < 128; i++) input[i] = Math.sin((i / 128) * Math.PI * 4) * 0.8;
  crush.process([[input]], [[output]], { bits: new Float32Array([16]), drive: new Float32Array([1]), wet: new Float32Array([0]) });
  assert('wet=0 temiz geçiş', Array.from(output).every((value, index) => value === input[index]));
  crush.process([[input]], [[output]], { bits: new Float32Array([4]), drive: new Float32Array([2]), wet: new Float32Array([1]) });
  assert('wet=1 nicemler', Array.from(output).every((value) => Math.abs(value * 16 - Math.round(value * 16)) < 1e-9));
  assert('çıkış sınırlı', Array.from(output).every((value) => value >= -1.0001 && value <= 1.0001));
  assert('sıkıştırma sesi değiştirir', Array.from(output).some((value, index) => Math.abs(value - input[index]) > 0.01));
  const silence = new Float32Array(128);
  crush.process([[]], [[output]], { bits: new Float32Array([4]), drive: new Float32Array([2]), wet: new Float32Array([1]) });
  assert('giriş yoksa sessiz', Array.from(output).every((value) => value === 0));
  assert('descriptors var', CrushProcessor.parameterDescriptors.length === 3);

  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
  equal('manifest ikon sayısı', manifest.icons.length, 4);
  assert('manifest maskable ikon', manifest.icons.some((icon) => icon.purpose === 'maskable'));
  assert('manifest 512 ikon', manifest.icons.some((icon) => icon.sizes === '512x512'));
  assert('manifest display', manifest.display === 'standalone');
  for (const icon of manifest.icons) {
    assert(`manifest ikonu mevcut ${icon.src}`, existsSync(join(ROOT, icon.src)));
  }
  for (const icon of ['icon-192.png', 'icon-512.png', 'maskable-512.png']) {
    const bytes = readFileSync(join(ROOT, 'assets', icon));
    assert(`${icon} PNG imzası`, bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47);
  }

  const swSource = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  for (const file of ['./index.html', './css/main.css', './js/main.js', './js/worklets/crush-processor.js']) {
    assert(`sw.js ön belleği ${file}`, swSource.includes(`'${file}'`));
  }

  const standalone = join(ROOT, 'dist', 'retro-synth-standalone.html');
  if (existsSync(standalone)) {
    const html = readFileSync(standalone, 'utf8');
    const script = /<script>\n([\s\S]*?)<\/script>/.exec(html);
    assert('paket betiği bulundu', !!script);
    if (script) {
      let compiled = true;
      try {
        new Function(script[1]);
      } catch (error) {
        compiled = false;
      }
      assert('paket betiği derleniyor', compiled);
    }
    assert('paket stil içeriyor', html.includes('--neon-blue'));
    assert('paket worklet içeriyor', html.includes('registerProcessor') && html.includes('retro-crush'));
    assert('paket modül etiketi yok', !html.includes('type="module"'));
    assert('paket yerel css bağlantısı yok', !html.includes('href="./css/main.css"'));
    assert('paket service worker kaydını kapatıyor', script ? script[1].includes('__RETRO_STANDALONE__') : false);
  } else {
    assert('dist/retro-synth-standalone.html', false, 'paket bulunamadı, önce npm run build çalıştırın');
  }

  for (const line of checks) console.log(line);
  console.log(`\n${checks.length - failures}/${checks.length} kontrol geçti.`);
  if (failures > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
