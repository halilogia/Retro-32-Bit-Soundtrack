import { el } from './controls.js';

const HEIGHTS = { lead: '140px', bass: '80px', kick: '160px' };
const RESET_DELAY = 150;
const IDLE_HEIGHT = '5px';

export class Visualizer {
  constructor(root, count = 32) {
    this.root = root;
    this.bars = [];
    this.timers = [];
    this.setStepCount(count);
  }

  setStepCount(count) {
    const size = Math.max(1, Math.round(count));
    if (this.bars.length === size) return;
    for (const timer of this.timers) clearTimeout(timer);
    this.root.textContent = '';
    this.bars = [];
    this.timers = new Array(size).fill(null);
    for (let i = 0; i < size; i++) {
      const bar = el('div', { class: 'bar' });
      this.root.append(bar);
      this.bars.push(bar);
    }
  }

  pulse(index, kind) {
    const slot = ((index % this.bars.length) + this.bars.length) % this.bars.length;
    const bar = this.bars[slot];
    if (!bar) return;
    bar.style.height = HEIGHTS[kind] || '20px';
    bar.classList.add(kind);
    if (this.timers[slot]) clearTimeout(this.timers[slot]);
    this.timers[slot] = setTimeout(() => {
      this.timers[slot] = null;
      bar.style.height = IDLE_HEIGHT;
      bar.classList.remove(kind);
    }, RESET_DELAY);
  }

  reset() {
    for (let i = 0; i < this.bars.length; i++) {
      if (this.timers[i]) clearTimeout(this.timers[i]);
      this.timers[i] = null;
      this.bars[i].style.height = IDLE_HEIGHT;
      this.bars[i].className = 'bar';
    }
  }
}
