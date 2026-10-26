# 📜 SKILLS.md — Retro-32-Bit-Soundtrack Geliştirici & Ajan Standartları

Bu doküman, projede çalışan ajanlar ve geliştiriciler için Web Audio API standartlarını ve DoD kriterlerini tanımlar.

---

## 🎯 Temel İlkeler ve Sınırlar

- **Platform:** Saf Web Audio API ve Vanilla TypeScript.
- **Sıfır Dış Ses Kütüphanesi:** Tone.js veya Howler gibi harici kütüphaneler eklenemez, saf yerleşik Web Audio standartları korunur.
- **200 Satır Kuralı:** Dokümantasyon 200 satırı aşamaz.

---

## 🛠️ Mimari Kurallar

- **Ses Temizliği (Clipping Önleme):** Master Gain nodeları dinamik kompresör (`DynamicsCompressorNode`) ile korunmalı, ses patlamaları (clipping) engellenmelidir.

---

## ✅ Tamamlanma Kriteri (Definition of Done)

1. Proje hatasız derlenmeli.
2. `TASKS.md` güncellenmeli.
3. Pre-Push kapısı doğrulanarak commit alınıp GitHub'a push edilmeli.
