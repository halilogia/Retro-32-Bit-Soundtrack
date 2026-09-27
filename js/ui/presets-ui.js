import { el } from './controls.js';
import { getGenre } from '../core/genres.js';
import {
  cleanName,
  createPreset,
  deletePreset,
  exportPresetFile,
  getPreset,
  importPresetFile,
  listPresets,
  savePreset
} from '../io/presets.js';

export class PresetsUI {
  constructor(engine, { list, nameInput, onApply, onStatus }) {
    this.engine = engine;
    this.list = list;
    this.nameInput = nameInput;
    this.onApply = onApply;
    this.onStatus = onStatus;
  }

  current() {
    return createPreset({
      name: this.nameInput.value,
      genre: this.engine.genreKey,
      mixer: this.engine.mixer,
      sequence: this.engine.sequence
    });
  }

  save() {
    try {
      const preset = savePreset(this.current());
      this.nameInput.value = preset.name;
      this.render();
      this.onStatus(`PRESET KAYDEDİ: ${preset.name}`, 'ok');
    } catch (error) {
      this.onStatus(error.message, 'error');
    }
  }

  load(name) {
    const preset = getPreset(name);
    if (!preset) {
      this.onStatus('PRESET BULUNAMADI.', 'error');
      return;
    }
    this.nameInput.value = preset.name;
    this.onApply(preset);
    this.onStatus(`PRESET YÜKLENDİ: ${preset.name}`, 'ok');
  }

  remove(name) {
    if (!window.confirm(`"${name}" presetini sil?`)) return;
    deletePreset(name);
    this.render();
    this.onStatus('PRESET SİLİNDİ.', 'info');
  }

  export() {
    const preset = this.current();
    exportPresetFile(preset);
    this.onStatus(`JSON İNDİRİLDİ: ${preset.name}`, 'ok');
  }

  async import(file) {
    try {
      const preset = savePreset(await importPresetFile(file));
      this.nameInput.value = preset.name;
      this.render();
      this.onApply(preset);
      this.onStatus(`PRESET İÇE AKTARILDI: ${preset.name}`, 'ok');
    } catch (error) {
      this.onStatus(error.message, 'error');
    }
  }

  render() {
    const presets = listPresets();
    this.list.textContent = '';
    if (presets.length === 0) {
      this.list.append(el('li', { class: 'preset-empty', text: 'KAYITLI PRESET YOK' }));
      return;
    }
    for (const preset of presets) {
      const genre = getGenre(preset.genre);
      this.list.append(
        el('li', { class: 'preset-item' }, [
          el('span', { class: 'preset-name', text: cleanName(preset.name) }),
          el('span', { class: 'preset-meta', text: `${genre.name} · ${genre.tempo} BPM` }),
          el('button', { type: 'button', class: 'preset-action', text: 'YÜKLE', onclick: () => this.load(preset.name) }),
          el('button', { type: 'button', class: 'preset-action preset-delete', text: 'SİL', onclick: () => this.remove(preset.name) })
        ])
      );
    }
  }
}
