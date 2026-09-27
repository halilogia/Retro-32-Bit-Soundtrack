import { STEP_LENGTHS } from '../core/theory.js';
import { ARP_MODES, NOTE_LENGTHS } from '../core/song-settings.js';
import { scaleOptions } from '../core/scales.js';
import { el, createSelect } from './controls.js';

const STEP_LABELS = STEP_LENGTHS.map((value) => ({ value, label: `${value} ADIM` }));
const NOTE_LABELS = NOTE_LENGTHS.map((value) => ({ value, label: `${value} ADIM` }));
const ARP_LABELS = ARP_MODES.map((value) => ({ value, label: ({ random: 'RASTGELE', up: 'YUKARI', down: 'AŞAĞI' })[value] }));

export class SettingsUI {
  constructor(engine, root) {
    this.engine = engine;
    this.root = root;
    this.controls = new Map();
    this.build();
    engine.onState(({ type, detail }) => {
      if (type === 'settings') this.sync(detail);
    });
  }

  add(path, control) {
    this.controls.set(path, control);
    return control;
  }

  change(path, value) {
    this.engine.setSettings({ [path]: value });
  }

  build() {
    const length = this.add(
      'steps',
      createSelect({
        id: 'song-steps',
        label: 'UZUNLUK',
        options: STEP_LABELS,
        value: this.engine.settings.steps,
        onChange: (value) => this.change('steps', Number(value))
      })
    );
    const noteLength = this.add(
      'noteLength',
      createSelect({
        id: 'song-note-length',
        label: 'NOTA',
        options: NOTE_LABELS,
        value: this.engine.settings.noteLength,
        onChange: (value) => this.change('noteLength', Number(value))
      })
    );
    const arp = this.add(
      'arp',
      createSelect({
        id: 'song-arp',
        label: 'ARPEJ',
        options: ARP_LABELS,
        value: this.engine.settings.arp,
        onChange: (value) => this.change('arp', value)
      })
    );
    const scale = this.add(
      'scaleId',
      createSelect({
        id: 'song-scale',
        label: 'ÖLÇEK',
        options: scaleOptions(),
        value: this.engine.settings.scaleId,
        onChange: (value) => this.change('scaleId', value)
      })
    );

    this.root.append(
      el('div', { class: 'settings-grid' }, [length.root, noteLength.root, arp.root, scale.root]),
      el('p', { class: 'panel-hint' }, [
        'Uzunluk nota adımı sayısını, NOTA nota uzunluğunu (adım cinsinden) değiştirir. ARPEJ yukarı/aşağı seçilirse ',
        'her adıma bir nota düşer ve ölçek sırayla yürür. ÖLÇEK türün kendi gamı yerine seçtiğin gamı kullanır.'
      ])
    );
  }

  sync(settings) {
    if (!settings) return;
    for (const [path, control] of this.controls) {
      const value = settings[path];
      if (value !== undefined) control.set(value);
    }
  }
}
