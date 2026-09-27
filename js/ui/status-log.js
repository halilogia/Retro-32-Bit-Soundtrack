import { el } from './controls.js';

const LIMIT = 4;

export class StatusLog {
  constructor(element) {
    this.element = element;
    this.entries = [];
  }

  push(text, tone = 'info') {
    if (!text) return;
    this.entries.unshift({ text, tone, at: new Date() });
    this.entries = this.entries.slice(0, LIMIT);
    this.render();
  }

  render() {
    this.element.textContent = '';
    for (const entry of this.entries) {
      this.element.append(
        el('li', { class: `status-line status-${entry.tone}` }, [
          el('time', { class: 'status-time', text: formatTime(entry.at) }),
          el('span', { class: 'status-text', text: entry.text })
        ])
      );
    }
  }

  clear() {
    this.entries = [];
    this.render();
  }
}

function formatTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
