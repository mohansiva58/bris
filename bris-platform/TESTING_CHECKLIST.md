# ✅ BRIS Testing Checklist - Print & Follow!

---

## 🔧 INSTALLATION (First Time Only)

```powershell
□ cd backend && npm install
□ cd ml-service && pip install -r requirements.txt
□ cd frontend && npm install --legacy-peer-deps
```

---

## ▶️ STARTUP (Every Time)

### Terminal 1: Backend
```powershell
□ cd backend
□ npm run dev
□ Wait for: "Server ready on http://localhost:3000" ✅
```

### Terminal 2: ML Service
```powershell
□ cd ml-service
□ uvicorn app.main:app --reload
□ Wait for: "Application startup complete" ✅
```

### Terminal 3: Frontend
```powershell
□ cd frontend
□ npm run dev
□ Wait for: "Local: http://localhost:5173/" ✅
```

---

## 🧪 BASIC TESTS

```
□ Open http://localhost:3000/health → Should return {"status": "healthy"}
□ Open http://localhost:8000/health → Should return {"status": "healthy"}
□ Open http://localhost:5173 → Login page loads
```

---

## 🔐 LOGIN TEST

```
□ Email: admin@bris.io
□ Password: admin123
□ Click "Sign In"
□ Dashboard loads ✅
□ "Live" badge is green ✅
□ 4 metric cards visible ✅
□ 2 charts visible ✅
```

---

## 🎯 COMPLETE FLOW TEST

### 1. Open SDK Demo
```
□ Open: tracking-sdk/examples/exam-demo.html
□ "BRIS Active" badge visible ✅
□ Stats show all zeros ✅
```

### 2. Switch Tabs (CRITICAL!)
```
□ Press Alt+Tab (switch away)
□ Wait 2 seconds
□ Switch back
□ "Tab Switches" counter → 1 ✅
□ Alert appears ✅
```

### 3. Copy/Paste
```
□ Select text, Ctrl+C
□ "Copy Events" → 1 ✅
□ Click textarea, Ctrl+V
□ "Paste Events" → 1 ✅
□ Alert appears ✅
```

### 4. Submit
```
□ Type answer in textarea
□ Click "Submit Answer"
□ Success message ✅
□ Backend logs show "Processing events" ✅
```

### 5. Check Dashboard Updates
```
□ Switch to dashboard tab
□ Wait 10 seconds
□ "Events Today" increases ✅
□ Chart updates with new point ✅
□ "Average Risk Score" changes ✅
```

### 6. Check Risk Monitor
```
□ Click "Risk Monitor" tab
□ New update appears ✅
□ "NEW" badge visible ✅
□ Critical severity shown ✅
□ Explanation text present ✅
```

### 7. Check Alerts
```
□ Click "Alerts" tab
□ New alert in list ✅
□ Risk score shown (e.g., 92) ✅
□ Can click "Start Investigation" ✅
```

---

## ✅ SUCCESS CRITERIA

**ALL of these must be TRUE:**

- [ ] Backend started without errors
- [ ] ML service started without errors
- [ ] Frontend loads and shows charts
- [ ] Can login successfully
- [ ] Tab switch is detected (counter increases)
- [ ] Copy/paste events are captured
- [ ] Backend receives and processes events
- [ ] Dashboard updates in <10 seconds
- [ ] Chart shows new data point
- [ ] Risk Monitor shows update with "NEW" badge
- [ ] Alerts page shows new alert
- [ ] No console errors (F12)
- [ ] WebSocket shows "Connected"

**If ALL checked: 🎉 PERFECT! System works!**

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | `npm install --legacy-peer-deps` |
| Frontend errors | `npm install --legacy-peer-deps` |
| Port in use | Change port or kill process |
| No WebSocket | Restart backend and frontend |
| Events not sent | Check browser console |
| No chart update | Wait 10 seconds, check WebSocket |

---

## 📸 Screenshot Checklist

Take these for your portfolio:

- [ ] Dashboard with populated charts
- [ ] Risk Monitor with "NEW" badge
- [ ] Alerts page with alert
- [ ] SDK demo with stats
- [ ] Backend terminal showing events
- [ ] All 3 terminals running

---

## 🎬 Demo Prep Checklist

Before presenting:

- [ ] All 3 services running
- [ ] Logged into dashboard
- [ ] SDK demo page loaded
- [ ] Dashboard tab open
- [ ] Practiced tab-switching
- [ ] Know where "NEW" badge appears
- [ ] Backend terminal visible (optional)
- [ ] Browser zoomed in for visibility

---

## ⏱️ Time Estimates

- **First-time setup:** 30 minutes
- **Startup (after setup):** 3 minutes
- **Basic testing:** 5 minutes
- **Complete flow:** 10 minutes
- **Demo run:** 2-3 minutes

---

## 📞 Help Resources

1. **QUICK_TEST.md** - 10-minute guide
2. **TESTING_COMPLETE.md** - Full visual guide
3. **DEMO_SCRIPT.md** - Presentation script
4. **NEW_FEATURES.md** - Feature documentation

---

**Print this page and check off items as you go!** ✅

*One-Page Testing Checklist - v1.0*
