# 🎹 32-Bit Retro Soundtrack Generator

Tarayıcıda çalışan, **hiçbir ses dosyası kullanmayan** prosedürel (algoritmik) retro müzik üreticisi. Duyduğunuz her ses
matematiksel dalgalardan (sine, square, sawtooth, triangle) ve efekt zincirlerinden anlık olarak sentezlenir.

Kurulum gerektirmez, derleme gerektirmez, npm paketi yoktur. Sadece tarayıcı.

**Sürüm:** 2.1.0 · [Yol haritası](ROADMAP.md) · [Sürüm geçmişi](CHANGELOG.md) · [Mimari](ARCHITECTURE.md)

---

## 🌟 Özellikler

| Özellik | Durum |
| --- | --- |
| 7 müzik türü (Arcade, Lo-Fi, Dark, Glitch, Synthwave, Chiptune, Dungeon) | ✅ |
| Prosedürel melodi / bas / ritim üretimi | ✅ |
| **Şarkı ayarları:** 16/32/64 adım, nota uzunluğu, arpej yönü, 11 hazır ölçek | ✅ |
| **Mixer:** kanal başına VOL, PAN, MUTE, REVERB ve DELAY gönderimi | ✅ |
| **Master:** VOL, MUTE, CRUSH (bitcrush + yumuşak doygunluk) ve 2 bantlı EQ | ✅ |
| **Reverb:** prosedürel impuls yanıtı, SIZE + PRE (pre-delay) + DAMP | ✅ |
| **Delay:** tempoya senkron, FEEDBK + DAMP (0.85 üstü geri besleme kilitli) | ✅ |
| VU seviye göstergeleri (kanal + master) | ✅ |
| **WAV dışa aktarım** (OfflineAudioContext, 16-bit stereo) | ✅ |
| **MIDI dışa aktarım** (Standart MIDI File, 4 parça, GM perküsyon) | ✅ |
| Ses kaydı (.webm / .ogg) | ✅ |
| **Preset kaydet / yükle / sil** (tarayıcı belleği) | ✅ |
| **Preset JSON dışa / içe aktarım** + sürükle-bırak | ✅ |
| **Paylaşım bağlantısı** (URL içine sıkıştırılmış preset) | ✅ |
| Son oturumun otomatik geri yüklenmesi | ✅ |
| **AudioWorklet** tabanlı gürültü kaynağı ve bitcrush (yedekli) | ✅ |
| **PWA:** çevrimdışı çalışma, kurulabilir uygulama, ikonlar | ✅ |
| **Açık/koyu tema** ve durum mesajı geçmişi | ✅ |
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
> uygulama otomatik olarak yedek kaynaklara düşer: gürültü hazır buffer'dan gelir, CRUSH ise WaveShaper ile
> çalışmaya devam eder. Arayüzün altındaki satırda `İŞLEMCİ: WAVESHAPER · GÜRÜLTÜ: BUFFER` yazar. Geri kalan her
> şey (mixer, efektler, WAV, MIDI, preset) sorunsuz çalışır.

### 3. PWA olarak kurma

Uygulamayı `localhost` ya da HTTPS üzerinden açtıktan sonra tarayıcı adres çubuğundaki kurulum simgesini kullanın
(Edge/Chrome: adres çubuğu sağ altı). Uygulama ayrı pencerede açılır ve çevrimdışı çalışır.

---

## 🎛️ Kontroller

| Kontrol | Açıklama |
| --- | --- |
| Tür seçimi | Müzik tarzını değiştirir; türün temposu, ses karakteri ve mixer karışımı yüklenir. |
| BAŞLAT / DURDUR | Ses motorunu başlatır veya duraklatır. |
| YENİ ŞARKI | Aynı türde yeni bir melodi, bas ve ritim besteler. |
| MIDI | Üretilen döngüyü `.mid` dosyası olarak indirir (4 parça, GM perküsyon). |
| WAV | İki döngüyü çevrimdışı render edip 44.1 kHz 16-bit stereo `.wav` indirir. |
| REC | Efektlerden sonraki master çıkışı kaydeder (`.webm`, destekleniyorsa `.ogg`). |
| AYDINLIK / KOYU | Temayı değiştirir; sistem tercihini izler ve seçimi hatırlar. |

### Şarkı Ayarları

| Kontrol | Açıklama |
| --- | --- |
| UZUNLUK | Döngüdeki 16'lık nota adımı sayısı: 16, 32 veya 64. Değiştirilince mevcut desen yeni uzunluğa döşenir (32 → 64 iki kez tekrarlanır). |
| NOTA | Nota uzunluğu, adım cinsinden (0.25 - 8). Küçük değerler staccato, büyük değerler legato. |
| ARPEJ | RASTGELE: türün olasılıklarıyla. YUKARI / AŞAĞI: her adıma bir nota düşer, ölçek sırayla yürür. |
| ÖLÇEK | Türün kendi gamı ya da seçili gam (türün kök notasına göre 2 oktav üretilir). |

### Mixer

| Kontrol | Açıklama |
| --- | --- |
| Kanal VOL / PAN / MUTE | LEAD, BASS ve DRUMS kanallarının seviyesi, stereo konumu ve sessize alma durumu. |
| Kanal REV / DLY | Kanalın reverb ve delay bus'larına gönderim miktarı (post-fader). |
| MASTER VOL / MUTE / CRUSH | Ana çıkış seviyesi ve bitcrush miktarı (0'da tamamen temiz). |
| EQ BASS / TREBLE | İki bantlı raf filtresi, ±12 dB. |
| REVERB SIZE / PRE / DAMP | Yankı uzunluğu (0.2 - 4.0 sn), pre-delay (0 - 200 ms) ve tınısını solduran alçak geçiren filtre. |
| DELAY DIV / FEEDBK / DAMP | Tempo ile senkron gecikme bölümü (1/16, 1/8, 3/16, 1/4), geri besleme ve sönümleme. |

Fader çift tıklaması o parametreyi fabrika değerine döndürür.

### Klavye

| Tuş | İşlev |
| --- | --- |
| `SPACE` | Başlat / duraklat |
| `R` | Yeni şarkı |
| `M` | Master sessize alma |
| `W` | WAV dışa aktar |

### Presetler

`PRESET & DOSYA` panelinde preset adı yazıp **KAYDET** diyerek tarayıcı belleğine kaydedebilirsiniz. Aynı isimle tekrar
kaydetmek üzerine yazar. **JSON İNDİR** ile paylaşılabilir bir dosya alır, **JSON YÜKLE** (ya da panelin üzerine
sürükleyip bırakma) ile başkasının dosyasını içe aktarırsınız. **PAYLAŞ** butonu preset'i bağlantıya sıkıştırıp
panoya kopyalar; bağlantıyı açan kişi şarkıyı doğrudan yükler. Üretilen şarkı, tür, tüm şarkı ayarları ve mixer
ayarı presetin parçasıdır; sayfayı kapatsanız bile son oturum açılışta geri yüklenir.

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
│   └── main.css               # Tüm arayüz stilleri (koyu ve açık tema)
├── js/
│   ├── main.js                # Önyükleme, olay bağlama, kısayollar, oturum kaydı
│   ├── core/
│   │   ├── theory.js          # Nota/perde dönüşümleri, adım yardımcıları
│   │   ├── scales.js          # Gam tanımları ve gamdan nota üretimi
│   │   ├── genres.js          # Tür verileri (tempo, gamlar, ses ve mixer parametreleri)
│   │   ├── composer.js        # Prosedürel beste üretimi, dizi temizleme ve döşeme
│   │   ├── song-settings.js   # Şarkı ayarları şeması (adım, nota, arpej, ölçek)
│   │   ├── mixer-state.js     # Mixer şeması, EQ bantları, kırpma ve yol bazlı güncelleme
│   │   ├── instruments.js     # Lead/bass/davul sesleri ve gürültü havuzu
│   │   ├── effects.js         # Reverb (pre-delay + convolver), delay ve master EQ
│   │   ├── crush.js           # CRUSH işleyicisi (AudioWorklet veya WaveShaper)
│   │   └── engine.js          # Graf kurucu, transport, zamanlayıcı, çevrimdışı render
│   ├── io/
│   │   ├── download.js        # Blob indirme yardımcıları
│   │   ├── midi.js            # Standart MIDI File yazıcı
│   │   ├── wav.js             # 16-bit PCM WAV kodlayıcı
│   │   ├── share.js           # Paylaşım bağlantısı kodlama/çözme
│   │   ├── presets.js         # localStorage + JSON preset deposu
│   │   └── recorder.js        # MediaRecorder sarmalayıcı
│   ├── ui/
│   │   ├── controls.js        # Fader, seçim, mute ve VU bileşenleri
│   │   ├── visualizer.js      # Adım sayısına göre büyüyen görselleştirici
│   │   ├── mixer-ui.js        # Mixer şeritlerini kurar ve engine'e bağlar
│   │   ├── settings-ui.js     # Şarkı ayarları paneli
│   │   ├── presets-ui.js      # Preset listesi, dosya işlemleri, paylaşım
│   │   ├── status-log.js      # Durum mesajı geçmişi
│   │   └── theme.js           # Açık/koyu tema yönetimi
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

`npm run check` komutu (309 kontrol) nota dönüşümlerini, gam üretimini, tür verilerini, beste üretimini, şarkı
ayarlarını, mixer kırpma kurallarını, efekt parametrelerini, ses zarfı otomasyonunu, node grafiğini, çevrimdışı
render zincirini, AudioWorklet DSP'sini, WaveShaper yedeğini, MIDI ve WAV dosya yapılarını (kendi ayrıştırıcılarıyla),
paylaşım kodunu, preset deposunu, manifest/service worker içeriğini ve paket bütünlüğünü doğrular.

Tarayıcı doğrulaması headless Edge üzerinde üç senaryoda çalıştırılır: modüler sürüm (HTTP), paketlenmiş sürüm
(HTTP) ve paketlenmiş sürüm (`file://`, yedek kaynak) — senaryo başına 56 kontrol.

---

## 🎵 Nasıl Çalışır? (Teknik)

- **Sequencer:** 16 / 32 / 64 adımlık 16'lık nota döngüsü, 25 ms bakış pencereli zamanlayıcı ile çalışır.
- **Besteci:** Her adım için "nota çalınsın mı?", "hangi nota?", "davul vursun mu?" kararları tür verisindeki
  olasılıklara göre verilir; arpej modunda ölçek deterministik olarak yürür.
- **Synthesizer:** Tür verisindeki dalga tipi, filtre süpürmesi, zarf ve detune değerlerine göre osilatör kurar.
  Nota uzunluğu, zarfın kesileceği anı adım cinsinden belirler.
- **Mixer:** Her kanal kendi gain ve pan düğümüne sahiptir; kuru sinyal master'a, reverb ve delay gönderimleri ilgili
  bus'a gider. Tüm değişiklikler 10 ms'lik `setTargetAtTime` ile yumuşatılır (tıkırtı yok).
- **Efektler:** Reverb pre-delay ve prosedürel impuls yanıtıyla (üstel sönümlü gürültü) çalışır; delay geri besleme
  döngüsünde bir alçak geçiren filtre içerir ve tempoya senkronlanır; master'da iki bantlı EQ bulunur.
- **CRUSH:** AudioWorklet varsa örnek genliği düzleştirilir (16 → 4 bit) ve `tanh` doygunluk uygulanır. Worklet
  yoksa aynı karakteristikler bir `WaveShaper` eğrisiyle (4096 noktalı, kademeli) taklit edilir.
- **MIDI:** 480 tick/ölçü çözünürlüğünde, tempo ve 4/4 imza meta olaylarıyla; lead (kanal 0), bas (kanal 1) ve GM
  perküsyon (kanal 9) ayrı parçalarda yazılır. Döngü uzunluğu dizinin gerçek adım sayısından gelir.
- **WAV:** `OfflineAudioContext` içinde canlı grafın aynı topolojisi kurulur, iki döngü baştan sona planlanır ve
  render edilen ses 16-bit stereo PCM'e çevrilerek `RIFF/WAVE` başlığıyla yazılır.

---

## 📜 Lisans

Bu proje açık kaynaklıdır. Kodları istediğiniz gibi değiştirebilir, geliştirebilir ve kullanabilirsiniz.
Lisans metni için [LICENSE](LICENSE) dosyasına bakın.

Geliştirici Notu: Kulaklık takmanız tavsiye edilir! 🎧
