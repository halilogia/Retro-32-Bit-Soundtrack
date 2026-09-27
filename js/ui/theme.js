const STORAGE_KEY = 'retro-32-bit-soundtrack.theme';
const THEMES = ['dark', 'light'];

function preferred() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function stored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(value) ? value : null;
  } catch (error) {
    return null;
  }
}

export function applyTheme(theme) {
  const value = THEMES.includes(theme) ? theme : preferred();
  document.documentElement.dataset.theme = value;
  return value;
}

export function currentTheme() {
  return document.documentElement.dataset.theme || preferred();
}

export function initTheme(button) {
  applyTheme(stored() || preferred());

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      void error;
    }
    button.textContent = next === 'dark' ? 'AYDINLIK' : 'KOYU';
    button.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
  });

  if (window.matchMedia) {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => {
      if (stored()) return;
      applyTheme(preferred());
      button.textContent = currentTheme() === 'dark' ? 'AYDINLIK' : 'KOYU';
    };
    if (typeof query.addEventListener === 'function') query.addEventListener('change', sync);
    else query.addListener(sync);
  }

  button.textContent = currentTheme() === 'dark' ? 'AYDINLIK' : 'KOYU';
  button.setAttribute('aria-pressed', currentTheme() === 'light' ? 'true' : 'false');
  return currentTheme();
}
