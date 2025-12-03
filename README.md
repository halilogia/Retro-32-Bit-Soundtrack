🎹 32-Bit Retro Soundtrack Generator

Bu proje, Web Audio API kullanarak tarayıcı üzerinde canlı, prosedürel (rastgele algoritmik) ve sonsuz retro müzikler üreten tek dosyalık bir web uygulamasıdır.

Hiçbir dış ses dosyası (MP3, WAV) kullanmaz. Duyduğunuz her ses, matematiksel dalgalar (Sine, Square, Sawtooth) kullanılarak o an canlı sentezlenir.

🌟 Özellikler

Sonsuz Varyasyon: "Yeni Şarkı" butonuna her bastığınızda, melodiler, baslar ve ritimler rastgele bir algoritma ile sıfırdan bestelenir.

4 Farklı Müzik Türü:

🕹️ Arcade: Hızlı, neşeli, keskin synth sesleri (140 BPM).

☕ Lo-Fi: Yavaş, huzurlu, yumuşak tonlar (85 BPM).

🌑 Dark: Gerilimli, sinematik ve bozuk baslar (110 BPM).

👾 Glitch: Kaotik, çok hızlı ve rastgele vuruşlar (160 BPM).

Canlı Görselleştirici: Müziğin frekanslarına (Melodi, Bas, Davul) göre tepki veren retro barlar.

Ses Kayıt (Recording): Üretilen müziği beğendiğinizde .webm formatında bilgisayarınıza indirebilirsiniz.

Hafif ve Hızlı: Tek bir HTML dosyasıdır. Kurulum gerektirmez.

🚀 Nasıl Çalıştırılır?

Bu proje herhangi bir sunucu kurulumu veya Node.js gerektirmez.

retro_synth.html dosyasını indirin.

Dosyayı modern bir web tarayıcısında (Chrome, Firefox, Edge, Safari) açın.

BAŞLAT butonuna basın ve keyfini çıkarın!

🎛️ Kontroller

Buton / Kontrol

Açıklama

Tür Seçimi (Select)

Müzik tarzını (Arcade, Lofi, Dark, Glitch) değiştirir.

BAŞLAT / DURDUR

Ses motorunu başlatır veya durdurur.

YENİ ŞARKI

Mevcut türde tamamen yeni bir melodi ve ritim besteler.

REC (KAYDET)

Çalan müziği kaydetmeye başlar. Tekrar basıldığında dosyayı indirir.

🛠️ Teknolojiler

HTML5 & CSS3: Neon/Cyberpunk temalı retro arayüz tasarımı.

JavaScript (ES6+): Tüm mantık ve kontrol mekanizması.

Web Audio API: Ses sentezleme (Oscillators, Gain Nodes, Filters) ve zamanlama.

MediaStream Recording API: Canlı ses çıkışını kaydetmek için.

🎵 Nasıl Çalışır? (Teknik)

Uygulama, önceden tanımlanmış müzik gamları (Scales) ve ritim kalıpları üzerinden olasılık hesapları yapar:

Sequencer: 32 adımlık bir döngü oluşturur.

Besteci (Composer): Her adım için "Nota çalınsın mı?", "Hangi nota olsun?", "Davul vursun mu?" kararlarını rastgele verir.

Synthesizer: Seçilen notaları osilatörlere gönderir. Örneğin; Arcade modu için "Sawtooth" dalgası kullanılırken, Lofi modu için daha yumuşak "Triangle" dalgası kullanılır.

📜 Lisans

Bu proje açık kaynaklıdır. Kodları istediğiniz gibi değiştirebilir, geliştirebilir ve kullanabilirsiniz.

Geliştirici Notu: Kulaklık takmanız tavsiye edilir! 🎧