# 🚀 BRIS Platform - Testing Guide

## Complete End-to-End Test (15-20 minutes)

Follow these steps to see the **entire system working together**.

---

## ✅ STEP 1: Start Infrastructure (5 minutes)

### 1.1 Navigate to Project
```powershell
cd c:\Users\sujay\Desktop\prajwalan\bris-platform
```

### 1.2 Copy Environment File
```powershell
Copy-Item .env.example -Destination .env
```

### 1.3 Start Docker Services
```powershell
docker-compose up -d postgres redis n8n
```

### 1.4 Wait for Services
```powershell
# Wait 30 seconds for database initialization
Start-Sleep -Seconds 30

# Check if services are healthy
docker-compose ps
```

**Expected Output:**
```
NAME                STATUS              PORTS
bris-postgres       Up (healthy)        0.0.0.0:5432->5432/tcp
bris-redis          Up (healthy)        0.0.0.0:6379->6379/tcp
bris-n8n            Up                  0.0.0.0:5678->5678/tcp
```

---

## ✅ STEP 2: Start Backend (3 minutes)

### 2.1 Navigate to Backend
```powershell
cd backend
```

### 2.2 Copy Environment File
```powershell
Copy-Item .env.example -Destination .env
```

### 2.3 Install Dependencies (First Time Only)
```powershell
npm install
```
**Note:** This will take 2-3 minutes. Grab a coffee! ☕

### 2.4 Start Backend Server
```powershell
npm run dev
```

**Expected Output:**
```
🚀 BRIS Backend listening on http://0.0.0.0:3000
📊 Environment: development
🔒 CORS enabled for: http://localhost:5173
```

**✅ Test:** Open http://localhost:3000/health in browser
Should see:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "uptime": 12.5,
    "environment": "development"
  }
}
```

**Keep this terminal open!**

---

## ✅ STEP 3: Start ML Service (2 minutes)

### 3.1 Open New Terminal
```powershell
cd c:\Users\sujay\Desktop\prajwalan\bris-platform\ml-service
```

### 3.2 Copy Environment File
```powershell
Copy-Item .env.example -Destination .env
```

### 3.3 Install Python Dependencies (First Time Only)
```powershell
pip install -r requirements.txt
```

### 3.4 Start ML Service
```powershell
uvicorn app.main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**✅ Test:** Open http://localhost:8000 in browser
Should see:
```json
{
  "service": "BRIS ML Service",
  "version": "1.0.0",
  "status": "running",
  "endpoints": { ... }
}
```

**✅ Test API Docs:** Open http://localhost:8000/docs
You should see interactive Swagger UI!

**Keep this terminal open!**

---

## ✅ STEP 4: Test with Demo Page (5 minutes)

### 4.1 Open Demo Page
Open `demo-exam.html` in your browser:
```powershell
# Open with default browser
start c:\Users\sujay\Desktop\prajwalan\bris-platform\demo-exam.html
```

### 4.2 Normal Behavior Test
1. Type something in the answer boxes
2. Watch the "Activity Monitor" section
3. Events are sent every 5 seconds
4. Check backend terminal - you should see:
```
📝 Events queued for processing
✅ Event batch processed successfully
```

### 4.3 Cheating Simulation Test
1. Click the **"🔥 Simulate Cheating Behavior"** button
2. Watch what happens:
   - Tab Switch count jumps to 12
   - Copy/Paste events increase
   - Alert shows "Suspicious pattern sent to BRIS!"
3. Within 5 seconds, check backend logs:
```
⚠️ High risk alert created
Risk Score: 92/100
User: 1
```

**4.4 Open Backend Logs in Terminal 1**
You should see something like:
```
INFO: Processing 15 events
INFO: Risk prediction: User 1, Risk 92.5, Time 45.2ms
INFO: High risk alert created, alertId: 1, userId: 1, score: 92.5
```

---

## ✅ STEP 5: Test with API Calls (Optional, 5 minutes)

Use Postman, Thunder Client, or curl:

### 5.1 Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "test@example.com",
      "full_name": "Test User",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Registration successful"
}
```

**Copy the `accessToken` for next steps!**

### 5.2 Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 5.3 Test Profile (Authenticated)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5.4 Test Event Ingestion
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "session_id": "test-session-123",
    "events": [
      {
        "event_type": "tab_switch",
        "event_data": {}
      },
      {
        "event_type": "copy",
        "event_data": {}
      },
      {
        "event_type": "paste",
        "event_data": {}
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "batch_id": "uuid-here",
    "queued_events": 3
  },
  "message": "Events accepted for processing"
}
```

### 5.5 Check Risk Score
```bash
curl http://localhost:3000/api/risk/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**You should see risk scores calculated from your events!**

### 5.6 Test ML Service Directly
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "session_id": "test",
    "features": {
      "click_frequency": 10,
      "scroll_velocity": 5,
      "typing_speed": 60,
      "dwell_time": 30,
      "tab_switch_count": 15,
      "copy_paste_events": 5,
      "navigation_speed": 2,
      "mouse_trajectory_entropy": 0.5,
      "keystroke_dynamics": [60],
      "session_duration": 10,
      "time_of_day": 14,
      "day_of_week": 3,
      "device_change": false,
      "location_anomaly": false,
      "event_count": 100,
      "unique_event_types": 5,
      "error_rate": 0
    }
  }'
```

**Expected Response:**
```json
{
  "risk_score": 85.0,
  "confidence": 0.85,
  "anomaly_type": "high_risk_behavior",
  "model_version": "mock-v1.0.0",
  "explanation": "Excessive tab switching (15 times) | Multiple copy-paste events (5 times)",
  "processing_time_ms": 2.5
}
```

**Notice how the mock ML responds realistically to tab switches and copy-paste!**

---

## ✅ STEP 6: Check n8n (Optional)

1. Open http://localhost:5678
2. Login: `admin` / `admin123`
3. Create a webhook workflow later

---

## 🎯 SUCCESS CRITERIA

You've successfully tested BRIS if:

✅ Backend health check returns "healthy"  
✅ ML service /docs shows Swagger UI  
✅ Demo page tracks events and shows stats  
✅ "Simulate Cheating" triggers high risk score  
✅ Backend logs show event processing messages  
✅ API endpoints return proper JSON responses  
✅ ML service calculates risk scores correctly  

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot connect to database"
**Solution:**
```powershell
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Problem: "Redis connection failed"
**Solution:**
```powershell
docker-compose restart redis
```

### Problem: "Port 3000 already in use"
**Solution:**
```powershell
# Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change PORT in backend/.env
```

### Problem: "Module not found" errors
**Solution:**
```powershell
# Backend
cd backend
rm -r node_modules
npm install

# ML Service
cd ml-service
pip install -r requirements.txt --force-reinstall
```

### Problem: Demo page "Backend connection error"
**Solution:**
1. Check if backend is running on port 3000
2. Check browser console for CORS errors
3. Ensure backend .env has `CORS_ORIGINS=*` for testing

### Problem: Events not processing
**Solution:**
```powershell
# Check Redis is running
docker-compose ps redis

# Check backend logs for queue errors
# Restart backend
```

---

## 📊 WHAT YOU SHOULD SEE

### Backend Terminal:
```
[INFO] 🚀 BRIS Backend listening on http://0.0.0.0:3000
[INFO] Redis client initialized
[INFO] WebSocket server initialized
[INFO] Queue service initialized
[DEBUG] Processing event batch: batch-id-xyz
[INFO] Processing 12 events
[INFO] Prediction completed: User 1, Risk 92.0, Time 50ms
[INFO] High risk alert created, alertId: 1, score: 92
[DEBUG] Risk update emitted
```

### ML Service Terminal:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     127.0.0.1:52000 - "POST /predict HTTP/1.1" 200 OK
```

### Demo Page:
- Tab Switches count increasing
- Events Sent counter updating every 5 seconds
- Success/Warning alerts appearing
- Risk warnings for suspicious behavior

---

## 🎉 NEXT STEPS

Once everything is working:

1. **Build the Frontend** (see QUICKSTART.md)
2. **Create n8n workflows** for automation
3. **Add more demo scenarios** (fraud, bots)
4. **Polish the UI/UX**
5. **Prepare presentation**

---

## 📞 NEED HELP?

Check these files:
- `README.md` - Project overview
- `PROJECT_STATUS.md` - What's built
- `QUICKSTART.md` - Implementation guide
- `IMPLEMENTATION_PROGRESS.md` - File checklist

**You've got a working behavioral risk intelligence system! 🚀**
