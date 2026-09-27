# 32-Bit Retro Soundtrack Generator - AI Ajan Kuralları

## 📁 Proje Yapısı

```
Retro-32-Bit-Soundtrack/
├── index.html          ← Uygulama kabuğu (yalnızca bağlantı ve iskelet)
├── manifest.webmanifest← PWA bildirimi
├── sw.js               ← Service worker
├── package.json        ← Geliştirme betikleri (bağımlılık yok, çalışma için gerekmez)
├── css/main.css        ← Tüm stiller
├── js/
│   ├── main.js         ← Önyükleme ve olay bağlama
│   ├── core/           ← Ses motoru (theory, genres, composer, mixer-state,
│   │                     instruments, effects, engine)
│   ├── io/             ← MIDI, preset, kayıt, indirme
│   ├── ui/             ← Bileşenler (controls, visualizer, mixer-ui, presets-ui)
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
- ❌ `index.html` içine `<script>` veya `<style>` gömmeyin
- ❌ `node_modules` veya harici kütüphane eklemeyin
- ❌ `export default` kullanmayın; yalnızca adlandırılmış export kullanın
- ❌ Modül içeriğini satır başında değil, dosyanın ortasında değiştirmeyen düzenlemeler yapmayın

### Ses Motoru

- Web Audio API kullanılır; osilatör tipleri `sine`, `square`, `sawtooth`, `triangle`
- Ses zinciri kuralları:
  `ses → kanal gain → (master bus + reverb send + delay send) → master gain → crush → compressor → çıkış`
- Efektler `core/effects.js` içindeki bus sınıfları üzerinden bağlanır, doğrudan node yaratılmaz
- Ses parametreleri `setTargetAtTime` ile uygulanır (ani `value` ataması tıkırtı yapar)
- `AudioContext.currentTime` saat kaynağı olarak kullanılır, `Date.now()` ses zamanlamasında kullanılmaz

### Yeni Müzik Türü Ekleme

1. `js/core/genres.js` içindeki `RAW_GENRES` içine yeni türü ekle. `sounds` alanı sadece farkları yaz;
   eksik alanlar `BASE_SOUNDS` içinden gelir.

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
        lead: { type: 'sawtooth', release: 0.3, filter: { start: 500, to: 2000, settle: { to: 500 } } },
        bass: { type: 'square', release: 0.4, detune: 0 },
        drums: { intensity: 0.7, kick: { start: 150 } }
    }
}
```

2. `<select>` içine manuel option eklemeyin; seçenekler `GENRE_LIST` üzerinden otomatik üretilir.
3. Gerekirse `js/io/midi.js` içindeki varsayılan program eşlemesini genişletin.

### Yeni Preset Alanı Ekleme

Preset şeması `js/core/mixer-state.js` (`sanitizeMixer`) ve `js/core/composer.js` (`sanitizeSequence`) içinde
tanımlıdır. Buradaki `sanitize` fonksiyonlarını güncellemezseniz eski presetler sessizce bozulur.

### CSS Değişkenleri

```css
--bg-color: #1a0b2e;
--terminal-green: #4af626;
--neon-pink: #ff2a6d;
--neon-blue: #05d9e8;
```

## 🧪 Değişiklik Yapma Rehberi

1. `npm run check` çalıştır (sözdizimi + mantık testleri, ~190 kontrol)
2. Tarayıcıda `python -m http.server 8123` ile aç ve konsolu kontrol et
3. Paketlenmiş sürümü etkiliyorsa `npm run build` çalıştır
4. İkonları değiştirdiysen `npm run icons` çalıştır ve `sw.js` içindeki `CACHE` sürümünü artır
5. `CHANGELOG.md` dosyasını güncelle

## ⚠️ Dikkat Edilmesi Gerekenler

- `sw.js` içindeki `PRECACHE` listesine yeni bir dosya eklediysen `CACHE` sürümünü değiştir, aksi halde
  eski dosyalar önbellekten gelir
- `tools/build.mjs` paketleyicisi yalnızca satır başındaki `import`/`export` ifadelerini dönüştürür; yeni modül
  yazarken bu biçimi bozmayın
- `AudioWorklet` kaynakları `file://` üzerinden yüklenemez; bu durumda `engine.js` yedek kaynağa düşer ve
  `engineInfo` satırında `YEDEK KAYNAK` yazar
- Web fontu bilinçli olarak JavaScript ile yüklenir; `<head>` içine geri taşırmayın, aksi halde ağ yokken uygulama
  bloklanır

## 🎵 Notlar

- Bu proje hiçbir harici bağımlılık kullanmaz; tüm sesler matematiksel olarak üretilir
- MP3/WAV dosyası yoktur
- Node.js yalnızca `tools/` betikleri için gereklidir, uygulamanın çalışması için gerekmez
