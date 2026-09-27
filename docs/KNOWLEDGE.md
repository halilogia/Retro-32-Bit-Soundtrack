# 🧠 Knowledge Base - Retro 32-Bit Soundtrack Generator

## 🎵 Musical Scales & Math
- **Equal Temperament Note Formula**:
  $$f = 440 \times 2^{(n - 69) / 12}$$
- **Note Name → MIDI**: `midi = pitchClass + (octave + 1) * 12`, `#` +1, `b` -1 (ör. `C4` = 60, `A4` = 69)
- **Genre BPM Profiles**:
  - **Arcade**: 140 BPM, Major / Pentatonic, hızlı 16'lık arpej.
  - **Lo-Fi**: 85 BPM, Major 7th hissi, yumuşak üçgen dalga, seyrek melodi (chance 0.3).
  - **Dark**: 110 BPM, Phrygian benzeri gam, detune'li sert bas (+10 cent), agresif filtre sarmalı.
  - **Glitch**: 160 BPM, kromatik gam, kısa zarf, filtre 100 Hz'e doğru lineer düşüş, %30 ek kick/snare.

## 🥁 Drum Synthesis Formulas
- **Kick**: Sine wave starting at 150 Hz (Dark: 180 Hz) sweeping to 0.01 Hz in 500 ms via `exponentialRampToValueAtTime`.
- **Snare**: White noise (worklet veya hazır buffer) through a band-pass filter (1000 Hz, Lo-Fi: 800 Hz),
  200 ms decay, level 0.7 × genre drum level.
- **Hi-Hat**: White noise through a 5000 Hz high-pass, 50 ms decay, level 0.3 × genre drum level.
- **Drum level**: Lo-Fi 0.6, diğerleri 1.0.

## 🌊 Effect Formulas
- **Reverb impulse response**: stereo buffer, `sample[i] = (random * 2 - 1) * exp(-4.5 * i / length)`,
  length = `size` seconds (0.2 - 4.0), başlangıçta üretilir, 120 ms debounce ile yenilenir.
- **Damping**: `cutoff = 20000 * (700 / 20000) ^ damp`, `damp` 0 (açık) - 1 (koyu).
- **Delay**: `time = division * 60 / bpm`, bölümler 1/16, 1/8, 3/16, 1/4; geri besleme üst sınırı 0.85.
- **CRUSH knob (0 - 1)**: `bits = 16 - 12 * x`, `drive = 1 + 2.5 * x`, `wet = min(1, 1.6 * x)`;
  işlemci `tanh(x * drive) / tanh(drive)` ile yumuşak doygunluk, ardından `round(y * 2^bits) / 2^bits` ile nicemleme.

## 🎼 MIDI File Format Notes (SMF)
- Chunk yapısı: `MThd` (6 bayt: format, parça sayısı, bölme) ve tek parça başına `MTrk`.
  **Chunk uzunlukları 4 baytlık sabit sayıdır**, değişken uzunluk (VLQ) yalnızca delta zamanlarındadır.
- Meta olay biçimi: `FF <tip> <uzunluk VLQ> <veri>`; `FF 2F 00` = End of Track.
- Tempo `FF 51 03 <mikrosaniye>`; ölçü imzası `FF 58 04 <pay> <üs payı> 24 8`; tonalite `FF 59 02 00 00`.
- Bu proje: 480 tick/ölçü, 16'lık = 120 tick, 32 adım = 3840 tick, format 1, 4 parça
  (tempo/meta, lead kanal 0, bas kanal 1, GM perküsyon kanal 9).
- GM perküsyon eşlemesi: kick = 36, snare = 38, hi-hat = 42.

## 🧩 Mimari Notlar
- `AudioContext.currentTime` tek zaman kaynağıdır; 25 ms bakış pencereli `setTimeout` zamanlayıcısı
  120 ms ileriye notaları planlar.
- Görselleştirici olayları zaman damgalı kuyrukta tutulur ve `requestAnimationFrame` içinde eşleştiğinde oynatılır.
- Ses düğümleri fader değişimlerinde `setTargetAtTime` ile yumuşatılır (tıkırtı önleme).
- AudioWorklet kaynakları `Blob` URL olarak `addModule` ile yüklenir; bu sayede modüler sürümde dosya
  ayrıca `fetch` edilmez, paketlenmiş sürümde ise kaynak metin olarak gömülüdür.
- `file://` üzerinde blob tabanlı `addModule` engellendiği için uygulama yedek kaynağa düşer.
