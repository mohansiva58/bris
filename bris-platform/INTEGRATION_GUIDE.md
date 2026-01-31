# BRIS Platform | Integration Guide 🚀
## Linking Behavioral Intelligence with Your Existing Tech Stack

This guide explains how to connect your existing platforms (React, Next.js, Nest, Angular) to the BRIS AI Forensic Engine.

---

### 1. The Core Concept: Behavioral Stitching
The BRIS SDK works by capturing "digital fingerprints" of behavior. By default, it uses anonymous IDs. To see **User Names** and **Emails** in your dashboard, you must perform "Behavioral Stitching" using the `identify` method.

### 2. React / Next.js Implementation
In modern Single Page Applications (SPAs), users log in without a page refresh. You should trigger the identity sync inside your Authentication Logic.

#### **A. Global Initialization**
Initialize the SDK once in your `_app.tsx` or `App.js`.

```javascript
// App.js
import { useEffect } from 'react';

function MyApp() {
  useEffect(() => {
    // Standard BRIS Init
    window.BRIS.init({
      apiKey: 'your-public-api-key',
      apiEndpoint: 'http://localhost:3000/api/events',
      debug: process.env.NODE_ENV === 'development'
    });
  }, []);

  return <Component />;
}
```

#### **B. The Identity Handshake**
Call this the moment your app receives user data from your login API.

```javascript
// Login.js
const onLoginSuccess = (user) => {
  // 1. Your existing app logic
  setAuth(user);
  
  // 2. 🔥 Link the behavior to the person
  window.BRIS.identify(user.id, {
    email: user.email,
    fullName: user.name,
    plan: user.subscriptionPlan // Optional: track user tiers
  });
};
```

---

### 3. How it appears in the Admin Dashboard
Once `BRIS.identify()` is called:
1.  **Event History**: Every click, scroll, and tab switch from that session is now "owned" by that user ID in the database.
2.  **AI Forensic Report**: When an admin opens the dashboard, the backend performs a join: `behavior_events.user_id -> users.id`.
3.  **Real Identity**: Instead of "Anonymous User #5", the panel will display:
    *   **User**: `John Doe`
    *   **Email**: `john@example.com`
    *   **AI Verdict**: *"Methodical researcher pattern - Matches John's typical 9 AM behavior profile."*

---

### 4. Integration with NestJS / Backend
If you use **NestJS**, you don't even need to wait for the frontend. You can emit identification events directly from your server when a login token is requested.

```typescript
// auth.service.ts (NestJS)
async login(user: User) {
  // ... generate JWT
  
  // Optional: Inform BRIS that a new secure session has started
  await this.brisClient.logIdentification({
    userId: user.id,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
}
```

### 5. Why this is powerful
By sending the `email` and `fullName` through the `identify` method, you enable the **AI Behavioral DNA** to build a long-term profile of that person. It learns that "John" always scrolls fast but types slowly, so if "John" suddenly starts typing like a robot, the system flags it instantly.

---

**Next Steps:**
- Try calling `window.BRIS.identify(123, { email: "test@user.com" })` in your browser console while the dashboard is open. You will see the Live Monitor update with the user details!
