# 🚨 QUICK FIX GUIDE - Installation Issues

## Current Status:

✅ Frontend: Running on port 5173  
⏳ Backend: Installing dependencies...  
⏳ ML Service: Installing Python packages...  

---

## What's Happening:

You're encountering installation issues because:
1. Backend dependencies (tsx) aren't installed → Running `npm install` now
2. Python/pip configuration issues → Installing essential packages

---

## SIMPLIFIED STARTUP (After installations complete)

### Backend (Terminal 1):
```powershell
cd c:\Users\sujay\Desktop\prajwalan\bris-platform\backend

# Wait for npm install to finish, then:
npm run dev

# If tsx error persists, try:
npx tsx watch src/server.ts
```

### ML Service (Terminal 2):
```powershell
cd c:\Users\sujay\Desktop\prajwalan\bris-platform\ml-service

# After pip install completes, run:
python -m uvicorn app.main:app --reload

# Or try:
uvicorn app.main:app --reload
```

### Frontend (Terminal 3):
```powershell
# Already running! ✅
```

---

## Alternative: Run Without ML Service (Simplified)

If ML service installation keeps failing, you can run without it temporarily:

The backend has mock ML responses, so it will still work!

**Just run:**
1. Backend → `npm run dev` (or `npx tsx watch src/server.ts`)
2. Frontend → Already running ✅

Dashboard will work, just won't have real ML predictions (will use defaults).

---

## Once Everything is Running:

1. Open http://localhost:5173
2. Login: admin@bris.io / admin123
3. You should see the dashboard!

---

## Check Installation Status:

**Backend:**
```powershell
# In backend directory, check if node_modules exists
ls node_modules

# If it exists, try running:
npx tsx watch src/server.ts
```

**ML Service:**
```powershell
# Check if uvicorn is installed:
python -m uvicorn --version

# If it works, run the server:
python -m uvicorn app.main:app --reload
```

---

## Next Steps:

1. **Wait** for current installations to complete (~2-3 minutes)
2. **Try** the startup commands above
3. **If backend works** → Great! Login and test
4. **If ML service fails** → Run without it temporarily
5. **Refresh browser** once services are running

---

I'll let you know when installations are complete!
