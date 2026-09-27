const PREFIX = 'retro32:';

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(preset, base = '') {
  const payload = {
    v: 1,
    n: preset.name,
    g: preset.genre,
    s: preset.settings,
    q: preset.sequence,
    m: preset.mixer
  };
  return `${base}#${PREFIX}${toBase64Url(JSON.stringify(payload))}`;
}

export function decodeShare(hash) {
  const value = String(hash || '').replace(/^#/, '');
  if (!value.startsWith(PREFIX)) return null;
  try {
    const payload = JSON.parse(fromBase64Url(value.slice(PREFIX.length)));
    if (!payload || typeof payload !== 'object') return null;
    return {
      app: 'retro-32-bit-soundtrack',
      version: 2,
      name: payload.n,
      genre: payload.g,
      settings: payload.s,
      sequence: payload.q,
      mixer: payload.m
    };
  } catch (error) {
    return null;
  }
}

export function shareFromLocation() {
  return decodeShare(typeof location === 'undefined' ? '' : location.hash);
}
