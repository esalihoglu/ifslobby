# BussUp - Sirket Ici Mesajlasma Uygulamasi

WhatsApp benzeri, sirket ici kullanim icin tasarlanmis mobil mesajlasma uygulamasi.

## Ozellikler

- Telefon numarasi gerektirmez - sirket e-posta adresi ile giris
- Sirket domainine bagli kullanici yonetimi
- Bireysel ve grup mesajlasma
- Gercek zamanli mesajlasma (WebSocket)
- Mesaj durumu (gonderildi, iletildi, okundu)
- Kullanici profil yonetimi
- Cevrimici/cevrimdisi durum takibi

## Teknoloji Yigini

### Backend
- Node.js + Express
- MongoDB (Mongoose ODM)
- Socket.IO (gercek zamanli iletisim)
- JWT (kimlik dogrulama)
- bcrypt (sifre hashleme)

### Mobile
- React Native (Expo)
- React Navigation
- Socket.IO Client
- AsyncStorage

## Kurulum

### Backend
```bash
cd backend
npm install
cp .env.example .env  # .env dosyasini duzenleyin
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Ortam Degiskenleri

Backend `.env` dosyasi:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bussup
JWT_SECRET=your-secret-key
COMPANY_DOMAIN=sirket.com
```
