export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

export function percent(value) {
  return `${Math.round(value * 100)}%`;
}

export function panLabel(value) {
  if (Math.abs(value) < 0.005) return 'MERKEZ';
  return value < 0 ? `${Math.round(-value * 100)}L` : `${Math.round(value * 100)}R`;
}

export function decibels(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} DB`;
}

export function milliseconds(value) {
  return `${Math.round(value * 1000)} MS`;
}

function flashReset(root) {
  root.classList.remove('is-reset');
  void root.offsetWidth;
  root.classList.add('is-reset');
  setTimeout(() => root.classList.remove('is-reset'), 700);
}

export function createFader({ id, label, min = 0, max = 1, step = 0.01, value = 0, format = percent, onInput }) {
  const input = el('input', { type: 'range', id, min, max, step, value, class: 'fader-input' });
  const output = el('output', { class: 'fader-value', for: id });
  const show = (raw) => {
    output.textContent = format(Number(raw));
  };
  const commit = (next) => {
    show(next);
    if (onInput) onInput(next);
  };
  input.addEventListener('input', () => commit(Number(input.value)));
  input.addEventListener('dblclick', () => {
    input.value = String(value);
    commit(value);
    flashReset(root);
  });
  show(value);

  const root = el('div', { class: 'fader' }, [
    el('label', { class: 'fader-label', for: id, text: label }),
    input,
    output
  ]);

  return {
    root,
    input,
    set(next) {
      if (document.activeElement === input) return;
      input.value = String(next);
      show(next);
    }
  };
}

export function createSelect({ id, label, options, value, onChange }) {
  const select = el('select', { id, class: 'fader-select' });
  for (const option of options) {
    select.append(el('option', { value: option.value, text: option.label, selected: option.value === value }));
  }
  select.value = String(value);
  select.addEventListener('change', () => {
    const next = select.value;
    if (onChange) onChange(next);
  });

  return {
    root: el('div', { class: 'fader' }, [el('label', { class: 'fader-label', for: id, text: label }), select]),
    input: select,
    set(next) {
      if (document.activeElement === select) return;
      select.value = String(next);
    }
  };
}

export function createMuteButton({ label, onChange }) {
  const button = el('button', { type: 'button', class: 'mute-button', 'aria-pressed': 'false', text: label });
  let muted = false;
  button.addEventListener('click', () => {
    muted = !muted;
    button.classList.toggle('is-muted', muted);
    button.setAttribute('aria-pressed', muted ? 'true' : 'false');
    button.textContent = muted ? `${label} OFF` : label;
    if (onChange) onChange(muted);
  });
  return {
    root: button,
    set(next) {
      muted = next;
      button.classList.toggle('is-muted', muted);
      button.setAttribute('aria-pressed', muted ? 'true' : 'false');
      button.textContent = muted ? `${label} OFF` : label;
    }
  };
}

export function createMeter() {
  const fill = el('i', { class: 'vu-fill' });
  const root = el('div', { class: 'vu', 'aria-hidden': 'true' }, [fill]);
  return {
    root,
    set(level) {
      fill.style.height = `${Math.min(100, Math.max(0, level * 100))}%`;
    }
  };
}
