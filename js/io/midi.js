import { STEPS_PER_BEAT, noteToMidi } from '../core/theory.js';
import { DRUM } from '../core/composer.js';
import { downloadBytes, slugify, timestamp } from './download.js';

const TICKS_PER_BEAT = 480;
const STEP_TICKS = TICKS_PER_BEAT / STEPS_PER_BEAT;
const BEATS = 4;
const TICKS_PER_BAR = TICKS_PER_BEAT * BEATS;

const DRUM_MIDI = Object.freeze({
  [DRUM.KICK]: 36,
  [DRUM.SNARE]: 38,
  [DRUM.HAT]: 42
});

const PROGRAM_BY_TYPE = Object.freeze({
  sawtooth: 81,
  square: 80,
  triangle: 81,
  sine: 38
});

const VELOCITY = Object.freeze({ lead: 100, bass: 92, kick: 112, snare: 100, hat: 70 });

function vlq(value) {
  let rest = Math.max(0, Math.round(value));
  const bytes = [rest & 0x7f];
  rest >>= 7;
  while (rest > 0) {
    bytes.unshift((rest & 0x7f) | 0x80);
    rest >>= 7;
  }
  return bytes;
}

function bytesOf(text) {
  return Array.from(new TextEncoder().encode(text));
}

function chunk(id, data) {
  const length = data.length;
  return [
    ...bytesOf(id),
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
    ...data
  ];
}

function meta(type, data = []) {
  return [0xff, type, ...vlq(data.length), ...data];
}

function be24(value) {
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function trackName(text) {
  return meta(0x03, bytesOf(text));
}

function tempoEvent(bpm) {
  return meta(0x51, be24(Math.round(60000000 / bpm)));
}

function timeSignatureEvent() {
  return meta(0x58, [BEATS, 2, 24, 8]);
}

function keySignatureEvent() {
  return meta(0x59, [0x00, 0x00]);
}

function programChange(channel, program) {
  return [0xc0 | channel, Math.max(0, Math.min(127, Math.round(program)))];
}

function noteOn(channel, note, velocity) {
  return [0x90 | channel, note, velocity];
}

function noteOff(channel, note) {
  return [0x80 | channel, note, 0x40];
}

function noteDuration(releaseSeconds, capSteps, bpm) {
  const ticks = Math.round(releaseSeconds * TICKS_PER_BEAT * bpm / 60);
  return Math.max(STEP_TICKS, Math.min(ticks, STEP_TICKS * capSteps));
}

function assemble(notes, events, totalTicks) {
  const items = [];
  for (const event of events) items.push({ tick: event.tick || 0, order: 2, data: event.data });
  for (const note of notes) {
    const end = Math.min(note.tick + note.duration, totalTicks);
    items.push({ tick: note.tick, order: 1, data: noteOn(note.channel, note.note, note.velocity) });
    items.push({ tick: end, order: 0, data: noteOff(note.channel, note.note) });
  }
  items.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const bytes = [];
  let last = 0;
  for (const item of items) {
    bytes.push(...vlq(item.tick - last), ...item.data);
    last = item.tick;
  }
  bytes.push(...vlq(totalTicks - last), ...meta(0x2f));
  return chunk('MTrk', bytes);
}

function collect(track, program, duration, velocity, steps) {
  const notes = [];
  for (let step = 0; step < steps; step++) {
    const note = track[step];
    if (note === undefined || note === null) continue;
    const value = typeof note === 'number' ? note : noteToMidi(note);
    if (value === null || value === undefined) continue;
    if (value < 0) continue;
    notes.push({
      tick: step * STEP_TICKS,
      duration,
      channel: program.channel,
      note: value,
      velocity
    });
  }
  return notes;
}

export function buildMidi(sequence, genre) {
  const bpm = genre.tempo || 140;
  const steps = Math.max(1, sequence.melody.length);
  const totalTicks = steps * STEP_TICKS;
  const lead = { channel: 0, program: PROGRAM_BY_TYPE[genre.sounds.lead.type] ?? 81 };
  const bass = { channel: 1, program: PROGRAM_BY_TYPE[genre.sounds.bass.type] ?? 38 };

  const leadTrack = assemble(
    collect(sequence.melody, lead, noteDuration(genre.sounds.lead.release, 1.8, bpm), VELOCITY.lead, steps),
    [
      { data: trackName(`Lead - ${genre.name}`) },
      { data: programChange(lead.channel, lead.program) }
    ],
    totalTicks
  );

  const bassTrack = assemble(
    collect(sequence.bass, bass, noteDuration(genre.sounds.bass.release, 2, bpm), VELOCITY.bass, steps),
    [
      { data: trackName(`Bass - ${genre.name}`) },
      { data: programChange(bass.channel, bass.program) }
    ],
    totalTicks
  );

  const drumNotes = [];
  for (let step = 0; step < steps; step++) {
    const drum = sequence.drums[step];
    const note = DRUM_MIDI[drum];
    if (note === undefined) continue;
    const key = drum === DRUM.KICK ? 'kick' : drum === DRUM.SNARE ? 'snare' : 'hat';
    drumNotes.push({
      tick: step * STEP_TICKS,
      duration: drum === DRUM.HAT ? Math.round(STEP_TICKS * 0.4) : Math.round(STEP_TICKS * 0.8),
      channel: 9,
      note,
      velocity: VELOCITY[key]
    });
  }

  const drumTrack = assemble(
    drumNotes,
    [{ data: trackName('Drums - GM 9') }, { data: keySignatureEvent() }],
    totalTicks
  );

  const header = chunk('MThd', [
    0x00, 0x01,
    0x00, 0x04,
    (TICKS_PER_BEAT >> 8) & 0xff, TICKS_PER_BEAT & 0xff
  ]);

  const metaTrack = chunk(
    'MTrk',
    [
      ...vlq(0), ...trackName(genre.name),
      ...vlq(0), ...tempoEvent(bpm),
      ...vlq(0), ...timeSignatureEvent(),
      ...vlq(0), ...meta(0x06, bytesOf(`tempo=${bpm} steps=${steps} ticksPerBeat=${TICKS_PER_BEAT} loopTicks=${totalTicks} barTicks=${TICKS_PER_BAR}`)),
      ...vlq(0), ...meta(0x2f)
    ]
  );

  return new Uint8Array([...header, ...metaTrack, ...leadTrack, ...bassTrack, ...drumTrack]);
}

export function exportMidi(sequence, genre) {
  const bytes = buildMidi(sequence, genre);
  downloadBytes(bytes, `retro-synth-${slugify(genre.name)}-${timestamp()}.mid`, 'audio/midi');
  return bytes.length;
}
