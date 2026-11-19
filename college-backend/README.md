# Collégé – Backend Architecture (Zero-Database Local Storage Engine)

Collégé is an 18+ college-exclusive social discovery and dating platform designed for students and young adults across India.

This backend is engineered entirely in **JavaScript ES Modules (Node.js + Express.js)** with **zero external database dependencies** at this stage. It runs directly on Windows 11 without requiring PostgreSQL, MySQL, MongoDB, Redis, or Prisma installations.

---

## 1. Architectural Highlights

### 📁 Atomic File-Based JSON Persistence
- **No Database Required**: All entities (applications, users, review audits, and notifications) are stored in clean JSON files inside `college-backend/storage/`.
- **Atomic File Writing**: Files are written to temporary `.tmp` buffers first and swapped into place using OS-level atomic filesystem renames (`fs.promises.rename`).
- **Promise-Based Mutex Queue**: Per-file promise chains ensure that simultaneous requests never create race conditions or corrupted JSON files.
- **Journaled Approval Transactions**: Admin approval creates a journal snapshot (`storage/reviews/journal_<txId>.json`) before simultaneously creating an active user profile in `users.json` and updating the application in `applications.json`. If any step fails, the operation rolls back cleanly.

### 🛡️ Application Security & Data Protection
- **Argon2id Password Hashing**: State-of-the-art memory-hard password hashing for all applicants and administrators.
- **Image Binary Verification & EXIF Stripping**: Uses `sharp` to verify actual JPEG, PNG, or WebP magic bytes, strips device/GPS location metadata, and verifies resolution and file size constraints (max 5MB).
- **Private Document Isolation**: Identification documents (`identity_documents/`) and applicant photos (`photos/`) are stored outside public web directories. Only authorized administrators with verified JWTs can stream or view them via `/api/v1/admin/documents/:subfolder/:filename`.
- **JWT Authentication & RBAC**: Access tokens (15m expiry) and Refresh tokens (7d expiry) with role-based access control (`SUPER_ADMIN`, `VERIFICATION_ADMIN`, `STUDENT`).
- **Strict Platform Gatekeeping**: Applicants whose status is `PENDING_REVIEW`, `UNDER_REVIEW`, `NEEDS_CORRECTION`, or `REJECTED` are strictly blocked at the API level from accessing discovery, messaging, and profile routes.

### 📋 72-Hour Manual Verification Lifecycle
- Every application receives a human-readable identifier (`COL-YYYY-XXXXXX`) and a strict 72-hour review deadline timestamp.
- Overdue tracking highlights applications exceeding the 72-hour window in the admin metrics.
- 4 Admin Decision Actions:
  1. **Claim / Start Review** (`UNDER_REVIEW`)
  2. **Request Correction** (`NEEDS_CORRECTION` with selected fields and message)
  3. **Reject** (`REJECTED` with mandatory justification)
  4. **Approve** (`APPROVED` -> creates active student account)

---

## 2. Directory Structure

```text
college-backend/
├── storage/                         # Local JSON database & file stores (auto-created)
│   ├── applications/
│   │   └── applications.json        # Pending, under review, and completed applications
│   ├── users/
│   │   └── users.json               # Active approved students and seeded admins
│   ├── reviews/
│   │   └── review_audits.json       # Admin actions and audit trail
│   ├── notifications/
│   │   └── notifications.json       # Notifications dispatched to users
│   └── uploads/
│       ├── photos/                  # Stripped & processed applicant photos
│       └── identity_documents/      # Private college/government ID documents
│
├── src/
│   ├── app.js                       # Express application assembly & middleware
│   ├── server.js                    # HTTP + Socket.IO server startup
│   ├── config/
│   │   ├── environment.js           # Environment configuration
│   │   ├── storage.js               # Storage paths & directory initializers
│   │   ├── cors.js                  # Frontend origin CORS policy (localhost:5173)
│   │   └── swagger.js               # OpenAPI 3.0 specification definition
│   │
│   ├── middleware/
│   │   ├── authenticate.js          # JWT bearer / cookie token authentication guard
│   │   ├── authorizeAdmin.js        # Admin role enforcement
│   │   ├── uploadValidation.js      # Multer memory storage (3 photos + 1 ID document)
│   │   ├── rateLimiter.js           # IP rate limiting for registration & login
│   │   └── errorHandler.js          # Centralized error handler (Zod, Multer, HTTP)
│   │
│   ├── modules/
│   │   ├── registration/            # 6-step submission, status inquiry, resubmission
│   │   ├── auth/                    # Login (mobile/email/appId), logout, password reset
│   │   ├── admin/                   # Dashboard metrics, review queue, approval/rejection
│   │   ├── users/                   # Current user profile management
│   │   ├── profiles/                # Discovery feed and match requests (active users only)
│   │   ├── verification/            # Status checks for current applicant
│   │   ├── notifications/           # User notification center
│   │   └── chat/                    # Real-time Socket.IO chat and message history
│   │
│   ├── services/
│   │   ├── file.service.js          # Atomic JSON persistence & transaction repository
│   │   ├── image.service.js         # Sharp binary validation & EXIF stripper
│   │   ├── email.service.js         # Nodemailer notification templates
│   │   └── notification.service.js  # JSON notification logger + email dispatcher
│   │
│   └── utils/
│       ├── date.js                  # 18+ age verification & 72h review deadline
│       ├── generateId.js            # COL-YYYY-XXXXXX application ID generator
│       ├── password.js              # Argon2id hasher and validator
│       └── token.js                 # JWT access & refresh token helper
│
├── tests/
│   └── college.test.js              # 21-suite integration test covering all requirements
├── .env.example                     # Environment variables template
├── package.json
└── README.md
```

---

## 3. Pre-Seeded Default Administrator Accounts

On initial startup, `file.service.js` automatically initializes the JSON storage files and seeds two administrative accounts with Argon2id passwords:

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@college.internal` | `SuperAdmin@2026` |
| **Verification Admin** | `verifier1@college.internal` | `Verifier@2026` |

---

## 4. API Endpoints Catalog

### 🏥 Health & System
- `GET /api/v1/health` – Backend health status & JSON storage status
- `GET /api-docs` – Interactive Swagger OpenAPI 3.0 documentation

### 📝 Registration & Manual Verification
- `POST /api/v1/registration/submit` – Submit 6-step application (accepts JSON or `multipart/form-data` with `photo_1`, `photo_2`, `photo_3`, `identity_document`).
- `GET /api/v1/registration/status/:applicationId` – Check review status & 72-hour countdown.
- `GET /api/v1/registration/application/:applicationId` – Retrieve submitted application details.
- `PUT /api/v1/registration/update/:applicationId` – Update draft application.
- `POST /api/v1/registration/resubmit/:applicationId` – Resubmit corrected details when in `NEEDS_CORRECTION`.

### 🔐 Authentication
- `POST /api/v1/auth/login` – Login with Email / Mobile / Application ID + Password. Returns JWT and user object if approved; returns 403 `ACCOUNT_NOT_ACTIVE` with 72h status if pending/rejected.
- `POST /api/v1/auth/logout` – Clear auth cookie & invalidate session.
- `GET /api/v1/auth/me` – Get profile of currently logged-in user.
- `POST /api/v1/auth/forgot-password` – Request password reset code.
- `POST /api/v1/auth/reset-password` – Reset password with verified token.

### 🛡️ Admin Verification (Requires Admin Role)
- `GET /api/v1/admin/metrics` – Verification statistics: pending, under review, needs correction, approved, rejected, overdue (>72h).
- `GET /api/v1/admin/applications` – List applications with status, search, and pagination.
- `GET /api/v1/admin/applications/:id` – Detailed application view with photos and documents.
- `POST /api/v1/admin/applications/:id/start-review` – Claim application and mark `UNDER_REVIEW`.
- `POST /api/v1/admin/applications/:id/approve` – Approve application and atomically create active user account.
- `POST /api/v1/admin/applications/:id/reject` – Decline application with mandatory justification reason.
- `POST /api/v1/admin/applications/:id/request-correction` – Request corrections on specific fields with instructions.
- `GET /api/v1/admin/documents/:subfolder/:filename` – Secure document and photo streaming.

### 💬 Active User Features (Approved Accounts Only)
- `GET /api/v1/users/me` – User profile.
- `GET /api/v1/profiles/discovery` – Discover campus profiles matching preferences.
- `POST /api/v1/profiles/match-request` – Send match request.
- `GET /api/v1/chat/conversations` – List active mutual friend conversations.
- `GET /api/v1/chat/messages/:conversationId` – Retrieve chat history.
- `GET /api/v1/notifications` – List user notifications.

---

## 5. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 20/22 on Windows 11)
- npm 9+

### Setup & Run
```bash
# Navigate to backend directory
cd college-backend

# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Or start in production mode
npm start
```

The server will start at:
```text
http://localhost:5000
API Base: http://localhost:5000/api/v1
Swagger UI: http://localhost:5000/api-docs
```

---

## 6. Running Automated Tests

A comprehensive integration test suite is located in `tests/college.test.js`, testing all 21 core scenarios (health check, 18+ age enforcement, Indian mobile validation, photo requirements, duplicate prevention, 72h deadline, admin claim, request correction, resubmit, rejection, approval transaction, active user creation, and gatekeeping).

To execute the test suite:
```bash
cd college-backend
npm test
```

Expected result:
```text
✔ Health Check API (GET /api/v1/health)
✔ Under 18 Age Registration Block (DPDP Act Compliance)
✔ Invalid Indian Mobile Format Rejection
✔ Missing Personal Pictures Rejection (Requires all 3 photos)
✔ Successful Application Submission (COL-YYYY-XXXXXX format & 72h deadline)
✔ Prevent Duplicate Email Application
✔ Application Status Inquiry (GET /api/v1/registration/status/:id)
✔ Pending Applicant Login Block (403 ACCOUNT_NOT_ACTIVE)
✔ Admin Login with Seeded SuperAdmin Credentials
✔ Admin Metrics Overview
✔ Admin Applications List
✔ Admin Claim Application (UNDER_REVIEW)
✔ Admin Request Correction (NEEDS_CORRECTION)
✔ Applicant Resubmit Corrected Details (RESUBMITTED)
✔ Admin Reject Application with Mandatory Reason (REJECTED)
✔ Rejected Applicant Login Block
✔ Admin Approve Application (Atomic User Creation Transaction)
✔ Approved Student Login (JWT Token Issued)
✔ Authenticated User /me Profile Endpoint
✔ Secure Admin Document Streaming
✔ Unapproved Account Blocked from Discovery API

ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
```
