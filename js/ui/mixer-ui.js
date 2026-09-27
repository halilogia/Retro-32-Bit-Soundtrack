import { CHANNELS, DELAY_DIVISIONS, EQ_BANDS, DEFAULT_MIXER } from '../core/mixer-state.js';
import { el, createFader, createSelect, createMuteButton, createMeter, panLabel, decibels, milliseconds } from './controls.js';

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

  fader(path, options) {
    return this.addControl(
      path,
      createFader({
        ...options,
        onInput: (value) => this.change(path, value)
      })
    );
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
      const volume = this.fader(`channels.${key}.volume`, {
        id: `mix-${key}-volume`,
        label: 'VOL',
        value: defaults.volume
      });
      const pan = this.fader(`channels.${key}.pan`, {
        id: `mix-${key}-pan`,
        label: 'PAN',
        min: -1,
        max: 1,
        step: 0.05,
        value: defaults.pan,
        format: panLabel
      });
      const reverb = this.fader(`channels.${key}.reverb`, {
        id: `mix-${key}-reverb`,
        label: 'REV',
        value: defaults.reverb
      });
      const delay = this.fader(`channels.${key}.delay`, {
        id: `mix-${key}-delay`,
        label: 'DLY',
        value: defaults.delay
      });
      root.append(
        el('div', { class: 'strip', 'data-channel': key }, [
          el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: label }), meter.root]),
          el('div', { class: 'strip-controls' }, [volume.root, pan.root, reverb.root, delay.root, mute.root])
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
    const masterVolume = this.fader('master.volume', {
      id: 'mix-master-volume',
      label: 'VOL',
      value: DEFAULTS.master.volume
    });
    const crush = this.fader('master.crush', {
      id: 'mix-master-crush',
      label: 'CRUSH',
      value: DEFAULTS.master.crush
    });
    root.append(
      el('div', { class: 'strip strip-master' }, [
        el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: 'MASTER' }), masterMeter.root]),
        el('div', { class: 'strip-controls' }, [masterVolume.root, crush.root, masterMute.root])
      ])
    );

    const eqControls = EQ_BANDS.map((band) =>
      this.fader(`eq.${band.key}`, {
        id: `mix-eq-${band.key}`,
        label: band.label,
        min: -12,
        max: 12,
        step: 0.5,
        value: DEFAULTS.eq[band.key],
        format: decibels
      })
    );
    root.append(
      el('div', { class: 'strip' }, [
        el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: 'EQ' })]),
        el('div', { class: 'strip-controls' }, eqControls.map((control) => control.root))
      ])
    );

    const size = this.fader('reverb.size', {
      id: 'mix-reverb-size',
      label: 'SIZE',
      min: 0.2,
      max: 4,
      step: 0.05,
      value: DEFAULTS.reverb.size,
      format: seconds
    });
    const preDelay = this.fader('reverb.preDelay', {
      id: 'mix-reverb-pre',
      label: 'PRE',
      min: 0,
      max: 0.2,
      step: 0.005,
      value: DEFAULTS.reverb.preDelay,
      format: milliseconds
    });
    const reverbDamp = this.fader('reverb.damp', {
      id: 'mix-reverb-damp',
      label: 'DAMP',
      value: DEFAULTS.reverb.damp
    });
    root.append(
      el('div', { class: 'strip' }, [
        el('div', { class: 'strip-head' }, [el('span', { class: 'strip-name', text: 'REVERB' })]),
        el('div', { class: 'strip-controls' }, [size.root, preDelay.root, reverbDamp.root])
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
    const feedback = this.fader('delay.feedback', {
      id: 'mix-delay-feedback',
      label: 'FEEDBK',
      value: DEFAULTS.delay.feedback
    });
    const delayDamp = this.fader('delay.damp', {
      id: 'mix-delay-damp',
      label: 'DAMP',
      value: DEFAULTS.delay.damp
    });
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
