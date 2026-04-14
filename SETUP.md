# Project Setup & Execution Guide 🚀

This guide will help you run, test, and debug the Res-Q platform efficiently.

## 📋 Prerequisites
- **Node.js**: v20+ (Check with `node -v`)
- **Package Manager**: npm (v10+)
- **Environment**: Linux/WSL (as detected)

---

## 🚀 Quick Start Commands

### 1. Install Dependencies
If you haven't already:
```bash
npm install
```

### 2. Run Development Server
This is the main command for coding and testing. It features Hot Module Replacement (HMR).
```bash
npm run dev
```
> **URL**: [http://localhost:3000](http://localhost:3000)

### 3. Build & Test Production Mode
Use this to ensure your code works in a production environment before deployment.
```bash
npm run build && npm run start
```

---

## 🔍 Easy Debugging & Testing

### ✅ 1. Verify Environment Variables
If the map is blank or login fails, check your `.env` file first.
```bash
cat .env
```
Ensure these keys are present:
- `NEXT_PUBLIC_FIREBASE_...`
- `NEXT_PUBLIC_OPEN_MAPTILER_API_KEY`
- `NEXT_PUBLIC_OPEN_WEATHER_API_KEY`

### 🐞 2. Debugging Techniques
| Tool | What to check |
| :--- | :--- |
| **Browser Console (F12)** | Look for Firebase Auth errors (403/401) or MapTiler 401 (Invalid Key). |
| **Terminal (Logs)** | Check for Next.js compile errors or Server Action failures. |
| **Firebase Console** | Go to **Firestore Database** -> **Rules** and ensure they allow read/write during development. |

### 🧪 3. Simple Test Plan
1. **Login**: Go to `/login` and try to sign in.
2. **Incident Report**: Click on the map, select a type, and click "Submit".
3. **Admin Check**: If you have an admin account, go to `/admin` to see the dashboard.
4. **Traffic Radar**: Click on the "Flood" or "Typhoon" radar to verify the Leaflet overlays.

---

## 🐞 Troubleshooting Common Issues

### 1. `Cannot find module ... lightningcss.linux-x64-gnu.node`
This is a common error in WSL/Linux environments where the platform-specific CSS engine binary is missing. 
**Fix**: Run the following command in your terminal:
```bash
npm install lightningcss-linux-x64-gnu
```

### 2. `Command not found: .npm`
Ensure you are using `npm` (three letters) and not `.npm`.
**Correct**: `npm run dev`

---

## 🤖 AI/ML Features (In Progress)
Track the AI implementation roadmap in [ml.md](file:///var/www/html/rest_q_web/ml.md).
Current focus: **Traffic Impact Factor logic** in `RiskLevelPanel.tsx`.
