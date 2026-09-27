const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function recordingExtension(mimeType) {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'm4a';
  return 'webm';
}

export class Recorder {
  constructor({ getStream, onStart, onComplete, onError }) {
    this.getStream = getStream;
    this.onStart = onStart || (() => {});
    this.onComplete = onComplete || (() => {});
    this.onError = onError || (() => {});
    this.recorder = null;
    this.chunks = [];
    this.mimeType = '';
  }

  get supported() {
    return typeof window.MediaRecorder === 'function' && typeof window.MediaStream === 'function';
  }

  get recording() {
    return !!this.recorder && this.recorder.state === 'recording';
  }

  start() {
    if (!this.supported) {
      this.onError('Tarayıcı ses kaydını desteklemiyor.');
      return false;
    }
    const stream = this.getStream();
    if (!stream || stream.getAudioTracks().length === 0) {
      this.onError('Kayıt için ses motoru çalışmıyor.');
      return false;
    }
    if (this.recording) return true;

    this.mimeType = pickMimeType();
    this.chunks = [];
    try {
      this.recorder = this.mimeType ? new MediaRecorder(stream, { mimeType: this.mimeType }) : new MediaRecorder(stream);
    } catch (error) {
      this.recorder = null;
      this.onError('Kayıt başlatılamadı.');
      return false;
    }

    this.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.onerror = () => this.onError('Kayıt sırasında hata oluştu.');
    this.recorder.onstop = () => {
      const type = this.mimeType || 'audio/webm';
      const blob = new Blob(this.chunks, { type });
      this.chunks = [];
      this.recorder = null;
      if (blob.size > 0) this.onComplete(blob, recordingExtension(type));
    };

    this.recorder.start();
    this.onStart();
    return true;
  }

  stop() {
    if (!this.recording) return false;
    this.recorder.stop();
    return true;
  }
}
