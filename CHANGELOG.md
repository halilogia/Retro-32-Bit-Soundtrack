# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.

## [Unreleased]

### ✨ Eklenenler

-

### 🔧 Düzeltmeler

-

### 📦 Değişiklikler

- **

## [2.1.0] - 27 Eylül 2026

### ✨ Eklenenler

- 🎛️ **ŞARKI AYARLARI paneli:** döngü uzunluğu (16 / 32 / 64 adım), nota uzunluğu (0.25 - 8 adım),
  arpej yönü (rastgele / yukarı / aşağı) ve ölçek seçimi (11 hazır gam)
- 🎚️ **Yeni türler:** Synthwave (NEON DRIVE), Chiptune (PIXEL PIPELINE), Dungeon Synth (CRYPT DEPTHS)
  — toplam 7 tür
- 🎚️ **Tür başına mixer varsayılanları:** tür değiştirildiğinde o türün karakterine uygun reverb/delay/EQ
  karışımı otomatik yüklenir (örn. Chiptune yankısız, Synthwave yoğun delay'li)
- 🎚️ **Kanal PAN kontrolü** (`StereoPannerNode`, merkez detent)
- 🎚️ **Master EQ** — iki bantlı shelf (BASS 220 Hz, TREBLE 3600 Hz, ±12 dB)
- ⏱️ **Reverb pre-delay** (0 - 200 ms)
- 🎛️ **CRUSH yedeği:** AudioWorklet yüklenemeyen ortamlarda (ör. `file://`) WaveShaper tabanlı bitcrush +
  doygunluk devreye giriyor, düğme artık her ortamda çalışıyor
- 💾 **WAV dışa aktarım** — `OfflineAudioContext` ile iki döngü 44.1 kHz 16-bit stereo render edilip
  `.wav` olarak indiriliyor (MIDI ve kayıt ile aynı düğme grubunda)
- 🔗 **Paylaşım bağlantısı** — preset base64url olarak URL hash'ine sıkıştırılıp panoya kopyalanıyor;
  açılan sayfa bağlantıdaki şarkıyı doğrudan yüklüyor
- 📥 **Preset sürükle-bırak** — JSON dosyası doğrudan preset panosuna bırakılabiliyor
- 🌓 **Açık/koyu tema** — sistem tercihini izler, düğmeyle değiştirilir ve hatırlanır
- 🕘 **Durum geçmişi** — son 4 durum mesajı saat damgasıyla listeleniyor
- ↩️ **Sürgü geri bildirimi** — çift tıklayıp fabrika değerine dönerken etikette yanıp sönen işaret
- ⌨️ `W` kısayolu WAV dışa aktarımı, mixer şeritlerinde klavye odağını belirginleştiren `:focus-within` stili

### 🔧 Düzeltmeler

- 🎚️ Master EQ zinciri kompresörden kopuktu (EQ hiç etkilenmiyordu); zincir
  `master → crush → EQ → kompresör` olarak düzeltildi
- 🔊 `MasterEq` ve `Crusher` çıkışları hedef verilmeden `undefined` bir düğüme bağlanıyordu
- ⏱️ Notaların kapatılma zamanı iki kez `time` eklenerek hesaplanıyordu; zarf ve `osc.stop()` süresi düzeltildi
- 🔤 Uygulama açılışında yanlış tema bir anı görünmesin diye tema `<head>` içinde küçük bir betikle belirleniyor
- 🧰 `tools/build.mjs` artık pakete girmeyen modül dosyalarını derleme hatası olarak bildiriyor
  (sessizce dağıtımdan düşen dosyaları yakalar)

### 📦 Değişiklikler

- 🏗️ Ses grafiği `createGraph()` ve `applyMixer()` fonksiyonlarına çıkarıldı; canlı bağlam ve çevrimdışı
  render aynı topolojiyi paylaşıyor
- 🧩 Yeni modüller: `core/scales.js`, `core/song-settings.js`, `core/crush.js`, `io/wav.js`, `io/share.js`,
  `ui/settings-ui.js`, `ui/status-log.js`, `ui/theme.js` (toplam 25 ES modülü)
- 💾 Preset ve oturum şemasına `settings` alanı eklendi (uzunluk, nota uzunluğu, arpej, ölçek)
- 🎼 MIDI çıktısı sabit 32 adım yerine dizinin gerçek uzunluğundan hesaplanıyor
- 🧪 Test paketi 309 kontrole, tarayıcı doğrulaması 56 kontrole yükseltildi (üç çalışma senaryosu)

## [2.0.0] - 27 Eylül 2026

### ✨ Eklenenler

- 🎛️ **Mixer:** LEAD / BASS / DRUMS kanalları için VOL, MUTE, REVERB ve DELAY gönderimleri; master için VOL, MUTE
  ve CRUSH kontrolleri
- 🌊 **Reverb:** prosedürel impuls yanıtı, SIZE ve DAMP parametreleri
- ⏱️ **Delay:** tempoya senkron bölüm seçimi (1/16, 1/8, 3/16, 1/4), FEEDBACK ve DAMP parametreleri
- 📊 Kanal ve master için VU seviye göstergeleri
- 🎚️ **AudioWorklet:** `retro-noise` (paylaşımlı beyaz gürültü kaynağı) ve `retro-crush` (bitcrush + `tanh` doygunluk)
- 🎼 **MIDI dışa aktarımı:** 480 tick/ölçü, 4 parça (tempo, lead, bas, GM perküsyon)
- 💾 **Preset sistemi:** tarayıcı belleğinde kaydet/yükle/sil, JSON dışa-içe aktarım, en fazla 40 preset
- 🔁 Son oturumun (tür, beste, mixer ayarları) otomatik geri yüklenmesi
- 📱 **PWA:** web manifesti, service worker ile çevrimdışı çalışma, kurulabilir uygulama, prosedürel PNG ikonlar
- ⌨️ Klavye kısayolları: `SPACE` çal/duraklat, `R` yeni şarkı, `M` master mute
- 🧪 `tools/check.mjs` ile sıfır bağımlılıklı sözdizimi + mantık test paketi
- 📦 `tools/build.mjs` ile tek dosya dağıtım paketi (`dist/retro-synth-standalone.html`)

### 🔧 Düzeltmeler

- 🎹 Nota adı → perde dönüşümünde yarım ton kayması giderildi (`C4` artık MIDI 60)
- 🧹 Her davul vuruşunda yeni gürültü buffer'ı oluşturmak yerine paylaşımlı kaynak kullanılıyor; zincirler vuruş
  sonrası otomatik ayrıştırılıyor (grafik sızıntısı önleniyor)
- ⏱️ Görselleştirici artık notanın planlandığı anda değil, duyulduğu anda tepki veriyor
- 🔤 Web fontu `<head>` içinde engelleyici stylesheet olarak değil, uygulama açıldıktan sonra yükleniyor; ağ olmayan
  ortamda arayüz bloklanmıyor
- 📐 `file://` üzerinden açıldığında AudioWorklet yüklenemezse uygulama yedek kaynağa düşüyor (bilgilendirme satırı)

### 📦 Değişiklikler

- 🧱 `index.html` 670 satırlık tek dosyadan uygulama kabuğuna dönüştürüldü; 17 ES modülüne ve 2 AudioWorklet
  betiğine, `css/main.css` dosyasına ve `tools/` klasörüne ayrıldı
- 🎼 Tür verisi tamamen veri tabanlı hale getirildi (synth kodunda tür adına göre dallanma kaldırıldı)
- 🎚️ Master kazancı mixer zincirinin parçası oldu; kanallar kazanç kaybı olmadan efektlere gönderim yapar
- 📱 Sayfa kaydırmaya açıldı, 640 px altı için mobil düzen eklendi
- 📄 `GEMINI.md` ve `ROADMAP.md` yeni mimariye göre güncellendi

## [1.0.0] - 19 Aralık 2024

### İlk Sürüm

- 🎹 4 farklı müzik türü (Arcade, Lo-Fi, Dark, Glitch)
- 🎵 Prosedürel melodi, bas ve ritim üretimi
- 📊 Canlı frekans görselleştirici
- 🔴 WebM formatında ses kayıt özelliği
- 🎨 Neon/Cyberpunk temalı retro arayüz
- 🔧 Web Audio API ile canlı ses sentezi
