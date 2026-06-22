# NetGuard AI 🛡️ — Network Security Monitoring & Intrusion Detection System

NetGuard AI — bu kichik va o'rta ofislar (SOHO) tarmoqlarida real-vaqt rejimida xavfsizlikni monitoring qilish, kiberhujumlarni aniqlash va tarmoq infratuzilmasini (jumladan, qurilmalar va printerlar holatini) boshqarish uchun yaratilgan zamonaviy veb-ilova.

NetGuard AI is a modern web application designed for real-time security monitoring, intrusion detection, and network infrastructure management (including device and printer states) in Small Office/Home Office (SOHO) networks.

---

## 🚀 Texnologiyalar Zanjiri / Tech Stack

### Frontend:
*   **Vite + React.js** — Tezkor va komponentli foydalanuvchi interfeysi.
*   **Tailwind CSS** — Moslashuvchan va zamonaviy UI/UX (Splunk va Grafana uslubida).
*   **Lucide React** — Chiroyli va minimalist ikonkalari.
*   **Recharts** — Tarmoq trafigi va protokollar tahlili uchun interaktiv grafiklar.
*   **Framer Motion** — Silliq animatsiyalar va o'tish effektlari.

### Backend:
*   **Node.js + Express** — Tezkor API server.
*   **WebSockets (`ws`)** — Real-vaqt rejimida tarmoq paketlari va tahdidlarni uzatish.
*   **Prisma ORM** — Ma'lumotlar bazasi bilan ishlash uchun zamonaviy ORM.
*   **SQLite** — Yengil va tezkor mahalliy ma'lumotlar bazasi (ishlab chiqish uchun).
*   **Ping (ICMP)** — Qurilmalar faolligini tekshiruvchi orqa fon xizmati.

---

## 🌟 Asosiy Imkoniyatlar / Key Features

1.  **Dashboard (Boshqaruv Paneli):**
    *   Tarmoqdagi qurilmalar va so'nggi ogohlantirishlar ro'yxati.
    *   Tarmoq trafigi o'zgarishi va protokollar taqsimoti interaktiv grafiklari.
    *   Tizim holati ko'rsatkichlari (CPU, RAM, tarmoq yuklamasi).
2.  **Live Stream (Real-vaqt Monitoringi):**
    *   WebSocket orqali real-vaqt rejimida tarmoq paketlarini tahlil qilish va vizualizatsiya.
    *   Xavfsizlik tahdidlari (Threat Feed) va faol ulanishlar ro'yxati.
3.  **Device Monitor (Qurilmalar Nazorati):**
    *   Orqa fonda har 5 soniyada qurilmalarni ICMP ping orqali avtomatik tekshirish va holatini yangilash (Online/Offline).
4.  **Printer Operator Panel:**
    *   Ofis printerlari holatini monitoring qilish (Toner darajasi, jami chop etilgan sahifalar).
    *   Chop etish navbatlarini boshqarish (Qayta yuborish, bekor qilish/o'chirish).
5.  **Settings (Sozlamalar):**
    *   Tizim parametrlari, vaqt mintaqasi va til sozlamalari (O'zbek, Rus, Ingliz tillarida).
    *   Ma'lumotlar bazasini tozalash va zaxira nusxa olish (backup).

---

## 🛠️ Loyihani Ishga Tushirish / Installation & Setup

### 1. Talablar / Prerequisites
*   Tizimda **Node.js** (v18+) va **npm** o'rnatilgan bo'lishi lozim.

### 2. Loyihani yuklash va tayyorlash
Loyiha papkasiga kiring:
```bash
cd NetGuard_A1L
```

### 3. Backend Sozlamalari
`backend` papkasiga o'ting va kutubxonalarni o'rnating:
```bash
cd backend
npm install
```

`.env` faylini yaratib, ma'lumotlar bazasi va server portini sozlang:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
```

Prisma yordamida ma'lumotlar bazasini yaratib, migratsiyani amalga oshiring:
```bash
npx prisma db push
```

### 4. Frontend Sozlamalari
Loyiha asosiy papkasiga qayting va frontend kutubxonalarini o'rnating:
```bash
cd ..
npm install
```

---

## 🏃‍♂️ Ishga tushirish / Running the Application

### 1. Backend Serverni ishga tushirish:
```bash
cd backend
npm start
```
*Backend muvaffaqiyatli ishga tushgach, http://localhost:3000 manzili va WebSocket oqimi faollashadi.*

### 2. Frontend (Vite) Serverni ishga tushirish:
Loyiha asosiy papkasida quyidagi buyruqni bering:
```bash
npm run dev
```
*Frontend http://localhost:5173 manzilida ishga tushadi.*

---

## 🔑 Standart Tizimga Kirish Ma'lumotlari / Default Credentials

*   **Email:** `admin@netguard.local`
*   **Parol:** `admin123`
