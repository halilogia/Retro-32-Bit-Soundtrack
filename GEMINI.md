# 32-Bit Retro Soundtrack Generator - Gemini CLI Kuralları

## 📁 Proje Yapısı

```
Retro-32-Bit-Soundtrack/
├── index.html          ← Tüm uygulama (tek dosya)
├── README.md           ← Proje açıklaması
├── ROADMAP.md          ← Gelecek planlar
├── CHANGELOG.md        ← Değişiklik günlüğü
├── .gitignore          ← Git hariç tutma
├── brain/              ← Proje yönetimi
│   ├── task.md
│   ├── implementation_plan.md
│   └── walkthrough.md
└── docs/               ← Dokümantasyon
```

## 🔧 Proje Kuralları

### Tek Dosya Prensibi

Bu proje **tek HTML dosyası** olarak tasarlanmıştır. Tüm CSS ve JavaScript `index.html` içindedir.

- ❌ Ayrı `.css` veya `.js` dosyası oluşturma
- ✅ Tüm değişiklikleri `index.html` içinde yap

### Ses Motoru

- Web Audio API kullanılır
- Osilatör tipleri: `sine`, `square`, `sawtooth`, `triangle`
- Her müzik türü için ayrı ayarlar `Genres` objesinde tanımlı

### Yeni Müzik Türü Ekleme

1. `Genres` objesine yeni tür ekle:

```javascript
'yenitur': {
    name: "YENİ TÜR",
    tempo: 120,
    scales: {
        melody: ['C4', 'D4', 'E4', ...],
        bass: ['C2', 'D2', ...]
    },
    sounds: {
        lead: { type: 'sawtooth', release: 0.3, filterStart: 500, filterEnd: 2000 },
        bass: { type: 'sine', release: 0.4 },
        drumIntensity: 0.7
    }
}
```

2. `<select>` içine yeni option ekle:

```html
<option value="yenitur">🎵 YENİ TÜR</option>
```

### CSS Değişkenleri

Renk değişiklikleri için `:root` içindeki CSS değişkenlerini kullan:

```css
--bg-color: #1a0b2e;
--terminal-green: #4af626;
--neon-pink: #ff2a6d;
--neon-blue: #05d9e8;
```

## 🆕 Değişiklik Yapma Rehberi

1. Değişiklikten önce `CHANGELOG.md`'yi güncelle
2. Test için tarayıcıda dosyayı aç
3. Commit mesajı açıklayıcı olsun

## 🎵 Notlar

- Bu proje hiçbir harici bağımlılık kullanmaz
- Tüm sesler matematiksel olarak üretilir
- MP3/WAV dosyası yoktur
