# Roadmap 🗺️

> Tamamlanan tüm maddeler [CHANGELOG.md](CHANGELOG.md) dosyasında sürüm bazında kayıtlıdır.
> Bu dosya yalnızca **yapılacak işleri** tutar.

**Durum:** v2.0.0 yayında (27 Eylül 2026) · Modüler mimari, mixer, MIDI, preset, PWA hazır.
**Son güncelleme:** 27 Eylül 2026

---

## 🎯 Kısa Vadeli (v2.1)

### Ses

- [ ] **WaveShaper tabanlı CRUSH yedeği** — `file://` üzerinde AudioWorklet yüklenemediği için CRUSH düğmesi
      çalışmıyor; `core/effects.js` içine native bir yedek işleyici ekle (`js/core/engine.js:applyCrush`)
- [ ] **Kanal PAN kontrolü** — `mixer-state.js` şemasına `pan` alanı, `StereoPannerNode` ile bağlama
- [ ] **Master EQ / tilt** — bas-tiz dengesi için iki bantlı filtre (`core/effects.js`)
- [ ] **Reverb pre-delay** — delay bus'ına kısa bir gecikme eklenmesi (`DelayBus` içine yeni düğüm)

### Müzik

- [ ] **Şarkı uzunluğu seçimi** — 16 / 32 / 64 adım; `STEPS` sabitini çalışma zamanı yapılandırmasına çevir
      (`core/theory.js`, `core/composer.js`, `io/midi.js`)
- [ ] **Nota uzunluğu / legato** — tür verisine `noteLength` alanı, `core/instruments.js` zarf süresi
- [ ] **Arpej yönü** — yukarı / aşağı / rastgele; `core/composer.js` melodi üretimi
- [ ] **Özel ölçek seçici** — Dorian, Phrygian Dominant, Pentatonic + kullanıcı tanımlı gam listesi
      (`core/genres.js`, yeni `core/scales.js`)
- [ ] **Yeni türler** — Synthwave, Chiptune, Dungeon Synth (yalnızca `genres.js` verisi gerekir)

### Arayüz

- [ ] **Sürgü çift tıklama sıfırlaması için görsel geri bildirim** (değer balonu)
- [ ] **Klavyeyle mixer gezinme** — fader'lar arasında ok tuşlarıyla geçiş, odak halkası
- [ ] **Açık/koyu tema** — `css/main.css` değişkenlerini `prefers-color-scheme` ve manuel anahtarla bağla
- [ ] **Durum satırı geçmişi** — son 5 mesajın görüntülenebildiği küçük bir panel

### Dışa Aktarım

- [ ] **WAV dışa aktarım** — `OfflineAudioContext` ile motorun çizimini çevrimdışı render edip 16-bit PCM yaz
      (`io/recorder.js` içine yeni sınıf)
- [ ] **Preset sürükle-bırak** — `ui/presets-ui.js` içine `dragover` / `drop` ile JSON içe aktarım
- [ ] **Paylaşım bağlantısı** — preset'i URL hash'ine sıkıştırıp kopyalanabilir bağlantı üret

---

## 🚀 Orta Vadeli (v2.2)

### Bestecinin gelişmesi

- [ ] **Melodi editörü** — piyano klavyesi + 32/64 adımlık ızgara; elle nota girme ve silme
      (yeni `ui/piano-ui.js` + `io/editor.js`, motor `setSequence` API'sini zaten hazır)
- [ ] **Akor ilerlemesi** — ölçü başına akor listesi, akor tonlarını gam ile harmanize etme
- [ ] **Çoklu desen ve zincirleme** — A/B/C bölümleri, geçiş ve tekrar düzeni
- [ ] **Davul deseni editörü** — kick/snare/hat ızgarası + yeni perküsyon sesleri
- [ ] **MIDI içe aktarım** — `.mid` okuyup nota dizisine çevirme (`io/midi.js` içine ayrıştırıcı)

### Ürün

- [ ] **Şarkı kütüphanesi** — düzenlenebilir isim, arama, sıralama, favoriler
- [ ] **Paylaşım** — kısa kod ile şarkı gönderme, gelen şarkıyı yükleme
- [ ] **Çok dilli arayüz** — TR / EN geçişi (`ui/i18n.js`, metinler tek dosyada)
- [ ] **Tema üreticisi** — seed'den deterministik tür + kitap renkleri

---

## 🌮 Uzun Vadeli (v3.0)

- [ ] **Video dışa aktarım** — ses + görselleştirme → WebM/MP4
- [ ] **Masaüstü paketi** — Electron veya Tauri ile tek uygulama
- [ ] **Oyun motoru SDK'sı** — aynı sentez motorunun Web Audio dışına taşınması
- [ ] **Canlı performans modu** — mikserden geri beslemeli deneme, loop kaydı ve katmanlama
- [ ] **Plugin/format desteği** — VST3 veya CLAP benzeri bir dışa aktarım seçeneği

---

## 🔧 Altyapı ve Kalite

- [ ] **GitHub Actions** — `npm run check` + `npm run build` + ikon üretimini her push'ta çalıştır
- [ ] **Sürüm paketleri** — `dist/` dosyasını GitHub Release'e yükleyen iş akışı
- [ ] **GitHub Pages dağıtımı** — demo sürümü her sürümde yayınlansın
- [ ] **Sürüm etiketi** — sürüm numarasını tek yerden okuyup arayüzde ve manifestte göster
- [ ] **Test kapsamı** — `tools/check.mjs` içine küçük bir DOM taklidi ile arayüz testleri
- [ ] **Tarayıcı testi** — headless koşuyu CI'a taşı (üç senaryo: modüler, paket, `file://`)
- [ ] **Erişilebilirlik** — ekran okuyucu duyuruları, odak sırası, kontrast denetimi
- [ ] **Performans ölçümü** — zamanlayıcı sapması ve etkin ses sayısı göstergesi

---

## 💡 Değerlendirme Aşamasındaki Fikirler

- [ ] Yapay zekâ destekli melodi önerileri
- [ ] VR/AR görselleştirici
- [ ] WebSocket ile canlı paylaşım (jam session)
- [ ] Enstrüman örnekleri (kullanıcı yüklediği seslerden prosedürel aletler üretme)

---

## 🧭 Nasıl İlerlenir?

1. Bir madde seç, ilgili modülü belirle (yukarıdaki parantez içi notlar yol gösterir).
2. `npm run check` yeşilken başla, iş bitince tekrar koştur.
3. Tarayıcıda `python -m http.server 8123` ile dinle, konsolda hata olmadığından emin ol.
4. `tools/build.mjs` içinde bir dosyaya dokunduysan `npm run build` ile paketi yeniden üret.
5. `docs/KNOWLEDGE.md` içine yeni formül/kural eklediysen aynı dosyada güncelle.
6. Biten maddeyi bu dosyadan sil, `CHANGELOG.md` içindeki `[Unreleased]` bölümüne taşı.
