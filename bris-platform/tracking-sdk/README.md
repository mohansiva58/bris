# 🔍 BRIS SDK

**Behavioral Risk Intelligence System - Client SDK**

Lightweight JavaScript SDK for capturing and analyzing user behavior in real-time. Designed for exam proctoring, fraud detection, and security monitoring.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/bris-platform/sdk)
[![Size](https://img.shields.io/badge/size-<15KB-green.svg)](./dist/bris-sdk.js)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## ✨ Features

- **🚀 Zero Dependencies** - Pure JavaScript, no external libraries
- **📦 Lightweight** - <15KB minified
- **🔒 Privacy-Focused** - NO PII, keystrokes, or form values captured
- **⚡ Real-Time** - HTTP transport with batch optimization
- **🎯 Smart Tracking** - Mouse, keyboard,scroll, visibility, forms
- **🔄 Auto-Reconnect** - Resilient network handling
- **📊 Tab Switch Detection** - Critical for exam proctoring
- **🌐 Universal** - Works on any website

---

## 📦 Installation

### Option 1: Direct Include (CDN)
```html
<script src="https://cdn.bris.io/v1/bris-sdk.min.js"></script>
```

### Option 2: Self-Hosted
```html
<script src="/path/to/bris-sdk.js"></script>
```

### Option 3: NPM (Coming Soon)
```bash
npm install @bris/sdk
```

---

## 🚀 Quick Start

### Basic Integration (3 Lines of Code)

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1> Hello World</h1>

  <!-- 1. Include SDK -->
  <script src="bris-sdk.js"></script>
  
  <!-- 2. Initialize -->
  <script>
    BRIS.init({
      apiKey: 'your-api-key',
      apiEndpoint: 'https://api.bris.io/events',
      userId: 'user_123'
    });
  </script>
</body>
</html>
```

**That's it!** BRIS is now tracking behavioral events.

---

## ⚙️ Configuration

### Full Configuration Example

```javascript
BRIS.init({
  // Required
  apiKey: 'pk_live_abc123',                    // Your BRIS API key
  apiEndpoint: 'https://api.bris.io/events',  // Events endpoint
  
  // Optional
  userId: 'user_12345',                         // User identifier
  sessionId: 'session_abc',                     // Session identifier (auto-generated if not provided)
  
  // Event Capture Settings
  capture: {
    mouse: true,          // Mouse movements, clicks
    keyboard: true,       // Keyboard timing (NOT content)
    scroll: true,         // Scroll behavior
    visibility: true,     // Tab switches, window blur/focus
    navigation: true,     // Page loads, navigation
    forms: true           // Form interactions (NOT values)
  },
  
  // Performance Settings
  batchInterval: 3000,    // Send events every 3 seconds
  maxBatchSize: 50,       // Max events per batch
  throttleInterval: 500,  // Throttle mouse/scroll to 500ms
  
  // Debugging
  debug: false            // Enable console logging
});
```

---

## 📊 Events Captured

### Mouse Events
- `mouse_move` - Throttled mouse movements with position
- `mouse_click` - Click events with coordinates and button
- `mouse_dblclick` - Double-click events

### Keyboard Events
- `keyboard_down` - Key press timing and modifiers
- `clipboard_copy` - Copy operations detected
- `clipboard_paste` - Paste operations detected
- `clipboard_cut` - Cut operations detected

**Note:** Actual keystroke content is NEVER captured (privacy-first design)

### Visibility Events (Critical for Exam Proctoring!)
- `tab_hidden` - User switched away from tab
- `tab_visible` - User returned to tab (includes away time)
- `window_blur` - Window lost focus
- `window_focus` - Window gained focus

### Scroll Events
- `scroll` - Scroll position and depth percentage

### Navigation Events
- `page_load` - Page loaded
- `page_unload` - User leaving page

### Form Events
- `form_focus` - Field received focus
- `form_blur` - Field lost focus
- `form_submit` - Form submitted

**Note:** Form field VALUES are NEVER captured

---

## 🎯 API Reference

### `BRIS.init(config)`
Initialize the SDK.

```javascript
BRIS.init({
  apiKey: 'pk_test_123',
  apiEndpoint: 'http://localhost:3000/api/events'
});
```

**Returns:** `BRIS` object (chainable)

---

### `BRIS.track(eventType, eventData)`
Manually track custom events.

```javascript
BRIS.track('exam_submit', {
  question_id: 5,
  time_spent: 120,
  confidence: 'high'
});
```

**Parameters:**
- `eventType` (string) - Event name
- `eventData` (object) - Event metadata

**Returns:** `BRIS` object (chainable)

---

### `BRIS.getSession()`
Get current session information.

```javascript
const session = BRIS.getSession();
console.log(session);
// {
//   session_id: "session_abc123",
//   user_id: "user_456",
//   device_fingerprint: "fp_xyz789",
//   start_time: 1706543210000,
//   url: "https://example.com"
// }
```

**Returns:** Session object

---

### `BRIS.destroy()`
Stop tracking and cleanup.

```javascript
BRIS.destroy();
```

**Returns:** `BRIS` object

---

## 🏗️ Use Cases

### 1. Online Exam Proctoring

```html
<script>
  BRIS.init({
    apiKey: 'pk_exam_abc123',
    apiEndpoint: 'https://api.school.edu/exam/events',
    userId: studentId,
    sessionId: examId,
    
    // Focus on critical metrics
    capture: {
      visibility: true,   // Tab switching = cheating
      keyboard: true,     // Typing patterns
      mouse: true,        // Behavior patterns
      clipboard: true,    // Copy-paste detection
      scroll: false,      // Not needed for exams
      forms: true         // Answer fields
    },
    
    debug: false
  });

  // Track exam-specific events
  function submitAnswer(questionId, answer) {
    BRIS.track('exam_answer_submit', {
      question_id: questionId,
      answer_length: answer.length,
      time_spent: getTimeSpent()
    });
  }
</script>
```

---

### 2. E-Commerce Fraud Detection

```javascript
BRIS.init({
  apiKey: 'pk_live_xyz789',
  apiEndpoint: 'https://api.mystore.com/fraud/events',
  userId: customerId,
  
  capture: {
    mouse: true,        // Bot detection
    keyboard: true,     // Typing patterns
    navigation: true,   // Journey tracking
    forms: true         // Checkout behavior
  }
});

// Track  checkout events
document.getElementById('checkoutBtn').addEventListener('click', () => {
  BRIS.track('checkout_initiated', {
    cart_value: getCartValue(),
    items_count: getItemsCount()
  });
});
```

---

### 3. Security Monitoring

```javascript
BRIS.init({
  apiKey: 'pk_security_456',
  apiEndpoint: 'https://api.company.com/security/events',
  userId: employeeId,
  
  capture: {
    visibility: true,   // Screen sharing detection
    clipboard: true,    // Data exfiltration
    navigation: true    // Access patterns
  }
});
```

---

## 🔒 Privacy & Compliance

### What BRIS DOES NOT Capture

❌ **Keystroke Content** - Only timing and metadata  
❌ **Form Field Values** - Only interaction events  
❌ **Screenshots** - Never captured  
❌ **Personal Information** - Unless you explicitly send it  
❌ **Passwords** - Never, ever  

### What BRIS DOES Capture

✅ Mouse positions and clicks  
✅ Keyboard timing (intervals, not characters)  
✅ Tab visibility changes  
✅ Scroll positions  
✅ Form field focus/blur (not values)  
✅ Page navigation  

### GDPR & Privacy Compliance

- All tracking is **opt-in** (you control initialization)
- Users should be **notified** of behavioral tracking
- **No PII** is automatically captured
- Easy to **disable** specific trackers
- Full **data control** on your backend

**Recommended: Add a privacy notice to your application**

```html
<div class="privacy-notice">
  ⓘ This application uses behavioral analytics to ensure security.
  <a href="/privacy">Learn more</a>
</div>
```

---

## 🧪 Testing

### Local Testing

1. Start your backend:
```bash
cd backend
npm run dev
```

2. Open the example:
```bash
cd tracking-sdk/examples
# Open exam-demo.html in browser
```

3. Check browser console for events:
```javascript
// You should see:
[BRIS] SDK initialized
[BRIS] Flushed 15 events
```

4. Check backend logs for received events

---

## 📈 Performance

### Bundle Size
- **Unminified:** ~40KB
- **Minified:** ~15KB
- **Gzipped:** ~6KB

### Network Usage
- Events batched every 3 seconds (configurable)
- ~50 events per batch (configurable)
- Typical exam session: ~3-5MB data

### Browser Compatibility
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ⚠️ IE 11 (partial support, no modern features)

---

## 🐛 Troubleshooting

### SDK Not Initializing

**Problem:** No events being sent

**Solutions:**
```javascript
// 1. Check API key is correct
BRIS.init({ apiKey: 'pk_test_...' });

// 2. Enable debug mode
BRIS.init({ debug: true });

// 3. Check console for errors
// Open DevTools → Console
```

---

### Events Not Reaching Backend

**Problem:** Events sent but not received

**Solutions:**
1. Check CORS settings on backend
2. Verify `apiEndpoint` URL is correct
3. Check Network tab in DevTools
4. Ensure backend is running

```javascript
// Test with a simple endpoint
fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
});
```

---

### Too Many Events

**Problem:** Performance impact

**Solutions:**
```javascript
// Increase batch interval
BRIS.init({
  batchInterval: 5000,     // Send every 5 seconds
  maxBatchSize: 100,       // Larger batches
  throttleInterval: 1000   // Less frequent mouse/scroll
});

// Or disable specific trackers
BRIS.init({
  capture: {
    mouse: false,    // Disable mouse tracking
    scroll: false    // Disable scroll tracking
  }
});
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Replace `apiKey` with production key
- [ ] Update `apiEndpoint` to production URL
- [ ] Set `debug: false`
- [ ] Add privacy notice to UI
- [ ] Test tab switching detection
- [ ] Test event batching
- [ ] Verify backend is receiving events
- [ ] Check CORS configuration
- [ ] Load test with multiple concurrent users
- [ ] Monitor network usage
- [ ] Set up error tracking

---

## 📚 Examples

See `/examples` directory:
- `exam-demo.html` - Online exam proctoring
- `ecommerce-demo.html` - Fraud detection (coming soon)
- `dashboard-demo.html` - Admin monitoring (coming soon)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

## 🔗 Links

- **Website:** https://bris.io
- **Documentation:** https://docs.bris.io
- **API Reference:** https://docs.bris.io/api
- **GitHub:** https://github.com/bris-platform/sdk
- **Support:** support@bris.io

---

## 📮 Support

- **Email:** support@bris.io
- **GitHub Issues:** https://github.com/bris-platform/sdk/issues
- **Discord:** https://discord.gg/bris

---

**Made with ❤️ by the BRIS Team**

*Predictive security, not reactive.*
