# 🎹 32-Bit Retro Soundtrack Generator

Tarayıcıda çalışan, **hiçbir ses dosyası kullanmayan** prosedürel (algoritmik) retro müzik üreticisi. Duyduğunuz her ses
matematiksel dalgalardan (sine, square, sawtooth, triangle) ve gerilim/yankı zincirlerinden anlık olarak sentezlenir.

Kurulum gerektirmez, derleme gerektirmez, npm paketi yoktur. Sadece tarayıcı.

**Sürüm:** 2.0.0 · [Yol haritası](ROADMAP.md) · [Sürüm geçmişi](CHANGELOG.md) · [Mimari](ARCHITECTURE.md)

---

## 🌟 Özellikler

| Özellik | Durum |
| --- | --- |
| 4 müzik türü (Arcade, Lo-Fi, Dark, Glitch) | ✅ |
| Prosedürel melodi / bas / ritim üretimi | ✅ |
| **Mixer:** kanal başına VOL, MUTE, REVERB ve DELAY gönderimi | ✅ |
| **Master:** VOL, MUTE ve CRUSH (bitcrush + yumuşak doygunluk) | ✅ |
| **Reverb:** prosedürel impuls yanıtı, SIZE + DAMP | ✅ |
| **Delay:** tempoya senkron, FEEDBK + DAMP (0.85 üstü geri besleme kilitli) | ✅ |
| VU seviye göstergeleri (kanal + master) | ✅ |
| **MIDI dışa aktarım** (Standart MIDI File, 4 parça, GM perküsyon) | ✅ |
| **Preset kaydet / yükle / sil** (tarayıcı belleği) | ✅ |
| **Preset JSON dışa / içe aktarım** (paylaşılabilir) | ✅ |
| Son oturumun otomatik geri yüklenmesi | ✅ |
| **AudioWorklet** tabanlı gürültü kaynağı ve bitcrush | ✅ |
| **PWA:** çevrimdışı çalışma, kurulabilir uygulama, ikonlar | ✅ |
| Ses kaydı (.webm / .ogg) | ✅ |
| Tek dosya dağıtımı (paketlenmiş sürüm) | ✅ |

---

## 🚀 Nasıl Çalıştırılır?

### 1. Modüler sürüm (geliştirme için önerilir)

ES modülleri ve AudioWorklet yalnızca bir HTTP sunucusu üzerinden yüklenebilir. Kurulum gerekmez, herhangi bir
statik sunucu yeterlidir:

```bash
python -m http.server 8123
# veya
npx serve .
```

Ardından tarayıcıda `http://localhost:8123` adresini açın. Bu modda PWA özellikleri (service worker, çevrimdışı
mod, kurulum) devreye girer.

### 2. Tek dosya sürümü (çift tıklayıp aç)

`dist/retro-synth-standalone.html` dosyası tüm CSS, JavaScript ve AudioWorklet kodunu içerir. Kurulum yok, sunucu
gerekmez, dosyayı çift tıklayıp açabilirsiniz.

Bu sürümü güncellemek için:

```bash
npm run build
```

> Not: `file://` üzerinden açıldığında tarayıcılar blob tabanlı AudioWorklet yüklemesini engelleyebilir. Bu durumda
> uygulama otomatik olarak yedek kaynağa düşer (gürültü için hazır buffer, CRUSH devre dışı) ve arayüzün altında
> `İŞLEMCİ: YEDEK KAYNAK` yazar. Geri kalan her şey (mixer, efektler, MIDI, preset) sorunsuz çalışır.

### 3. PWA olarak kurma

Uygulamayı `localhost` ya da HTTPS üzerinden açtıktan sonra tarayıcı adres çubuğundaki kurulum simgesini kullanın
(Edge/Chrome: adres çubuğu sağ altı). Uygulama ayrı pencerede açılır ve çevrimdışı çalışır.

---

## 🎛️ Kontroller

| Kontrol | Açıklama |
| --- | --- |
| Tür seçimi | Müzik tarzını değiştirir, türün temposu ve ses karakteri anında uygulanır. |
| BAŞLAT / DURDUR | Ses motorunu başlatır veya duraklatır. |
| YENİ ŞARKI | Aynı türde yeni bir melodi, bas ve ritim besteler. |
| MIDI | Üretilen 32 adımlık döngüyü `.mid` dosyası olarak indirir. |
| REC | Efektlerden sonraki master çıkışı kaydeder (`.webm`, destekleniyorsa `.ogg`). |

### Mixer

| Kontrol | Açıklama |
| --- | --- |
| Kanal VOL / MUTE | LEAD, BASS ve DRUMS kanallarının seviyesi ve sessize alma durumu. |
| Kanal REV / DLY | Kanalın reverb ve delay bus'larına gönderim miktarı (post-fader). |
| MASTER VOL / MUTE / CRUSH | Ana çıkış seviyesi ve bitcrush miktarı. |
| REVERB SIZE / DAMP | Yankı uzunluğu (0.2 - 4.0 sn) ve tınısını solduran alçak geçiren filtre. |
| DELAY DIV / FEEDBK / DAMP | Tempo ile senkron gecikme bölümü (1/16, 1/8, 3/16, 1/4), geri besleme ve sönümleme. |

Fader çift tıklaması o parametreyi fabrika değerine döndürür.

### Klavye

| Tuş | İşlev |
| --- | --- |
| `SPACE` | Başlat / duraklat |
| `R` | Yeni şarkı |
| `M` | Master sessize alma |

### Presetler

`PRESET & DOSYA` panelinde preset adı yazıp **KAYDET** diyerek tarayıcı belleğine kaydedebilirsiniz. Aynı isimle tekrar
kaydetmek üzerine yazar. **JSON İNDİR** ile paylaşılabilir bir dosya alır, **JSON YÜKLE** ile başkasının dosyasını
içe aktarırsınız. Üretilen şarkı, tür ve tüm mixer ayarları presetin bir parçasıdır; sayfayı kapatsanız bile son
oturum açılışta geri yüklenir.

---

## 🏗️ Proje Yapısı

```text
Retro-32-Bit-Soundtrack/
├── index.html                 # Uygulama kabuğu (modül ve stil bağlantıları)
├── manifest.webmanifest       # PWA bildirimi
├── sw.js                      # Service worker (çevrimdışı ön bellek)
├── package.json               # Yalnızca geliştirme betikleri (bağımlılık yok)
├── assets/
│   ├── icon.svg               # Vektör ikon
│   ├── icon-192.png           # PWA ikonu
│   ├── icon-512.png           # PWA ikonu
│   └── maskable-512.png       # Android maskeli ikon
├── css/
│   └── main.css               # Tüm arayüz stilleri
├── js/
│   ├── main.js                # Önyükleme, olay bağlama, kısayollar, oturum kaydı
│   ├── core/
│   │   ├── theory.js          # Nota/perde dönüşümleri, kırpma yardımcıları
│   │   ├── genres.js          # Tür verileri (tempo, gamlar, ses parametreleri)
│   │   ├── composer.js        # Prosedürel beste üretimi ve veri temizleme
│   │   ├── mixer-state.js     # Mixer şeması, varsayılanlar, kırpma
│   │   ├── instruments.js     # Lead/bass/davul sesleri ve gürültü havuzu
│   │   ├── effects.js         # Reverb (convolver) ve delay bus'ları
│   │   └── engine.js          # AudioContext grafiği, transport, zamanlayıcı
│   ├── io/
│   │   ├── download.js        # Blob indirme yardımcıları
│   │   ├── midi.js            # Standart MIDI File yazıcı
│   │   ├── presets.js         # localStorage + JSON preset deposu
│   │   └── recorder.js        # MediaRecorder sarmalayıcı
│   ├── ui/
│   │   ├── controls.js        # Fader, seçim, mute ve VU bileşenleri
│   │   ├── visualizer.js      # 32 adımlık görselleştirici
│   │   ├── mixer-ui.js        # Mixer şeritlerini kurar ve engine'e bağlar
│   │   └── presets-ui.js      # Preset listesi ve dosya işlemleri
│   └── worklets/
│       ├── registry.js        # Worklet'leri blob üzerinden kaydeder
│       ├── noise-processor.js # AudioWorklet beyaz gürültü kaynağı
│       └── crush-processor.js # AudioWorklet bitcrush + yumuşak doygunluk
├── tools/
│   ├── build.mjs              # Tek dosya paket üreticisi (sıfır bağımlılık)
│   ├── check.mjs              # Sözdizimi + mantık testleri (sıfır bağımlılık)
│   └── make-icons.mjs         # PNG ikon üreticisi (sıfır bağımlılık)
├── docs/
│   └── KNOWLEDGE.md           # Formüller, MIDI ve mimari notları
└── dist/                      # Üretilen tek dosya sürümü (git'e dahil değil)
```

Yol haritası için [ROADMAP.md](ROADMAP.md), sürüm geçmişi için [CHANGELOG.md](CHANGELOG.md),
ayrıntılı ses grafiği için [ARCHITECTURE.md](ARCHITECTURE.md) dosyasına bakın.

---

## 🛠️ Geliştirme Komutları

Node.js 18+ gerekir, ancak **yalnızca** geliştirme araçları içindir; uygulamanın çalışması için gerekmez ve
`node_modules` içermez.

```bash
npm run build   # dist/retro-synth-standalone.html üretir
npm run icons   # assets/*.png yeniden üretir
npm run check   # tüm modüllerin sözdizimini ve saf mantık testlerini çalıştırır
```

`npm run check` komutu (187 kontrol) nota dönüşümlerini, tür verilerini, beste üretimini, mixer kırpma kurallarını,
efekt parametrelerini, ses zarfı otomasyonunu, node grafiğini, AudioWorklet DSP'sini, MIDI dosya yapısını (kendi
ayrıştırıcısıyla), preset deposunu, manifest/service worker içeriğini ve paket bütünlüğünü doğrular.

---

## 🎵 Nasıl Çalışır? (Teknik)

- **Sequencer:** 32 adımlık (2 ölçü) 16'lık nota döngüsü, 25 ms bakış pencereli zamanlayıcı ile çalışır.
- **Besteci:** Her adım için "nota çalınsın mı?", "hangi nota?", "davul vursun mu?" kararları tür verisindeki
  olasılıklara göre verilir.
- **Synthesizer:** Tür verisindeki dalga tipi, filtre süpürmesi, zarf ve detune değerlerine göre osilatör kurar.
- **Mixer:** Her kanal kendi gain düğümüne sahiptir; kuru sinyal master'a, reverb ve delay gönderimleri ilgili bus'a
  gider. Tüm değişiklikler 10 ms'lik `setTargetAtTime` ile yumuşatılır (tıkırtı yok).
- **Efektler:** Reverb prosedürel üretilen bir impuls yanıtıyla (üstel sönümlü gürültü) çalışır; delay ise
  geri besleme döngüsünde bir alçak geçiren filtre içerir ve tempoya senkronlanır.
- **CRUSH:** AudioWorklet içinde örnek genliği düzleştirilir (bit sayısı 16 → 4) ve `tanh` ile yumuşak doygunluk
  uygulanır; kazanç `wet` karışımı ile kontrol edilir.
- **MIDI:** 480 tick/ölçü çözünürlüğünde, tempo ve 4/4 imza meta olaylarıyla; lead (kanal 0), bas (kanal 1) ve GM
  perküsyon (kanal 9) ayrı parçalarda yazılır. Nota süreleri tür verisindeki `release` değerlerinden türetilir.

---

## 📜 Lisans

Bu proje açık kaynaklıdır. Kodları istediğiniz gibi değiştirebilir, geliştirebilir ve kullanabilirsiniz.
Lisans metni için [LICENSE](LICENSE) dosyasına bakın.

Geliştirici Notu: Kulaklık takmanız tavsiye edilir! 🎧
