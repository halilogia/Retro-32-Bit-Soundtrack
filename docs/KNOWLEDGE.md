# 🧠 Knowledge Base - Retro 32-Bit Soundtrack Generator

## 🎵 Musical Scales & Math
- **Equal Temperament Note Formula**:
  $$f = 440 \times 2^{(n - 69) / 12}$$
- **Note Name → MIDI**: `midi = pitchClass + (octave + 1) * 12`, `#` +1, `b` -1 (ör. `C4` = 60, `A4` = 69)
- **Adım uzunluğu**: `60 / bpm / 4` saniye (16'lık nota). `normalizeSteps` yalnızca 16 / 32 / 64 kabul eder.
- **Genre BPM Profiles**:
  - **Arcade**: 140 BPM, Major / Pentatonic, hızlı 16'lık arpej.
  - **Lo-Fi**: 85 BPM, Major 7th hissi, yumuşak üçgen dalga, seyrek melodi (chance 0.3).
  - **Dark**: 110 BPM, Phrygian benzeri gam, detune'li sert bas (+10 cent), agresif filtre sarmalı.
  - **Glitch**: 160 BPM, kromatik gam, kısa zarf, filtre 100 Hz'e doğru lineer düşüş, %30 ek kick/snare.
  - **Synthwave**: 100 BPM, A minör, yavaş açılan sawtooth filtresi, uzun gate'li lead, güçlü delay.
  - **Chiptune**: 150 BPM, kısa square zarf (0.14 sn), yüksek geçiren filtre, reverb gönderimi 0.
  - **Dungeon**: 80 BPM, D minör, yavaş üçgen sweep, derin reverb (3.4 sn), düşük yoğunluklu ritim.

## 🎹 Note Gate (legato) Formülü
- `gate = max(attack + 0.01, min(noteLength × stepDuration, release))`
- `noteLength` 0.25 - 8 adım arasında, tür verisinde `sounds.lead.noteLength` / `sounds.bass.noteLength` olarak
  tanımlı (şarkı ayarı bunu geçersiz kılabilir).
- Zarf: `0 → level` (attack) → `level` (gate'e kadar) → `0.01` (gate + tail) → `0`; `tail = max(0.02, gate × 0.2)`.
  Osilatör `gate + tail` anında durur.

## 🥁 Drum Synthesis Formulas
- **Kick**: Sine wave starting at 150 Hz (Dark: 180 Hz) sweeping to 0.01 Hz in 500 ms via `exponentialRampToValueAtTime`.
- **Snare**: White noise (worklet veya hazır buffer) through a band-pass filter (1000 Hz, Lo-Fi: 800 Hz),
  200 ms decay, level 0.7 × genre drum level.
- **Hi-Hat**: White noise through a 5000 Hz high-pass, 50 ms decay, level 0.3 × genre drum level.
- **Drum level**: Lo-Fi 0.6, diğerleri 1.0.
- Gürültü vuruş başına yeniden üretilmez; paylaşımlı kaynak + vuruşa özel zarf kullanılır ve zincir
  `gate + 0.15 sn` sonrasında ayrıştırılır (grafik sızıntısı yok).

## 🌊 Effect Formulas
- **Reverb impulse response**: stereo buffer, `sample[i] = (random * 2 - 1) * exp(-4.5 * i / length)`,
  length = `size` saniye (0.2 - 4.0), 120 ms debounce ile yenilenir.
- **Pre-delay**: giriş ile convolver arasında `DelayNode`, 0 - 200 ms.
- **Damping**: `cutoff = 20000 * (700 / 20000) ^ damp`, `damp` 0 (açık) - 1 (koyu).
- **Delay**: `time = division * 60 / bpm`, bölümler 1/16, 1/8, 3/16, 1/4; geri besleme üst sınırı 0.85.
- **CRUSH knob (0 - 1)**: `bits = 16 - 12 * x`, `drive = 1 + 2.5 * x`, `wet = min(1, 1.6 * x)`.
  - Worklet yolu: `tanh(x * drive) / tanh(drive)` sonra `round(y * 2^bits) / 2^bits`.
  - WaveShaper yedeği: 4096 noktalı eğri, `curve[i] = round(tanh(input * drive) / tanh(drive) * 2^bits) / 2^bits`
    (`oversample = 'none'`, kuru/yaş `GainNode` çifti ile karıştırılır).
- **Master EQ**: 220 Hz `lowshelf` ve 3600 Hz `highshelf`, ±12 dB, `setTargetAtTime` ile 20 ms.

## 🎼 Scales & Arpeggiator
- Gamlar yarım ton aralıklarıyla tanımlanır: major/minor pentatonik, dorian, phrygian dominant, doğal minör,
  harmonik minör, lydian, mixolydian, blues, kromatik (+ türün kendi gamı).
- Kök nota türün melodi gamının ilk notasından gelir (`rootOf`), 2 oktav (4 ve 5) üretilir.
- Bas için kök bir oktav altı + beşli kullanılır: `[root-24, root-12, root-5]`.
- **Arpej**: `up`/`down` modlarında her adıma nota düşer, imleç gam dizisi üzerinde yönlü olarak ilerler;
  `random` modunda türün `melodyChance` olasılığı kullanılır.

## 🎼 MIDI File Format Notes (SMF)
- Chunk yapısı: `MThd` (6 bayt: format, parça sayısı, bölme) ve tek parça başına `MTrk`.
  **Chunk uzunlukları 4 baytlık sabit sayıdır**, değişken uzunluk (VLQ) yalnızca delta zamanlarındadır.
- Meta olay biçimi: `FF <tip> <uzunluk VLQ> <veri>`; `FF 2F 00` = End of Track.
- Tempo `FF 51 03 <mikrosaniye>`; ölçü imzası `FF 58 04 <pay> <üs payı> 24 8`; tonalite `FF 59 02 00 00`.
- Bu proje: 480 tick/ölçü, 16'lık = 120 tick, format 1, 4 parça
  (tempo/meta, lead kanal 0, bas kanal 1, GM perküsyon kanal 9). Döngü uzunluğu dizinin adım sayısından gelir.
- GM perküsyon eşlemesi: kick = 36, snare = 38, hi-hat = 42.

## 💾 WAV Notes
- `RIFF` / `WAVE` / `fmt ` (16 bayt, PCM=1) / `data` başlıkları, 44 bayt toplam.
- 16-bit örnekler `sample < 0 ? sample * 0x8000 : sample * 0x7fff` ile yazılır, kanallar örtüşür (interleaved).
- Ses `OfflineAudioContext` içinde 44.1 kHz stereo render edilir, iki döngü + 2.5 sn kuyruk payı planlanır.

## 🧩 Mimari Notlar
- Bu depoda ayrı bir yol haritası dosyası yoktur; güncel plan `CHANGELOG.md` → `📋 Güncel Plan` bölümündedir.
- `AudioContext.currentTime` tek zaman kaynağıdır; 25 ms bakış pencereli `setTimeout` zamanlayıcısı
  120 ms ileriye notaları planlar.
- Görselleştirici olayları zaman damgalı kuyrukta tutulur ve `requestAnimationFrame` içinde eşleştiğinde oynatılır.
- Ses düğümleri fader değişimlerinde `setTargetAtTime` ile yumuşatılır (tıkırtı önleme).
- AudioWorklet kaynakları `Blob` URL olarak `addModule` ile yüklenir; modüler sürümde dosya ayrıca `fetch` edilmez,
  paketlenmiş sürümde kaynak metin olarak gömülüdür.
- `file://` üzerinde blob tabanlı `addModule` engellendiği için gürültü hazır buffer'a, CRUSH ise `WaveShaper`'a
  düşer; arayüz bunu `İŞLEMCİ: WAVESHAPER · GÜRÜLTÜ: BUFFER` satırıyla bildirir.
- Tema, `<head>` içindeki küçük bir betikle açılışta belirlenir (yanlış tema flaşı olmaz) ve
  `localStorage` anahtarında saklanır.
