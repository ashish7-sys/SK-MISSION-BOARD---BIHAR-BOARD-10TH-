# SK MISSION BOARD — Bihar Board Class 10 Official App

An official, production-ready study application for Bihar State Examination Board (BSEB) Class 10 students featuring an ultra-smooth GPU WebGL Neon Light-Wave System, complete 6-subject curriculum architecture, PDF study materials reader, YouTube video lectures stream, and single-administrator control board.

---

## 🌟 Key Features

1. **GPU WebGL Neon Light-Wave System**:
   - High-fidelity GLSL fragment shader rendering smooth multi-color neon spectrum loops (green, cyan, electric blue, violet, purple, magenta, pink, orange, gold).
   - Interactive touch/tap light response with sharp neon edges and soft ambient bloom.

2. **Official Bihar Board Class 10 Curriculum (6 Subjects)**:
   - **हिन्दी** (Hindi - गोधूलि भाग 2 एवं वर्णिका भाग 2)
   - **English** (Panorama Part II & English Reader)
   - **गणित** (Mathematics - NCERT / BSEB)
   - **विज्ञान** (Science - Physics, Chemistry, Biology)
   - **सामाजिक विज्ञान** (Social Science - History, Political Science, Geography, Economics, Disaster Management)
   - **संस्कृत** (Sanskrit - पीयूषम् भाग 2)

3. **Production PDF System & HD Reader**:
   - Integrated document viewer modal with zoom in/out, print trigger, dark mode reading overlay, and direct download capabilities.

4. **Official YouTube Video Integration**:
   - Stream video lectures directly from official channel (`@skmissionboard`).

5. **Secure Single-Admin Control Board**:
   - PIN/Password authenticated admin panel (`Default PIN: 123456`).
   - Add/edit/delete PDFs, YouTube videos, announcements, and release versions.

6. **Continuous Android Release Architecture**:
   - Standardized `applicationId` (`com.skmissionboard.app`), permanent release keystore identity, and auto-incrementing `versionCode` for seamless OTA upgrades.

---

## 🚀 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run development server (Node.js Express + Vite)
npm run dev

# 3. Build for production
npm run build

# 4. Start production server
npm run start
```

---

## 🔒 Admin Panel Credentials

- **Admin Access**: Click on **"एडमिन पैनल"** in the top navigation bar.
- **Default PIN**: `123456` (Can be modified inside Admin Settings or StoreService).

---

## 📱 Codemagic CI/CD Build Setup

1. Connect your GitHub repository to Codemagic.
2. Select the `codemagic.yaml` workflow in Codemagic.
3. Configure the `sk_mission_board_keystore` in Codemagic environment secrets.
4. Trigger build for production Android `.apk` and `.aab` artifacts.
