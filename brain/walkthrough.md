# Walkthrough

## Proje Kurulumu

1. `index.html` dosyasını tarayıcıda aç
2. Herhangi bir kurulum veya bağımlılık gerekmiyor

## Önemli Dosyalar

- `index.html` - Tüm uygulama (HTML + CSS + JS)
- `README.md` - Proje açıklaması
- `ROADMAP.md` - Gelecek planlar
- `CHANGELOG.md` - Değişiklik günlüğü

## Nasıl Çalışır

### Ses Sentezi

1. **Web Audio API** kullanılarak osilatörler oluşturulur
2. Melodi, bas ve davul için ayrı kanallar var
3. Her tür için farklı BPM ve dalga tipi ayarları mevcut

### Müzik Türleri

| Tür    | BPM | Melodi Dalga | Bas Dalga |
| ------ | --- | ------------ | --------- |
| Arcade | 140 | Sawtooth     | Square    |
| Lo-Fi  | 85  | Triangle     | Sine      |
| Dark   | 110 | Sawtooth     | Sawtooth  |
| Glitch | 160 | Square       | Triangle  |

### Sequencer

- 32 adımlık döngü
- Her adımda nota çalma olasılığı hesaplanır
- Türe göre yoğunluk değişir

## Notlar

- Kulaklık kullanımı önerilir
- Chrome/Firefox/Edge desteklenir
- Kayıt için tarayıcı izni gerekebilir
