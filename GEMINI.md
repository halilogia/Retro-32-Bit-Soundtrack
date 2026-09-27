# 32-Bit Retro Soundtrack Generator - AI Ajan Kuralları

## 📁 Proje Yapısı

```
Retro-32-Bit-Soundtrack/
├── index.html          ← Uygulama kabuğu (yalnızca bağlantı ve iskelet)
├── manifest.webmanifest← PWA bildirimi
├── sw.js               ← Service worker
├── package.json        ← Geliştirme betikleri (bağımlılık yok, çalışma için gerekmez)
├── css/main.css        ← Tüm stiller (koyu/açık tema)
├── js/
│   ├── main.js         ← Önyükleme ve olay bağlama
│   ├── core/           ← Ses motoru (theory, scales, genres, composer, song-settings,
│   │                     mixer-state, instruments, effects, crush, engine)
│   ├── io/             ← MIDI, WAV, share, preset, kayıt, indirme
│   ├── ui/             ← Bileşenler (controls, visualizer, mixer-ui, settings-ui,
│   │                     presets-ui, status-log, theme)
│   └── worklets/       ← AudioWorklet kaynakları + registry
├── assets/             ← SVG/PNG ikonlar
├── tools/              ← build.mjs, check.mjs, make-icons.mjs
└── dist/               ← Üretilen tek dosya paket (git'e dahil değil)
```

## 🔧 Proje Kuralları

### Modüler Mimari

Bu proje **ES modülleri** olarak tasarlanmıştır. Her dosya tek bir sorumluluğa sahiptir.

- ✅ Yeni davranış için mevcut modülleri genişlet; yeni dosya açmadan önce uygun modülü kontrol et
- ✅ Yeni modül eklerken `js/main.js` üzerinden ya da mevcut modüllerden biri üzerinden bağla
- ✅ Modüller arası bağımlılık tek yönlü olmalı: `core` DOM'a dokunmaz, `ui` `AudioContext`'e dokunmaz
- ✅ Preset/ayar şemaları `sanitize*` fonksiyonları üzerinden doğrulanır; yeni alan eklerken önce şemayı güncelle
- ❌ `index.html` içine `<script>` veya `<style>` gömmeyin (tema ön yükleme betiği hariç)
- ❌ `node_modules` veya harici kütüphane eklemeyin
- ❌ `export default` kullanmayın; yalnızca adlandırılmış export kullanın
- ❌ `createGraph()` dışında ses grafiğini kuran kopya kod yazmayın (canlı ve çevrimdışı aynı topolojiyi kullanır)

### Ses Motoru

- Web Audio API kullanılır; osilatör tipleri `sine`, `square`, `sawtooth`, `triangle`
- Ses zinciri:
  `ses → kanal gain → panner → (mix bus + reverb send + delay send) → master gain → crush → EQ → kompresör`
- Efektler `core/effects.js` ve `core/crush.js` içindeki sınıflar üzerinden kurulur
- Ses parametreleri `setTargetAtTime` ile uygulanır (ani `value` ataması tıkırtı yapar)
- `AudioContext.currentTime` saat kaynağı olarak kullanılır, `Date.now()` ses zamanlamasında kullanılmaz
- AudioWorklet kullanılamıyorsa (ör. `file://`) her işlemcinin yedeği olmalı (bkz. `Crusher`)

### Yeni Müzik Türü Ekleme

1. `js/core/genres.js` içindeki `RAW_GENRES` içine yeni türü ekle. `sounds` ve `mixer` alanları sadece farkları
   yazar; eksik alanlar `BASE_SOUNDS` / `DEFAULT_MIXER` içinden gelir.

```javascript
'yenitur': {
    label: 'YENİ TÜR',
    icon: '🎵',
    name: 'YENİ TÜR',
    tempo: 120,
    scales: {
        melody: ['C4', 'D4', 'E4'],
        bass: ['C2', 'G2']
    },
    sounds: {
        melodyChance: 0.5,
        lead: { type: 'sawtooth', release: 0.3, noteLength: 4, filter: { start: 500, to: 2000, settle: { to: 500 } } },
        bass: { type: 'square', release: 0.4, noteLength: 2, detune: 0 },
        drums: { intensity: 0.7, kick: { start: 150 } }
    },
    mixer: {
        channels: { lead: { reverb: 0.2, delay: 0.1 } },
        reverb: { size: 2, preDelay: 0.03 },
        eq: { bass: 1, treble: 0 }
    }
}
```

2. `<select>` içine manuel option eklemeyin; seçenekler `GENRE_LIST` üzerinden otomatik üretilir.
3. Gerekirse `js/io/midi.js` içindeki `PROGRAM_BY_TYPE` eşlemesini genişletin.
4. `tools/check.mjs` tür başına otomatik doğrulama yapar (tempo, gam geçerliliği, ses ve mixer alanları).

### Yeni Preset / Ayar Alanı Ekleme

- Mixer alanları: `js/core/mixer-state.js` → `sanitizeMixer` + `channel()`
- Şarkı ayarları: `js/core/song-settings.js` → `sanitizeSettings`
- Dizi alanları: `js/core/composer.js` → `sanitizeSequence`
- Eski presetler bozulmasın diye `sanitize*` içinde varsayılan dönüşü mutlaka tanımlayın.

### CSS Değişkenleri

Koyu tema `:root`, açık tema `[data-theme='light']` altında tanımlıdır. Yeni renk eklerken **her iki temada da**
karşılığını tanımlayın ve sabit renk yerine değişken kullanın (`--surface-bg`, `--strip-bg`, `--track-bg`).

```css
--bg-color: #1a0b2e;
--terminal-green: #4af626;
--neon-pink: #ff2a6d;
--neon-blue: #05d9e8;
```

## 🧪 Değişiklik Yapma Rehberi

1. `npm run check` çalıştır (sözdizimi + mantık testleri, 309 kontrol)
2. Tarayıcıda `python -m http.server 8123` ile aç ve konsolu kontrol et
3. Paketlenmiş sürümü etkiliyorsa `npm run build` çalıştır
4. İkonları değiştirdiysen `npm run icons` çalıştır ve `sw.js` içindeki `CACHE` sürümünü artır
5. Yeni `js/` dosyası eklediysen `sw.js` `PRECACHE` listesine de ekle
6. `CHANGELOG.md` dosyasını güncelle

## ⚠️ Dikkat Edilmesi Gerekenler

- `sw.js` içindeki `PRECACHE` listesine yeni bir dosya eklediysen `CACHE` sürümünü değiştir, aksi halde
  eski dosyalar önbellekten gelir
- `tools/build.mjs` paketleyicisi yalnızca satır başındaki `import`/`export` ifadelerini dönüştürür; yeni modül
  yazarken bu biçimi bozmayın. Pakete girmeyen modül dosyası varsa derleme hata verir, bu bir güvenlik
  ağıdır (sessizce dağıtımdan düşen dosyaları yakalar)
- AudioWorklet kaynakları `file://` üzerinden yüklenemez; `engine.js` yedeğe düşer ve `engineInfo` satırında
  `WAVESHAPER` / `BUFFER` yazar
- Web fontu bilinçli olarak JavaScript ile yüklenir; `<head>` içine geri taşırmayın, aksi halde ağ yokken uygulama
  bloklanır
- Adım sayısı çalışma zamanında değişebilir; görselleştirici `visualizer.setStepCount()` ile senkronlanır,
  preset/oturum kaydında `settings.steps` saklanır

## 🎵 Notlar

- Bu proje hiçbir harici bağımlılık kullanmaz; tüm sesler matematiksel olarak üretilir
- MP3/WAV dosyası yoktur; WAV çıktısı çalışma anında `OfflineAudioContext` ile üretilir
- Node.js yalnızca `tools/` betikleri için gereklidir, uygulamanın çalışması için gerekmez
