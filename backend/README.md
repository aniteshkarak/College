# Collégé Backend API — Phase 1

Collégé is a modern, college-oriented social networking and dating platform for adults aged 18+ across India.

This is the **Phase 1 modular Express.js backend** providing core infrastructure, database models, caching, authentication architecture, and health-checking services.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Runtime & Language** | Node.js (ES Modules, Pure JavaScript) |
| **Framework** | Express.js |
| **Primary Database** | PostgreSQL 16 (via Docker Compose) |
| **ORM** | Prisma ORM |
| **Caching & Pub/Sub** | Redis 7 (via Docker Compose & ioredis) |
| **Real-time Engine** | Socket.IO |
| **Background Queue** | BullMQ |
| **Authentication** | Passport.js + JWT |
| **Password Hashing** | Argon2id |
| **Request Validation** | Zod |
| **Security** | Helmet, CORS |

---

## 📁 Modular Architecture

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.js           # Validated environment configuration
│   │   ├── prisma.js        # Prisma Client singleton & DB health check
│   │   ├── redis.js         # ioredis client & Redis health check
│   │   └── passport.js      # Passport JWT & Argon2 Local strategies
│   ├── modules/
│   │   ├── auth/            # Register, Login, Me endpoints (Zod + Argon2)
│   │   ├── users/           # User profile & mood updates
│   │   ├── profiles/        # Detailed profile attributes
│   │   ├── discovery/       # Discover feed with filters
│   │   ├── matching/        # Incoming likes, Accept/Reject, GO transitions
│   │   ├── chat/            # 1-on-1 private messaging (no video calls)
│   │   ├── campus/          # College-exclusive Campus Board
│   │   ├── games/           # 6 interactive conversation games
│   │   ├── relationships/   # Active relationship stages
│   │   ├── notifications/   # Push/system notifications
│   │   ├── reports/         # User safety & moderation reports
│   │   └── admin/           # Platform metrics & audit logs
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT Bearer authentication guard
│   │   └── errorHandler.js   # Centralized error handler
│   ├── services/
│   │   └── healthService.js  # PostgreSQL & Redis health evaluation
│   ├── utils/
│   │   ├── logger.js        # Structured console logger
│   │   └── response.js      # Standard API response helpers
│   ├── app.js               # Express application setup & route mounting
│   └── server.js            # HTTP Server & Socket.IO listener
├── prisma/
│   └── schema.prisma        # PostgreSQL database models
├── tests/
│   └── health.test.js       # Health check automated tests
├── .env.example             # Example environment variables
├── package.json             # ES Module dependencies & scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Start Infrastructure (PostgreSQL & Redis)
In the project root, launch the isolated development containers:
```bash
docker compose up -d
```
This starts:
- **PostgreSQL 16**: `127.0.0.1:5432` (`college_user`, `college_db`)
- **Redis 7**: `127.0.0.1:6379`

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Generate Prisma Client & Migrate Database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start at: `http://localhost:5000`

---

## 📡 Health Check API

### Endpoint: `GET /api/v1/health` or `GET /health`
Example Response:
```json
{
  "status": "UP",
  "timestamp": "2026-11-19T07:30:00.000Z",
  "uptimeSeconds": 120,
  "latencyMs": 4,
  "services": {
    "database": {
      "engine": "PostgreSQL",
      "status": "HEALTHY",
      "message": "PostgreSQL connection active"
    },
    "cache": {
      "engine": "Redis",
      "status": "HEALTHY",
      "message": "Redis connection active"
    }
  },
  "version": "1.0.0",
  "app": "Collégé Backend API"
}
```

---

## 🔒 Security Principles
- **₹0 Budget / Free Stack**: All infrastructure runs on local Docker containers.
- **Port Security**: PostgreSQL and Redis are bound strictly to `127.0.0.1` (never exposed publicly).
- **Password Hashing**: Uses modern **Argon2id** algorithm (memoryCost: 65536, timeCost: 3).
- **Age Enforcement**: Strictly requires 18+ verified via date of birth during registration.
- **No Video Calling**: Architecture respects user safety by focusing on text and audio notes.
