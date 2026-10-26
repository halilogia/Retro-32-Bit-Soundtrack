# 🧠 Retro-32-Bit-Soundtrack Mühendislik Hafızası (KNOWLEDGE.md)

Bu dosya, retro müzik ve synth ses üreteci projesinin mimari karar kayıtlarını (ADR) ve Web Audio API teknik tuzaklarını (Gotchas) belgeler.

---

## 🏛️ Mimari Karar Kayıtları (ADR)

### [ADR-01] Saf Web Audio API ve Osilatör Mimarisi
- **Karar:** Harici ses örnekleri (sample wav/mp3) indirmek yerine sesler matematiksel osilatörler (Square, Sawtooth, Triangle, Noise) ile procedürel sentezlenir.
- **Gerekçe:** Sıfır yükleme süresi, sonsuz varyasyon ve 90'lar oyun konsolu (SNES, Genesis, GameBoy) ses çipi doğruluğu.

### [ADR-02] MediaStream & MediaRecorder ile İstemci Tarafı Kayıt
- **Karar:** Canlı çalınan parçalar `AudioDestinationNode` üzerinden `MediaRecorder` ile doğrudan WAV/WebM formatında diske kaydedilir.

---

## ⚠️ Kritik Teknik Tuzaklar (Gotchas)

### [GOTCHA-01] Tarayıcı Otomatik Çalma (Autoplay Policy) Kısıtlaması
- **Tuzak:** Kullanıcı sayfayla etkileşime girmeden `AudioContext` başlatılırsa `state: 'suspended'` durumunda kalması.
- **Çözüm:** `AudioContext.resume()` ilk kullanıcı tıklamasında veya başlat butonunda çağrılır.
