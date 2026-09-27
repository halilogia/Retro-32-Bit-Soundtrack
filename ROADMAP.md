# Roadmap 🗺️

> Tamamlanan tüm maddeler [CHANGELOG.md](CHANGELOG.md) dosyasında sürüm bazında kayıtlıdır.
> Bu dosya yalnızca **yapılacak işleri** tutar.

**Durum:** v2.1.0 yayında (27 Eylül 2026) · Modüler mimari, mixer + efektler, WAV/MIDI dışa aktarım, preset +
paylaşım, PWA, açık/koyu tema.
**Son güncelleme:** 27 Eylül 2026

---

## 🎯 Kısa Vadeli (v2.2)

### Bestecinin gelişmesi

- [ ] **Melodi editörü** — piyano klavyesi + adım ızgarası; elle nota girme, silme ve vurgulama
      (yeni `ui/piano-ui.js`, mevcut `engine.setSequence` API'sini kullanır)
- [ ] **Akor ilerlemesi** — ölçü başına akor listesi, akor tonlarını seçili gamla harmanize etme
      (`core/scales.js` içine akor kurucu ekle)
- [ ] **Çoklu desen ve zincirleme** — A/B/C bölümleri, geçiş ve tekrar düzeni
- [ ] **Davul deseni editörü** — kick/snare/hat ızgarası ve yeni perküsyon sesleri
- [ ] **MIDI içe aktarım** — `.mid` okuyup nota dizisine çevirme (`io/midi.js` içine ayrıştırıcı)
- [ ] **Ölçek editörü** — kullanıcı tanımlı perde aralıkları (yarım tonlar) ve mod değiştirme

### Ses

- [ ] **Yumuşak/derinlik zinciri** — master compressor öncesi ikinci bir bant ve transient shaper
- [ ] **Stereo genişletici** — delay tabanlı Haas veya mid/side işleme (yeni düğüm)
- [ ] **LFO** — filtre/zarf/pan otomasyonu için basit düşük frekanslı osilatör (birden fazla hedefe bağlanabilir)
- [ ] **Kanal solo** — mixer'da solo butonu (bus seviyesi mantığı)
- [ ] **Reverb türü seçimi** — plate / hall / room (impuls profilinin süre ve eğim varyasyonları)

### Arayüz

- [ ] **Enstrüman panosu** — hangi synth/efekt zincirinin hangi nota için çaldığını gösteren panel
- [ ] **Preset arama ve sıralama** — çok sayıda preset olduğunda liste yerine arama kutusu
- [ ] **Klavye odağı sırası** — `details` panelleri açılıp kapanırken odağı koruyan yönlendirme
- [ ] **Dokunmatik fader ince ayarı** — kaydırma hareketi ile tek adım hassasiyet

### Dışa Aktarım

- [ ] **Tek döngü WAV** ve **stem export** (lead / bass / drums ayrı dosyalar)
- [ ] **PNG görselleştirme dışa aktarımı** — 32/64 adımlık şarkının statik bar görseli
- [ ] **MIDI içe/dışa yön ayarı** — tempo bölümü, kanal programları ve perküsyon haritası seçimi

---

## 🚀 Orta Vadeli (v3.0)

- [ ] **Video dışa aktarım** — ses + görselleştirme → WebM/MP4
- [ ] **Masaüstü paketi** — Electron veya Tauri ile tek uygulama
- [ ] **Oyun motoru SDK'sı** — aynı sentez motorunun Web Audio dışına taşınması
- [ ] **Canlı performans modu** — mikserden geri beslemeli deneme, loop kaydı ve katmanlama
- [ ] **Plugin/format desteği** — VST3 veya CLAP benzeri bir dışa aktarım seçeneği
- [ ] **Çok dilli arayüz** — TR / EN geçişi (`ui/i18n.js`)

---

## 🔧 Altyapı ve Kalite

- [ ] **GitHub Actions** — `npm run check` + `npm run build` + ikon üretimini her push'ta çalıştır
- [ ] **Sürüm paketleri** — `dist/` dosyasını GitHub Release'e yükleyen iş akışı
- [ ] **GitHub Pages dağıtımı** — demo sürümü her sürümde yayınlansın
- [ ] **Sürüm etiketi** — sürüm numarasını tek yerden okuyup arayüzde ve manifestte göster
- [ ] **Test kapsamı** — `tools/check.mjs` içine küçük bir DOM taklidi ile arayüz testleri
- [ ] **Tarayıcı testi** — headless koşuyu CI'a taşı (mevcut üç senaryo: modüler, paket, `file://`)
- [ ] **Erişilebilirlik** — ekran okuyucu duyuruları, odak sırası, kontrast denetimi
- [ ] **Performans ölçümü** — zamanlayıcı sapması ve etkin ses sayısı göstergesi

---

## 💡 Değerlendirme Aşamasındaki Fikirler

- [ ] Yapay zekâ destekli melodi önerileri
- [ ] VR/AR görselleştirici
- [ ] WebSocket ile canlı paylaşım (jam session)
- [ ] Tema üreticisi — seed'den deterministik tür + kitap renkleri
- [ ] Enstrüman örnekleri (kullanıcı yüklediği seslerden prosedürel aletler üretme)

---

## 🧭 Nasıl İlerlenir?

1. Bir madde seç, ilgili modülü belirle (yukarıdaki parantez içi notlar yol gösterir).
2. `npm run check` yeşilken başla, iş bitince tekrar koştur.
3. Tarayıcıda `python -m http.server 8123` ile aç, konsolda hata olmadığından emin ol.
4. `tools/build.mjs` içinde bir dosyaya dokunduysan `npm run build` ile paketi yeniden üret.
5. Yeni bir `js/` dosyası eklediysen `sw.js` içindeki `PRECACHE` listesine de ekle ve `CACHE` sürümünü artır.
6. `docs/KNOWLEDGE.md` içine yeni formül/kural eklediysen aynı dosyada güncelle.
7. Biten maddeyi bu dosyadan sil, `CHANGELOG.md` içindeki `[Unreleased]` bölümüne taşı.
