# SnapLink — Modern URL Shortener & Real-Time Analytics

A full-stack URL shortener built with Node.js/Express, React, and a modern design system.

## 🚀 Features

- **⚡ Fast Shortening**: Instantly shortens any URL with auto-prefixing for `https://` if omitted.
- **🏷️ Custom Aliases**: Set custom readable slugs (e.g. `snap.link/my-project`).
- **📱 QR Code Generator & Downloader**: 1-click generation of high-resolution QR codes with instant PNG download.
- **📊 Real-Time Analytics**: Live click tracking, access timestamps, and KPI cards.
- **🛡️ Resilient Dual-Storage**:
  - Connects to **MongoDB Atlas** when credentials are configured.
  - Automatically activates **Resilient Local File Storage** (`data/urls.json`) if MongoDB credentials are placeholder (`<db_password>`) or offline, ensuring the application never crashes!
- **⏸️ Pause & Resume Links**: Toggle active status with instant HTTP 403 styled holding pages.
- **🎨 State-of-the-Art UI/UX**:
  - Google Fonts (Plus Jakarta Sans)
  - Glassmorphic dark and light themes with instant persistence
  - Animated toast notifications
  - Search, filter, and sorting
  - 📥 **Export to CSV** for link performance reports

---

## 🛠️ How to Run Locally

### 1. Start the Backend Server (Port 5000)
```powershell
cd backened
node index.js
```
The backend will launch at `http://localhost:5000`.

### 2. Start the Frontend Application (Port 5173)
```powershell
cd frontened
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🗄️ MongoDB Setup (Optional)
If you want to use MongoDB Atlas instead of the resilient local storage:
1. Open `backened/.env`.
2. Replace `<db_password>` in `MONGO_URI` with your actual MongoDB Atlas database password.
3. Restart the backend server.
