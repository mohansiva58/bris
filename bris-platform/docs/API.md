# 📡 BRIS Platform - API Documentation

**Base URL:** `http://localhost:3000/api`

---

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "minimum-8-characters",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Registration successful",
  "timestamp": "2026-01-29T..."
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Login successful"
}
```

### Get Profile
**GET** `/auth/me`  
🔒 **Requires:** Authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "status": "active",
    "last_login": "2026-01-29T..."
  }
}
```

---

## 📊 Event Ingestion

### Submit Behavior Events
**POST** `/events`

**Rate Limit:** 1000 requests/minute

**Request Body:**
```json
{
  "user_id": 1,
  "session_id": "session-abc-123",
  "events": [
    {
      "event_type": "click",
      "event_data": {
        "x": 450,
        "y": 320,
        "target": "BUTTON"
      },
      "timestamp": "2026-01-29T10:30:00.000Z"
    },
    {
      "event_type": "tab_switch",
      "event_data": {},
      "timestamp": "2026-01-29T10:30:05.000Z"
    },
    {
      "event_type": "paste",
      "event_data": {
        "length": 150
      },
      "device_fingerprint": "fp-xyz",
      "location": {
        "country": "India",
        "city": "Bangalore"
      }
    }
  ]
}
```

**Event Types:**
- `click` - Mouse click
- `scroll` - Page scroll
- `keypress` - Keyboard input
- `navigation` - Page navigation
- `tab_switch` - Tab/window switch
- `copy` - Copy operation
- `paste` - Paste operation
- `focus_change` - Focus lost/gained
- `mouse_move` - Mouse movement
- `page_load` - Page loaded
- `page_unload` - Page closed
- `form_submit` - Form submission

**Response:** `202 Accepted`
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

### Get User Events
**GET** `/events/:userId`  
🔒 **Requires:** Authentication (own events) or Admin role

**Query Parameters:**
- `limit` (default: 100)
- `offset` (default: 0)
- `session_id` (optional)
- `event_type` (optional)

**Example:** `/events/1?limit=50&session_id=session-abc-123&event_type=click`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "session_id": "session-abc-123",
      "event_type": "click",
      "event_data": {"x": 450, "y": 320},
      "timestamp": "2026-01-29T10:30:00.000Z",
      "device_fingerprint": "fp-xyz",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150
  }
}
```

---

## ⚠️ Risk Management

### Get User Risk Scores
**GET** `/risk/:userId`  
🔒 **Requires:** Authentication (own scores) or Admin/Analyst role

**Query Parameters:**
- `limit` (default: 50)
- `session_id` (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "session_id": "session-abc-123",
      "risk_score": 92.5,
      "confidence": 0.87,
      "anomaly_type": "high_risk_behavior",
      "features": {
        "click_frequency": 10,
        "tab_switch_count": 12,
        "copy_paste_events": 5,
        ...
      },
      "model_version": "mock-v1.0.0",
      "explanation": "Excessive tab switching (12 times) | Multiple copy-paste events (5 times)",
      "timestamp": "2026-01-29T10:35:00.000Z"
    }
  ]
}
```

### Get Alerts
**GET** `/risk/alerts/list`  
🔒 **Requires:** Admin or Analyst role

**Query Parameters:**
- `limit` (default: 100)
- `status` (optional: open, investigating, resolved, dismissed)
- `severity` (optional: low, medium, high, critical)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "risk_score_id": 1,
      "severity": "high",
      "status": "open",
      "title": "High Risk Detected: Score 92",
      "description": "Suspicious behavior pattern detected",
      "risk_score": 92.5,
      "explanation": "Excessive tab switching...",
      "created_at": "2026-01-29T10:35:00.000Z"
    }
  ]
}
```

### Update Alert Status
**PATCH** `/risk/alerts/:id/status`  
🔒 **Requires:** Admin or Analyst role

**Request Body:**
```json
{
  "status": "investigating",
  "resolution_notes": "Reviewing user activity history"
}
```

**Valid Statuses:** `open`, `investigating`, `resolved`, `dismissed`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "investigating",
    "resolution_notes": "...",
    "updated_at": "2026-01-29T11:00:00.000Z"
  },
  "message": "Alert updated successfully"
}
```

### Get Dashboard Metrics
**GET** `/risk/dashboard/metrics`  
🔒 **Requires:** Admin or Analyst role

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "active_users": 15,
    "total_events_today": 1250,
    "average_risk_score": 35.5,
    "high_risk_alerts": 3,
    "critical_alerts": 1,
    "system_health": "healthy"
  }
}
```

---

## 👥 User Management

### Get All Users
**GET** `/users`  
🔒 **Requires:** Admin role

**Query Parameters:**
- `limit` (default: 100)
- `offset` (default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "status": "active",
      "created_at": "2026-01-20T...",
      "last_login": "2026-01-29T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 150,
    "total_pages": 2
  }
}
```

### Update User Status
**PATCH** `/users/:id/status`  
🔒 **Requires:** Admin role

**Request Body:**
```json
{
  "status": "locked"
}
```

**Valid Statuses:** `active`, `inactive`, `locked`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "status": "locked"
  },
  "message": "User status updated successfully"
}
```

---

## 🔌 WebSocket Events

**Connect:** `ws://localhost:3000`

### Client → Server Events

#### Join Dashboard
```javascript
socket.emit('join-dashboard');
```

#### Join User Room
```javascript
socket.emit('join-user-room', userId);
```

### Server → Client Events

#### Risk Update
```javascript
socket.on('risk_update', (data) => {
  console.log(data);
  // {
  //   type: 'risk_update',
  //   data: {
  //     user_id: 1,
  //     session_id: 'session-abc',
  //     risk_score: 92.5,
  //     severity: 'high',
  //     explanation: '...'
  //   },
  //   timestamp: '2026-01-29T...'
  // }
});
```

#### New Alert
```javascript
socket.on('new_alert', (data) => {
  // {
  //   type: 'alert',
  //   data: {
  //     id: 1,
  //     user_id: 1,
  //     severity: 'high',
  //     title: '...',
  //     risk_score: 92.5
  //   },
  //   timestamp: '...'
  // }
});
```

#### User Activity
```javascript
socket.on('user_activity', (data) => {
  // {
  //   type: 'user_activity',
  //   data: {
  //     active_users: 15,
  //     high_risk_users: 3,
  //     alerts_count: 5
  //   }
  // }
});
```

---

## 🤖 ML Service

**Base URL:** `http://localhost:8000`

### Predict Risk Score
**POST** `/predict`

**Request Body:**
```json
{
  "user_id": 1,
  "session_id": "session-abc",
  "features": {
    "click_frequency": 10.5,
    "scroll_velocity": 250.0,
    "typing_speed": 65.0,
    "dwell_time": 45.0,
    "tab_switch_count": 12,
    "copy_paste_events": 5,
    "navigation_speed": 2.5,
    "mouse_trajectory_entropy": 0.65,
    "keystroke_dynamics": [65.0],
    "session_duration": 15.0,
    "time_of_day": 14,
    "day_of_week": 3,
    "device_change": false,
    "location_anomaly": false,
    "event_count": 150,
    "unique_event_types": 6,
    "error_rate": 0.02
  }
}
```

**Response:** `200 OK`
```json
{
  "risk_score": 92.5,
  "confidence": 0.87,
  "anomaly_type": "high_risk_behavior",
  "model_version": "mock-v1.0.0",
  "explanation": "Excessive tab switching (12 times) | Multiple copy-paste events (5 times)",
  "processing_time_ms": 45.2
}
```

### Generate Explanation
**POST** `/explain`

**Request Body:**
```json
{
  "user_id": 1,
  "risk_score": 92.5,
  "anomaly_type": "high_risk_behavior",
  "features": { ... }
}
```

**Response:** `200 OK`
```json
{
  "explanation": "⚠️ **HIGH RISK**: Score of 92.5/100 shows concerning behavioral patterns...",
  "severity": "high",
  "contributing_factors": [
    "Tab switched 12 times (expected: 0-2)",
    "Copy-paste actions detected (5 times)",
    "Unusually fast typing (150 chars/min)"
  ],
  "generated_at": "2026-01-29T..."
}
```

---

## 📋 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2026-01-29T..."
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async processing) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 🔒 Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Auth endpoints | 5 requests / 15 min |
| Event ingestion | 1000 requests / min |
| General API | 100 requests / min |

---

## 💡 Example: Complete Flow

```javascript
// 1. Register
const registerRes = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo@example.com',
    password: 'demo12345',
    full_name: 'Demo User'
  })
});
const { data } = await registerRes.json();
const token = data.accessToken;

// 2. Send behavior events
await fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: data.user.id,
    session_id: 'demo-session-1',
    events: [
      { event_type: 'tab_switch', event_data: {} },
      { event_type: 'copy', event_data: {} },
      { event_type: 'paste', event_data: {} }
    ]
  })
});

// Wait 5-10 seconds for processing...

// 3. Check risk score
const riskRes = await fetch(`http://localhost:3000/api/risk/${data.user.id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const riskData = await riskRes.json();
console.log('Risk Score:', riskData.data[0].risk_score);
```

---

**📚 For more examples, see the demo HTML file and testing guide!**
