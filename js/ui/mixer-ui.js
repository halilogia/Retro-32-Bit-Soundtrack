import { CHANNELS, DELAY_DIVISIONS, DEFAULT_MIXER } from '../core/mixer-state.js';
import { el, createFader, createSelect, createMuteButton, createMeter } from './controls.js';

const seconds = (value) => `${value.toFixed(2)} SN`;
const DEFAULTS = DEFAULT_MIXER;

function readPath(source, path) {
  return path.split('.').reduce((node, key) => (node ? node[key] : undefined), source);
}

export class MixerUI {
  constructor(engine, { channelsRoot, busesRoot }) {
    this.engine = engine;
    this.controls = new Map();
    this.meters = new Map();
    this.buildChannels(channelsRoot);
    this.buildBuses(busesRoot);
    engine.onMixer((mixer) => this.sync(mixer));
  }

  addControl(path, control) {
    this.controls.set(path, control);
    return control;
  }

  change(path, value) {
    this.engine.update({ [path]: value });
  }

  buildChannels(root) {
    for (const { key, label } of CHANNELS) {
      const defaults = DEFAULTS.channels[key];
      const meter = createMeter();
      this.meters.set(key, meter);
      const mute = this.addControl(
        `channels.${key}.mute`,
        createMuteButton({ label: 'MUTE', onChange: (value) => this.change(`channels.${key}.mute`, value) })
      );
      const volume = this.addControl(
        `channels.${key}.volume`,
        createFader({
          id: `mix-${key}-volume`,
          label: 'VOL',
          value: defaults.volume,
          onInput: (value) => this.change(`channels.${key}.volume`, value)
        })
      );
      const reverb = this.addControl(
        `channels.${key}.reverb`,
        createFader({
          id: `mix-${key}-reverb`,
          label: 'REV',
          value: defaults.reverb,
          onInput: (value) => this.change(`channels.${key}.reverb`, value)
        })
      );
      const delay = this.addControl(
        `channels.${key}.delay`,
        createFader({
          id: `mix-${key}-delay`,
          label: 'DLY',
          value: defaults.delay,
          onInput: (value) => this.change(`channels.${key}.delay`, value)
        })
      );
      root.append(
        el('div', { class: 'strip', 'data-channel': key }, [
          el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: label }), meter.root]),
          el('div', { class: 'strip-controls' }, [volume.root, reverb.root, delay.root, mute.root])
        ])
      );
    }
  }

  buildBuses(root) {
    const masterMeter = createMeter();
    this.meters.set('master', masterMeter);
    const masterMute = this.addControl(
      'master.mute',
      createMuteButton({ label: 'MUTE', onChange: (value) => this.change('master.mute', value) })
    );
    const masterVolume = this.addControl(
      'master.volume',
      createFader({
        id: 'mix-master-volume',
        label: 'VOL',
        value: DEFAULTS.master.volume,
        onInput: (value) => this.change('master.volume', value)
      })
    );
    const crush = this.addControl(
      'master.crush',
      createFader({
        id: 'mix-master-crush',
        label: 'CRUSH',
        value: DEFAULTS.master.crush,
        onInput: (value) => this.change('master.crush', value)
      })
    );
    root.append(
      el('div', { class: 'strip strip-master' }, [
        el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: 'MASTER' }), masterMeter.root]),
        el('div', { class: 'strip-controls' }, [masterVolume.root, crush.root, masterMute.root])
      ])
    );

    const size = this.addControl(
      'reverb.size',
      createFader({
        id: 'mix-reverb-size',
        label: 'SIZE',
        min: 0.2,
        max: 4,
        step: 0.05,
        value: DEFAULTS.reverb.size,
        format: seconds,
        onInput: (value) => this.change('reverb.size', value)
      })
    );
    const reverbDamp = this.addControl(
      'reverb.damp',
      createFader({
        id: 'mix-reverb-damp',
        label: 'DAMP',
        value: DEFAULTS.reverb.damp,
        onInput: (value) => this.change('reverb.damp', value)
      })
    );
    root.append(
      el('div', { class: 'strip' }, [
        el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: 'REVERB' })]),
        el('div', { class: 'strip-controls' }, [size.root, reverbDamp.root])
      ])
    );

    const division = this.addControl(
      'delay.division',
      createSelect({
        id: 'mix-delay-division',
        label: 'DIV',
        options: DELAY_DIVISIONS.map((item) => ({ value: item.value, label: item.label })),
        value: DEFAULTS.delay.division,
        onChange: (value) => this.change('delay.division', Number(value))
      })
    );
    const feedback = this.addControl(
      'delay.feedback',
      createFader({
        id: 'mix-delay-feedback',
        label: 'FEEDBK',
        value: DEFAULTS.delay.feedback,
        onInput: (value) => this.change('delay.feedback', value)
      })
    );
    const delayDamp = this.addControl(
      'delay.damp',
      createFader({
        id: 'mix-delay-damp',
        label: 'DAMP',
        value: DEFAULTS.delay.damp,
        onInput: (value) => this.change('delay.damp', value)
      })
    );
    root.append(
      el('div', { class: 'strip' }, [
        el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: 'DELAY' })]),
        el('div', { class: 'strip-controls' }, [division.root, feedback.root, delayDamp.root])
      ])
    );
  }

  sync(mixer) {
    for (const [path, control] of this.controls) {
      const value = readPath(mixer, path);
      if (value !== undefined) control.set(value);
    }
  }

  updateMeters(levels) {
    for (const [key, meter] of this.meters) {
      meter.set(levels[key] || 0);
    }
  }
}
