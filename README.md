# 🩸 Kan Uygulaması — Mobil İstemci (Frontend)

![React Native](https://img.shields.io/badge/React_Native-0.81.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-v54-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Private Repository](https://img.shields.io/badge/Status-Private_Repo-e63946?style=for-the-badge)

**Kan Uygulaması**, Türkiye genelinde acil kan ihtiyacı olan hastalar ile kan bağışçısı (gönüllü) olmak isteyen insanları saniyeler içinde buluşturan yeni nesil, mobil odaklı ve hayat kurtaran bir sosyal platformdur.

Bu depo, uygulamanın **React Native (Expo + TypeScript)** kullanılarak geliştirilen mobil kullanıcı arayüzü (Frontend) kodlarını barındırmaktadır.

---

## ✨ Öne Çıkan Özellikler

* 🔍 **Gelişmiş & Hızlı Filtreleme:**  
  * **Kan Grubu:** `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `0+`, `0-` bazlı anlık süzme.
  * **Aciliyet Seviyesi:** `Normal`, `Acil` ve `Kritik` (Özel kırmızı rozet ve önceliklendirme).
  * **Şehir & İlçe Arama:** Türkiye'nin 81 ili için arama destekli akıllı şehir seçim modalı (`KeyboardAvoidingView` ile klavye dostu deneyim).
* 🦸‍♂️ **Gönüllülük ve Başvuru Yönetimi:**  
  * İhtiyaç ilanlarına tek tıkla **"Gönüllü Ol"** başvurusu yapma.
  * Kendi açtığınız ilanlara gelen gönüllüleri **İlanı Yönet (`MyListingDetailScreen`)** ekranından detaylarıyla inceleme, **Onaylama (Kabul)** veya **Reddetme** seçeneği.
  * Başvurduğunuz ilanlardan dilediğiniz zaman **Başvuruyu Geri Çekme** imkanı.
  * Kendi ilanlarınıza veya daha önce başvurduğunuz ilanlara mükerrer başvurmayı engelleyen **akıllı koruma mekanizmaları**.
* 🔔 **Dinamik & Türkçe Bildirim Altyapısı:**  
  * İlanınıza yeni bir gönüllü başvurduğunda anında **"🙋 Yeni Gönüllü Başvurusu"** bildirimi.
  * Başvurunuz onaylandığında **"🎉 Başvurunuz Onaylandı"**, sonuçlandığında **"✕ Başvurunuz Sonuçlandı"** bildirimleri.
  * Tüm bildirimleri tek tıkla okundu olarak işaretleme ve canlı okunmamış bildirim rozeti (Badge).
* 👤 **Gelişmiş Profil & Geçmiş Takibi:**  
  * **Başvurularım (Gönüllü Olduklarım):** Başvuru durumlarını (`Beklemede`, `Onaylandı`, `Reddedildi`, `Tamamlandı`) gerçek zamanlı takip.
  * **Açtığım İlanlar:** Kendi taleplerinizin durumunu yönetme, yayından kaldırma, tamamlandı olarak işaretleme.
  * Hayat kurtarma istatistikleri, bağış serileri (streak) ve kişisel bilgi yönetimi.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

| Kategori | Teknoloji / Kütüphane | Versiyon / Detay |
| :--- | :--- | :--- |
| **Çekirdek (Core)** | React Native & React | `v0.81.5` / `v19.1.0` |
| **Platform / Çatı** | Expo | `~54.0.35` |
| **Programlama Dili** | TypeScript | `~5.9.2` |
| **Navigasyon** | React Navigation v7 | `Bottom-Tabs` & `Native-Stack` |
| **Ağ & API İstekleri** | Axios | `v1.18.1` (Interceptors & JWT Auth) |
| **Yerel Depolama** | AsyncStorage | `v2.2.0` (Oturum token yönetimi) |

---

## 📁 Proje Dizin Yapısı

```bash
BloodApp/
├── src/
│   ├── api/
│   │   ├── apiClient.ts         # Axios temel yapılandırması & Token Interceptor
│   │   └── blood.ts             # Tüm backend API servis wrappers (İlanlar, Gönüllüler, Bildirimler)
│   ├── constants/
│   │   └── cities.ts            # Türkiye 81 il listesi
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Alt sekme (Bottom Tab) ve Sayfa yığınları (Stack Navigation)
│   └── screens/
│       ├── HomeScreen.tsx           # Ana Sayfa (İlan listesi, gelişmiş filtreler, şehir arama modalı)
│       ├── ListingDetailScreen.tsx  # İlan Detayı (Hasta bilgisi, Gönüllü ol / Geri çek)
│       ├── MyListingDetailScreen.tsx# İlanımı Yönet (Gelen başvuruları onaylama/reddetme, ilanı kapatma)
│       ├── CreateListingScreen.tsx  # Yeni Kan Talebi Oluşturma
│       ├── NotificationsScreen.tsx  # Bildirim Merkezi (Türkçe akıllı çeviri & okundu işaretleme)
│       ├── ProfileScreen.tsx        # Profil Sayfası (Kullanıcı istatistikleri, sekme tabanlı geçmiş)
│       ├── LoginScreen.tsx          # Giriş Yap
│       └── SignupScreen.tsx         # Yeni Üyelik Oluştur
├── App.tsx                      # Ana uygulama giriş noktası
├── app.json                     # Expo yapılandırma dosyası
├── package.json                 # Bağımlılıklar ve scriptler
└── tsconfig.json                # TypeScript yapılandırma dosyası
```

---

## 🚀 Kurulum ve Yerelde Çalıştırma

### 1. Gereksinimler
* **Node.js** (`v18+` önerilir)
* **npm** veya **yarn**
* **Expo Go** (Telefonunuzda test etmek için iOS/Android uygulaması) veya **Android Studio Emulator**

### 2. Projeyi Klonlama ve Bağımlılıkları Yükleme
```bash
git clone <PRIVATE_REPO_URL>
cd BloodApp
npm install
```

### 3. API Sunucu Adresini (Backend URL) Yapılandırma
Uygulamanın Go (Gin) backend sunucusu ile haberleşmesi için ağ yapılandırmanızı kontrol edin:
* `src/api/apiClient.ts` dosyasını açın.
* `baseURL` değerinin yerel ağınızdaki Go sunucunuzun IP adresine veya canlı sunucu URL'ine (`http://192.168.x.x:8080/api`) ayarlı olduğundan emin olun.
> [!TIP]
> Fiziksel telefon (`Expo Go`) üzerinden test yaparken `localhost` yerine bilgisayarınızın yerel ağ (`WLAN/LAN`) IPv4 adresini kullanmalısınız.

### 4. Geliştirme Sunucusunu Başlatma
```bash
npm start
# veya
npx expo start --clear
```

* Terminalde beliren **QR kodu** telefonunuzdaki **Expo Go** uygulaması ile okutarak uygulamayı anında canlı olarak test edebilirsiniz.
* Android emülatörde açmak için terminalde `a` tuşuna basabilirsiniz.

---

## 🔒 Gizlilik ve Lisans Bilgisi

> [!CAUTION]
> **ÖZEL DEPO (PRIVATE REPOSITORY)**  
> Bu projenin kaynak kodları, tasarımı ve mimarisi özel mülkiyettir. Yetkisiz olarak paylaşılması, çoğaltılması, halka açık platformlarda yayınlanması veya ticari amaçla izinsiz kullanılması kesinlikle yasaktır.
