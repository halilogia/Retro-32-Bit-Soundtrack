# Roadmap 🗺️

> Bu dosya yalnızca **yapılmamış işleri** tutar. Teslim edilen her şey [CHANGELOG.md](CHANGELOG.md) içinde sürüm
> bazında kayıtlıdır; burada tamamlanmış madde bulunmaz.

**Durum:** v2.1.0 · 25 ES modülü · mixer + efektler · WAV/MIDI · preset + paylaşım · PWA · açık/koyu tema
**Son güncelleme:** 27 Eylül 2026

---

## 🎵 Bestecinin Gelişmesi

- [ ] **Melodi editörü** — piyano klavyesi + adım ızgarası, elle nota girme/silme (`ui/piano-ui.js`)
- [ ] **Akor ilerlemesi** — ölçü başına akor listesi, akor tonlarını seçili gamla harmanize etme (`core/scales.js`)
- [ ] **Çoklu desen ve zincirleme** — A/B/C bölümleri, geçiş ve tekrar düzeni
- [ ] **Davul deseni editörü** — kick/snare/hat ızgarası, yeni perküsyon sesleri
- [ ] **MIDI içe aktarım** — `.mid` ayrıştırıcı ile nota dizisine çevirme (`io/midi.js`)
- [ ] **Kullanıcı tanımlı ölçek** — serbest perde aralıkları ve mod değiştirme (`core/scales.js`)

## 🔊 Ses

- [ ] **Kanal SOLO** — bus seviyesi mantığıyla
- [ ] **Geçici zincir** — master compressor öncesi ikinci bant + transient shaper
- [ ] **Stereo genişletici** — delay tabanlı Haas veya mid/side işleme
- [ ] **LFO** — filtre/zarf/pan otomasyonu
- [ ] **Reverb türleri** — plate / hall / room (impuls profili varyasyonları)
- [ ] **WAV seçenekleri** — tek döngü, stem export (lead / bass / drums ayrı dosyalar)

## 🎛️ Arayüz

- [ ] **Enstrüman panosu** — hangi zincirin hangi nota için çaldığını gösteren panel
- [ ] **Preset arama ve sıralama** — çok preset olduğunda liste yerine arama
- [ ] **Klavye odağı sırası** — paneller açılıp kapanırken odağı koruyan yönlendirme
- [ ] **Dokunmatik fader ince ayarı** — kaydırma ile tek adım hassasiyet
- [ ] **MIDI yön ayarı** — tempo bölümü, kanal programları, perküsyon haritası seçimi
- [ ] **PNG görselleştirme dışa aktarımı** — 16/32/64 adımlık statik bar görseli

## 🔧 Altyapı ve Kalite

- [ ] **GitHub Actions** — `check` + `build` + `icons` her push'ta
- [ ] **Sürüm paketleri** — `dist/` dosyasını GitHub Release'e yükleyen iş akışı
- [ ] **GitHub Pages** — demo sürümü her sürümde yayınlansın
- [ ] **Sürüm etiketi** — sürüm numarası tek yerden okunup arayüzde ve manifestte gösterilsin
- [ ] **Test kapsamı** — `tools/check.mjs` içine küçük DOM taklidi ile arayüz testleri
- [ ] **Tarayıcı testi CI'da** — mevcut üç senaryo (modüler, paket, `file://`) otomatik koşulsun
- [ ] **Erişilebilirlik** — ekran okuyucu duyuruları, odak sırası, kontrast denetimi
- [ ] **Performans ölçümü** — zamanlayıcı sapması ve etkin ses sayısı göstergesi

## 🌮 Uzun Vadeli (v3.0)

- [ ] Video dışa aktarımı (ses + görselleştirme → WebM/MP4)
- [ ] Masaüstü paketi (Electron / Tauri)
- [ ] Oyun motoru SDK'sı (sentez motorunun Web Audio dışına taşınması)
- [ ] Canlı performans modu (loop kaydı, katmanlama)
- [ ] Plugin/format desteği (VST3 / CLAP benzeri)
- [ ] Çok dilli arayüz (TR / EN)

## 💡 Fikirler

- [ ] Yapay zekâ destekli melodi önerileri
- [ ] VR/AR görselleştirici
- [ ] WebSocket ile canlı paylaşım (jam session)
- [ ] Tema üreticisi (seed'den tür + kitap renkleri)
- [ ] Enstrüman örnekleri (yüklenen seslerden prosedürel aletler)

---

## 🧭 Çalışma Düzeni

1. Maddeyi seç, ilgili modülü belirle (parantez içi notlar yol gösterir).
2. `npm run check` yeşilken başla (309 kontrol), bitince tekrar koştur.
3. `python -m http.server 8123` ile tarayıcıda dinle, konsolda hata olmadığını doğrula.
4. `tools/build.mjs` içine dokunduysan `npm run build` ile paketi yeniden üret.
5. Yeni `js/` dosyası eklediysen `sw.js` `PRECACHE` listesine ekle ve `CACHE` sürümünü artır.
6. Yeni formül/kural varsa `docs/KNOWLEDGE.md` dosyasını güncelle.
7. Biten maddeyi buradan sil, `CHANGELOG.md` içindeki `[Unreleased]` bölümüne taşı.
