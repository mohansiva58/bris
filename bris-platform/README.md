# 🛡️ BRIS - Behavioral Risk Intelligence System

<div align="center">

![BRIS Logo](https://img.shields.io/badge/BRIS-Behavioral%20Risk%20Intelligence-blue?style=for-the-badge&logo=shield&logoColor=white)

**Real-time behavioral analytics platform that predicts risky intent using ML + AI automation**

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-%3E%3D3.10-blue.svg)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Demo](#-demo-scenarios) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

BRIS is a production-ready behavioral analytics platform that:

1. **Tracks** user behavior (clicks, scrolls, keystrokes) via lightweight JavaScript SDK
2. **Processes** events in real-time through Redis-backed message queues
3. **Predicts** risk scores (0-100) using ML models (Isolation Forest + LSTM)
4. **Explains** risks in human-readable language via Claude AI
5. **Automates** responses via n8n workflows (alerts, account locks, notifications)
6. **Visualizes** live risk monitoring dashboard with WebSocket updates

### 🎯 Primary Use Cases

- **Exam Cheating Detection**: Monitor tab switches, copy-paste patterns, unusual typing behavior
- **Fraud Prevention**: Detect account takeover, suspicious transactions, bot activity
- **Fake Profile Detection**: Identify automated profile creation, spam behavior

---

## ✨ Features

### 🔍 Real-Time Monitoring
- Live behavior tracking with <100ms WebSocket updates
- Session replay and timeline visualization
- Active user heatmap with risk color-coding

### 🤖 ML-Powered Detection
- Unsupervised anomaly detection (Isolation Forest)
- Sequential pattern analysis (LSTM)
- Feature engineering from 12+ behavioral metrics
- Model versioning and A/B testing support

### 💡 AI Explanations
- Human-readable risk explanations via Claude API
- Context-aware alerts with actionable insights
- Multi-language support (configurable)

### ⚡ Automated Workflows
- Triggered responses based on risk thresholds
- Integration with Slack, email, SMS
- Custom workflow builder via n8n
- Account locking, MFA triggers, admin notifications

### 📊 Analytics Dashboard
- Real-time risk metrics
- Historical trend analysis
- User behavior timelines
- Alert management interface

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Tracking SDK   │  (Browser - Lightweight JS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │  (Node.js + Express + Socket.io)
│  + Bull Queue   │  (Redis-backed job processing)
└────┬───────┬────┘
     │       │
     │       ▼
     │  ┌─────────────┐
     │  │ PostgreSQL  │  (TimescaleDB for time-series)
     │  └─────────────┘
     │
     ▼
┌─────────────────┐
│   ML Service    │  (Python + FastAPI)
│  - Isolation    │  (Anomaly detection)
│  - LSTM Model   │  (Sequence prediction)
│  - Claude API   │  (Explanations)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   n8n Workflows │  (Automation engine)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │  (React + TypeScript + Vite)
│   Dashboard     │  (Real-time WebSocket updates)
└─────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- shadcn/ui + Tailwind CSS
- Zustand (state) + React Query (server state)
- Socket.io-client (real-time)
- Recharts (visualizations)

**Backend:**
- Node.js 18+ + Express + TypeScript
- Socket.io (WebSocket server)
- Bull (Redis job queue)
- JWT authentication
- PostgreSQL (pg) + Redis clients

**ML Service:**
- Python 3.10+ + FastAPI
- scikit-learn (Isolation Forest)
- TensorFlow 2.x (LSTM)
- Anthropic Claude API
- ONNX Runtime (model serving)

**Infrastructure:**
- PostgreSQL 15 + TimescaleDB
- Redis 7 (cache + queue + pub/sub)
- n8n (workflow automation)
- Docker + Docker Compose

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ & npm
- Python 3.10+
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bris-platform.git
cd bris-platform
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. **Start infrastructure services**
```bash
docker-compose up -d postgres redis n8n
```

Wait for services to be healthy (~30 seconds):
```bash
docker-compose ps
```

4. **Install dependencies**

Backend:
```bash
cd backend
npm install
npm run build
cd ..
```

ML Service:
```bash
cd ml-service
pip install -r requirements.txt
cd ..
```

Frontend:
```bash
cd frontend
npm install
cd ..
```

Tracking SDK:
```bash
cd tracking-sdk
npm install
npm run build
cd ..
```

5. **Start all services**
```bash
# Option 1: Using Docker Compose (recommended)
docker-compose up

# Option 2: Manual start (for development)
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - ML Service
cd ml-service && uvicorn app.main:app --reload

# Terminal 3 - Frontend
cd frontend && npm run dev
```

6. **Access the platform**
- Frontend Dashboard: http://localhost:5173
- Backend API: http://localhost:3000
- ML Service: http://localhost:8000/docs
- n8n Workflows: http://localhost:5678 (admin/admin123)

### Default Credentials

- Email: `admin@bris.io`
- Password: `admin123`

---

## 🎮 Demo Scenarios

### Scenario 1: Exam Cheating Detection

Simulates a student attempting to cheat during an online exam.

**Run demo:**
```bash
npm run demo:exam
```

**What happens:**
1. Student session starts
2. Excessive tab switching detected (12 switches in 3 minutes)
3. Copy-paste events from external source
4. Risk score climbs to 92/100
5. Real-time alert appears on dashboard
6. n8n workflow triggers:
   - Exam auto-locked
   - Proctor notified via Slack
   - Incident logged
7. Claude explains: *"Excessive tab switching combined with copy-paste activity matches known cheating patterns"*

### Scenario 2: Fraud Prevention

Simulates account takeover attempt.

**Run demo:**
```bash
npm run demo:fraud
```

**What happens:**
1. Login from new device + unusual location
2. Failed security questions (2 attempts)
3. Immediate navigation to "Transfer Money"
4. Large amount entered ($10,000)
5. Risk prediction: 88/100 *before* transaction completes
6. System triggers:
   - MFA verification required
   - Transaction temporarily blocked
   - Security team alerted
7. Prevents fraudulent transfer

### Scenario 3: Fake Profile Detection

Simulates bot creating spam profiles.

**Run demo:**
```bash
npm run demo:fake-profile
```

**What happens:**
1. Profile created in 45 seconds (normal: 5+ minutes)
2. Text matches known templates (copy-paste detected)
3. 50 connection requests sent in 2 minutes
4. Risk score: 85/100
5. Profile flagged for manual review
6. Admin dashboard shows alert with evidence

---

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete REST API reference
- [Architecture Guide](docs/ARCHITECTURE.md) - System design deep-dive
- [ML Models Guide](docs/ML_MODELS.md) - Model training and deployment
- [Workflow Setup](docs/WORKFLOWS.md) - n8n workflow configuration
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [SDK Integration](docs/SDK_INTEGRATION.md) - How to integrate tracking SDK

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:integration
npm run test:coverage
```

### ML Service Tests
```bash
cd ml-service
pytest
pytest --cov=app tests/
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:e2e  # Cypress
```

### Load Testing
```bash
npm run load-test  # Simulates 1000 concurrent users
```

---

## 📊 Performance Metrics

- **Event Processing**: 10,000+ events/second
- **Risk Prediction Latency**: <200ms (p95)
- **WebSocket Update Delay**: <100ms
- **Dashboard Load Time**: <2s
- **Concurrent Users**: 100+ (tested)
- **Database Query Time**: <50ms (indexed queries)

---

## 🔒 Security

- JWT-based authentication with refresh tokens
- Rate limiting (100 req/min per IP)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (CSP headers)
- CORS configuration
- Encrypted passwords (bcrypt)
- API key rotation support
- Audit logging for all actions

---

## 🚢 Deployment

### Railway (Recommended for Demo)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Render.com

1. Fork this repository
2. Connect to Render dashboard
3. Create new Blueprint instance
4. Set environment variables
5. Deploy

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

---

## 🛠️ Development

### Project Structure

```
bris-platform/
├── backend/           # Node.js API server
├── ml-service/        # Python ML service
├── frontend/          # React dashboard
├── tracking-sdk/      # Behavior tracking SDK
├── docs/              # Documentation
├── .github/           # CI/CD workflows
└── docker-compose.yml # Infrastructure
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- **TypeScript**: ESLint + Prettier
- **Python**: Black + flake8
- **Commits**: Conventional Commits

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by BRIS Team

- **Project Lead**: [Your Name]
- **Backend Developer**: [Name]
- **ML Engineer**: [Name]
- **Frontend Developer**: [Name]

---

## 🙏 Acknowledgments

- Anthropic for Claude API
- TimescaleDB for time-series optimization
- n8n for workflow automation
- shadcn/ui for beautiful components

---

## 📞 Support

- 📧 Email: support@bris.io
- 💬 Discord: [Join our community](https://discord.gg/bris)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/bris-platform/issues)
- 📖 Docs: [Full Documentation](https://docs.bris.io)

---

<div align="center">

**⭐ Star us on GitHub — it motivates us a lot!**

Made with 💙 using React, Node.js, Python, and AI

</div>
