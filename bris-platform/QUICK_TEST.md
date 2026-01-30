# 🚀 BRIS Platform - Quick Test Guide

**For the impatient!** Follow these steps to test the complete system in **10 minutes**.

---

## ⚡ SUPER QUICK START

### 1. Install Everything (First Time Only)

```powershell
# Backend
cd backend
npm install

# ML Service  
cd ../ml-service
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install --legacy-peer-deps
```

---

### 2. Start All Services (4 Terminals)

**Terminal 1:**
```powershell
cd backend
npm run dev
```
Wait for: `Server ready on http://localhost:3000` ✅

**Terminal 2:**
```powershell
cd ml-service
uvicorn app.main:app --reload
```
Wait for: `Application startup complete` ✅

**Terminal 3:**
```powershell
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:5173/` ✅

**Terminal 4:** (Keep ready for demo)

---

### 3. Test the System (2 Minutes)

**Step 1:** Open browser → http://localhost:5173

**Step 2:** Login
- Email: `admin@bris.io`
- Password: `admin123`

**Step 3:** You should see Dashboard with charts ✅

**Step 4:** Open SDK Demo
- File → Open → `tracking-sdk/examples/exam-demo.html`

**Step 5:** Trigger Events
- **Switch tabs** (Alt+Tab) → See counter increase! ✅
- **Type in textarea** → See events sent ✅
- **Copy text** (Ctrl+C) → See copy counter ✅
- **Paste text** (Ctrl+V) → See alert! ✅
- **Click Submit** ✅

**Step 6:** Check Dashboard
- Switch back to dashboard tab
- Wait 5-10 seconds
- **Chart should update** with new risk score ✅
- Click **"Risk Monitor"** → See new update with "NEW" badge ✅
- Click **"Alerts"** → See alert created ✅

---

## ✅ SUCCESS CHECKLIST

If you see all these, it works:

- [x] Dashboard loads with 4 metric cards
- [x] "Live" badge is green and pulsing
- [x] Two charts visible (even if empty initially)
- [x] SDK demo loads with "BRIS Active" badge
- [x] Tab switch is detected (counter increases)
- [x] Copy/Paste triggers alerts
- [x] Dashboard chart updates with new data point
- [x] Risk Monitor shows update with "NEW" badge
- [x] Alerts page shows new alert

**ALL CHECKED? 🎉 SYSTEM WORKS PERFECTLY!**

---

## 🐛 Quick Fixes

**Backend won't start?**
```powershell
npm install --legacy-peer-deps
npm run dev
```

**Frontend errors?**
```powershell
npm install --legacy-peer-deps
npm run dev
```

**ML service issues?**
```powershell
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Port conflicts?**
- Backend: Change port in `.env`
- ML: Use `--port 8001`
- Frontend: Vite auto-assigns next port

---

## 📸 What Success Looks Like

### Dashboard:
```
┌─────────────────────────────────────┐
│  BRIS Dashboard          [Live] 🟢  │
├─────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 24   │ │ 156  │ │ 65.3 │ │  3   ││
│  │Users │ │Events│ │ Risk │ │Alerts││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                      │
│  📈 Risk Score Chart (updates!)      │
│  📊 Event Volume Chart               │
└─────────────────────────────────────┘
```

### SDK Demo:
```
┌─────────────────────────────────────┐
│  📝 Math Exam     [BRIS Active] 🟢  │
├─────────────────────────────────────┤
│  Question: Solve 2x + 5 = 15        │
│  [Textarea...]                      │
│                                      │
│  Tab Switches:  3  ←─ INCREASES!    │
│  Copy Events:   1                    │
│  Paste Events:  2  ←─ TRIGGERS ALERT│
│  Events Sent:  47                    │
│                                      │
│  ⚠️ Tab switch detected!            │
└─────────────────────────────────────┘
```

### Risk Monitor:
```
┌─────────────────────────────────────┐
│  Risk Monitor                        │
├─────────────────────────────────────┤
│  Total: 5  Critical: 1  High: 2     │
│                                      │
│  ┌────────────────────────────[NEW] │
│  │ 🔥 User 1001      Risk: 92      ││
│  │ Critical - Tab switches + paste ││
│  │ 5s ago                          ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 🎬 2-Minute Demo Script

1. **Show logged-in dashboard** (15s)
   - "Real-time behavioral intelligence"
   - Point to Live badge

2. **Open SDK demo** (15s)
   - "3-line integration"

3. **Switch tabs** (30s)
   - "Watch this..."
   - Switch away and back
   - "BOOM! Detected!"

4. **Show dashboard** (45s)
   - "Chart updates automatically"
   - " Risk score: 92"
   - "Alert created"

5. **Show Risk Monitor** (15s)
   - "Real-time feed"
   - "Explainable AI"

**Total: 2 minutes. Judges impressed!** 🏆

---

## 💡 Pro Tips

1. **Have everything running BEFORE demo**
2. **Keep terminals visible** (shows it's real)
3. **Zoom in browser** (Ctrl +) for visibility
4. **Practice tab-switching** beforehand
5. **Emphasize real-time** ("Watch... NOW!")

---

## 🚀 You're Ready!

**Next Steps:**
1. ✅ Complete this quick test
2. 📸 Take screenshots
3. 🎥 Record demo video
4. 📝 Read DEMO_SCRIPT.md for full pitch
5. 🏆 Win hackathon / Impress employer!

---

**Questions? Check `TESTING_COMPLETE.md` for detailed guide!**

*Quick Start Guide - 10 Minutes to Working Demo!*
