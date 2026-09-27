# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.

## [Unreleased]

### ✨ Eklenenler

-

### 🔧 Düzeltmeler

- `tools/build.mjs` artık paketlemeye girmeyen modül dosyalarını (kullanılmayan ya da yanlış yol yazılmış
  içe aktarmalar) derleme hatası olarak bildiriyor

### 📦 Değişiklikler

- **

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
