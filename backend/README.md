# Collage Story Backend API

Collage Story is an 18+ college-oriented social networking and dating platform for verified adult students across India.

This is the **MAIN Collage Story backend** built in **JavaScript ES Modules (Node.js + Express.js)** using **PostgreSQL, Prisma ORM, Redis, BullMQ, Multer, Sharp, and Nodemailer**.

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
| **File Uploads** | Multer (Memory storage, max 5MB, format filtering) |
| **Image Processing** | Sharp (WebP conversion, EXIF/GPS stripping, thumbnail & discovery variants) |
| **Email Service** | Nodemailer (Transactional HTML templates with BullMQ & direct fallback) |
| **Authentication** | Passport.js + JWT |
| **Password Hashing** | Argon2id |
| **Request Validation** | Zod |
| **Security & Headers** | Helmet, CORS, Express Rate Limit, Cookie Parser |
| **Documentation** | Swagger / OpenAPI 3.0 (`/api-docs`) |

---

## 📁 Project Architecture

```text
backend/
├── storage/                         # Private uploads & processed assets (auto-created)
│   └── private/
│       ├── documents/               # Isolated private identity verification documents
│       ├── photos/                  # Full-resolution optimized WebP profile photos
│       ├── thumbnails/              # 150x150 circular WebP thumbnails
│       └── discovery/               # 600x800 portrait WebP discovery cards
│
├── src/
│   ├── app.js                       # Express application assembly & middleware
│   ├── server.js                    # HTTP + Socket.IO server startup
│   ├── config/
│   │   ├── env.js                   # Validated environment configuration
│   │   ├── prisma.js                # Prisma Client singleton & DB health check
│   │   ├── redis.js                 # ioredis client & Redis health check
│   │   ├── passport.js              # Passport JWT & Argon2 Local strategies
│   │   ├── storage.js               # Centralized storage directory definitions
│   │   └── swagger.js               # OpenAPI 3.0 specification
│   │
│   ├── middleware/
│   │   ├── activeAccountGuard.js    # Strict platform gatekeeping (only approved accounts)
│   │   ├── authMiddleware.js        # JWT Bearer authentication guard
│   │   ├── errorHandler.js          # Centralized error handler (Zod, Multer, HTTP)
│   │   └── uploadMiddleware.js      # Multer file upload configuration (3 photos + 1 document)
│   │
│   ├── modules/
│   │   ├── registration/            # 6-step submission, status inquiry, resubmission
│   │   ├── auth/                    # Login (mobile/email), logout, password reset
│   │   ├── admin/                   # 72-hour review queue, claim, approve, reject, correction
│   │   ├── users/                   # Current user profile & mood updates
│   │   ├── profiles/                # Discovery feed and match requests
│   │   ├── matching/                # Mutual matches & GO stage transitions
│   │   ├── chat/                    # Real-time private messaging
│   │   ├── campus/                  # College-exclusive Campus Board
│   │   ├── games/                   # Interactive conversation games
│   │   ├── relationships/           # Active relationship status
│   │   ├── notifications/           # User notifications center
│   │   └── reports/                 # Moderation & safety reports
│   │
│   ├── services/
│   │   ├── collegeService.js        # College registry search & requests
│   │   ├── emailService.js          # Nodemailer transactional templates & BullMQ queue
│   │   ├── healthService.js         # PostgreSQL & Redis health evaluation
│   │   ├── imageService.js          # Sharp image processing & optimization
│   │   └── storageService.js        # Private file isolation & authorized streaming
│   │
│   └── utils/
│       ├── applicationUtils.js      # COL-YYYY-XXXXXX ID generator & 72h SLA tracker
│       ├── logger.js                # Structured console logger
│       └── response.js              # Standard API response helpers
│
├── prisma/
│   └── schema.prisma                # PostgreSQL models for applications, users, photos, documents
├── tests/
│   ├── health.test.js               # Health check automated tests
│   ├── registration.test.js         # Core registration tests
│   └── technologies.test.js         # Multer, Sharp, Nodemailer, and storage security tests
├── .env.example                     # Example environment variables
├── package.json
└── README.md
```

---

## 🔒 Security & Privacy Implementation

### 1. Multer File Uploads
- Configured with `multer.memoryStorage()`.
- Maximum 5MB per file limit strictly enforced.
- Allowed formats: JPEG, PNG, WebP (and PDF for documents).
- File count limits and field validation prevent path traversal and arbitrary file injection.

### 2. Sharp Image Processing
- Strips all personal EXIF metadata and GPS coordinate tags.
- Verifies image binaries with Sharp; non-image or corrupted files are immediately rejected.
- Converts profile photos into modern WebP format:
  - **Full Photo**: Max width 1200px (WebP quality 82)
  - **Discovery Variant**: 600x800px (WebP quality 80)
  - **Thumbnail**: 150x150px (WebP quality 75)
- Validates minimum resolution threshold (100x100px).

### 3. Nodemailer Transactional Emails
Includes 10 responsive Collage Story-branded HTML templates:
1. Registration Confirmation
2. Email OTP Verification
3. Application Submission Confirmation (72-Hour Review SLA)
4. Application Under Review Notification
5. Admin Approval Email (Account Activated)
6. Application Rejection Email (with mandatory reason)
7. Correction Request Email (with field list and admin instructions)
8. Resubmission Confirmation
9. Password Reset Email
10. Important Security Activity Notifications

*BullMQ background queue processes emails asynchronously when Redis is connected, with automatic direct-delivery fallback if Redis is unavailable.*

### 4. Private Document Isolation & Streaming
Identity documents and unapproved photos are stored outside public static directories in `storage/private/`. They can ONLY be accessed by authenticated administrators via:
```text
GET /api/v1/admin/documents/:subfolder/:filename
```

---

## 🚀 Getting Started

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Start PostgreSQL & Redis (Docker)
```bash
docker compose up -d
```

### 3. Run Migrations & Generate Prisma Client
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Server endpoints:
- **Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/v1/health`
- **Interactive Swagger Documentation**: `http://localhost:5000/api-docs`

---

## 🧪 Running Automated Tests

Run the complete 26-suite integration test suite:
```bash
npm test
```
