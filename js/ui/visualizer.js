import { STEPS } from '../core/theory.js';
import { el } from './controls.js';

const HEIGHTS = { lead: '140px', bass: '80px', kick: '160px' };
const RESET_DELAY = 150;
const IDLE_HEIGHT = '5px';

export class Visualizer {
  constructor(root, count = STEPS) {
    this.root = root;
    this.bars = [];
    this.timers = new Array(count).fill(null);
    for (let i = 0; i < count; i++) {
      const bar = el('div', { class: 'bar' });
      root.append(bar);
      this.bars.push(bar);
    }
  }

  pulse(index, kind) {
    const bar = this.bars[index % this.bars.length];
    if (!bar) return;
    bar.style.height = HEIGHTS[kind] || '20px';
    bar.classList.add(kind);
    if (this.timers[index]) clearTimeout(this.timers[index]);
    this.timers[index] = setTimeout(() => {
      this.timers[index] = null;
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
