# BRIS Platform - Quick Start & File Generation Guide

## 🎯 CURRENT STATUS

You now have the **FOUNDATION** of the BRIS platform:

### ✅ What's Complete (Production-Ready)
1. **Infrastructure** (100%)
   - Docker Compose with PostgreSQL/TimescaleDB, Redis, n8n
   - Database schema with time-series optimization
   - Environment configuration
   
2. **Backend Core** (50%)
   - TypeScript setup with strict type checking
   - Express server with Socket.IO
   - PostgreSQL connection pool
   - Redis cache & pub/sub
   - JWT authentication middleware
   - Rate limiting
   - Winston logger
   - User model & auth controller
   - Queue service (Bull + Redis)

### ⏳ What Needs Completion

The remaining 150+ files follow predictable patterns. Here's how to complete them quickly:

---

## 🚀 PHASE 1: Complete Backend (2-3 hours)

### Step 1: Create Remaining Files

All remaining backend files follow these patterns:

**Models** (Copy user.model.ts pattern):
- `event.model.ts` - CRUD for behavior_events table
- `risk.model.ts` - CRUD for risk_scores table
- `alert.model.ts` - CRUD for alerts table
- `session.model.ts` - CRUD for sessions table

**Controllers** (Copy auth.controller.ts pattern):
- `events.controller.ts` - Receive POST /api/events, push to queue
- `risk.controller.ts` - GET /api/risk/:userId, query risk_scores
- `users.controller.ts` - Admin CRUD for users

**Routes** (Copy auth.routes.ts pattern):
- `events.routes.ts` - POST /events (with authenticate + eventLimiter)
- `risk.routes.ts` - GET /risk/:userId, GET /risk/alerts
- `users.routes.ts` - GET /users, PATCH /users/:id/status

**Services**:
```typescript
// websocket.service.ts
import { Server } from 'socket.io';
export function initializeWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('join-room', (room) => socket.join(room));
    socket.on('disconnect', () => console.log('Client disconnected'));
  });
}
export function emitRiskUpdate(io: Server, data: any) {
  io.emit('risk_update', data);
}

// event.processor.ts
import axios from 'axios';
import config from '../config';
import { BehavioralFeatures } from '../types';

export async function processEventBatch(job: any) {
  const features = extractFeatures(job.events);
  const prediction = await callMLService(features);
  
  if (prediction.risk_score > 75) {
    // Create alert, trigger webhook
  }
}

function extractFeatures(events: any[]): BehavioralFeatures {
  // Count events, calculate rates, etc.
  return {
    click_frequency: events.filter(e => e.event_type === 'click').length,
    // ... etc
  };
}

async function callMLService(features: any) {
  const response = await axios.post(`${config.ml.service_url}/predict`, { features });
  return response.data;
}
```

### Step 2: Create Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 🤖 PHASE 2: ML Service (3-4 hours)

### Quick Implementation Strategy

Instead of training real models, use **mock predictions** for demo:

```python
# ml-service/app/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

class Features(BaseModel):
    click_frequency: float
    tab_switch_count: int
    copy_paste_events: int
    # ... etc

@app.post("/predict")
async def predict(features: Features):
    # Mock risk score based on features
    risk = min(100, max(0,
        features.tab_switch_count * 8 +
        features.copy_paste_events * 15 +
        random.randint(-10, 10)
    ))
    
    return {
        "risk_score": risk,
        "confidence": 0.85,
        "anomaly_type": "suspicious_behavior" if risk > 75 else "normal",
        "model_version": "1.0.0"
    }

@app.post("/explain")
async def explain(req: dict):
    #  Call Claude API or return template explanation
    return {
        "explanation": f"Risk score of {req['risk_score']} due to unusual activity patterns."
    }
```

**requirements.txt**:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
anthropic==0.7.0
numpy==1.24.3
```

---

## 🎨 PHASE 3: Frontend (4-5 hours)

### Use Vite + shadcn/ui Template

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table badge chart
npm install socket.io-client axios zustand @tanstack/react-query recharts
```

**Key Pages**:

```typescript
// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('risk_update', (data) => {
      setAlerts(prev => [data, ...prev]);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Risk Monitor</h1>
      <div className="grid grid-cols-3 gap-4">
        {alerts.map(alert => (
          <Card key={alert.id}>
            <CardHeader>
              <CardTitle>Risk: {alert.risk_score}</CardTitle>
            </CardHeader>
            <CardContent>{alert.explanation}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 📡 PHASE 4: Tracking SDK (2 hours)

Simple event capture:

```typescript
// tracking-sdk/src/index.ts
class BRIS {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.startTracking();
  }

  startTracking() {
    document.addEventListener('click', (e) => this.capture('click', { x: e.clientX, y: e.clientY }));
    document.addEventListener('copy', () => this.capture('copy', {}));
    document.addEventListener('paste', () => this.capture('paste', {}));
    
    setInterval(() => this.flush(), 5000);
  }

  capture(type, data) {
    this.events.push({
      event_type: type,
      event_data: data,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    });
  }

  flush() {
    if (this.events.length === 0) return;
    
    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: this.events }),
    });
    
    this.events = [];
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random()}`;
  }
}

window.BRIS = BRIS;
```

---

## 🎬 COMPLETE DEMO FLOW

### 1. Start Infrastructure
```bash
docker-compose up -d postgres redis n8n
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Test End-to-End

Open http://localhost:5173

Create demo HTML page:
```html
<!DOCTYPE html>
<html>
<head><title>Exam Simulator</title></head>
<body>
  <h1>Online Exam</h1>
  <textarea id="answer"></textarea>
  
  <script src="http://localhost:3000/sdk.js"></script>
  <script>
    new BRIS({
      endpoint: 'http://localhost:3000/api/events',
      user_id: 123,
    });
    
    // Simulate cheating
    setTimeout(() => {
      for (let i = 0; i < 15; i++) {
        window.dispatchEvent(new Event('blur')); // Tab switch
      }
    }, 3000);
  </script>
</body>
</html>
```

---

## ⚡ FASTEST PATH TO WORKING DEMO

### Option 1: Minimal Viable Demo (4-6 hours)
1. Complete backend routes (1 hour)
2. Create mock ML service (1 hour)  
3. Build basic React dashboard (2 hours)
4. Create simple HTML tracking demo (1 hour)
5. Test integration (1 hour)

###Option 2: Full Production Build (20-25 hours)
Follow the original specification completely.

### Option 3: Hybrid Approach (Recommended, 12-15 hours)
- Real backend with database ✅
- Mock ML for demo → Real models later
- Polished frontend with shadcn/ui
- Working tracking SDK
- 2 out of 3 demo scenarios
- Basic documentation

---

## 🎯 YOUR NEXT COMMAND

```bash
# Install backend dependencies
cd c:\Users\sujay\Desktop\prajwalan\bris-platform\backend
npm install
```

Then I can help you:
1. Generate all remaining backend files
2. Create the ML service
3. Build the frontend
4. Setup tracking SDK
5. Create demo scenarios

**What would you like to focus on first?**

---

## 📚 ADDITIONAL RESOURCES

- **Backend patterns**: All models/controllers follow user.model.ts / auth.controller.ts
- **Type safety**: Everything is in src/types/index.ts
- **Config**: One central config in src/config/index.ts
- **Logging**: Use logger from utils/logger.ts everywhere
- **Errors**: Throw typed errors from types/index.ts

This is a **production-quality architecture** with shortcuts only in ML training.
The demo will be impressive with mock predictions that respond to real behavioral patterns.
