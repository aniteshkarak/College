# Collage Story — Notification System QA and Security Audit Report

**Date:** 24 November 2026  
**Auditor:** Independent Senior QA & Application Security Reviewer  
**Target Application:** Collage Story (College Student Networking & Dating Platform)  
**Scope:** Notification Engine, PostgreSQL Schema, Prisma Models, Express REST APIs, Socket.IO Real-Time Layer, Multi-Device State Sync, RBAC/Auth, and Frontend UI.

---

## 1. Executive Summary

An independent security review and quality assurance audit of the Collage Story notification architecture was conducted. The audit inspected the backend services (`notificationService.js`, `socketService.js`, `notifications.routes.js`, `admin.routes.js`, `campus.service.js`), database models (`Notification`, `User`, `UserBlock`), and frontend components (`Navbar.jsx`, `AppContext.jsx`, `api.js`).

A dedicated 24-scenario test suite ([notificationsQASecurityAudit.test.js](file:///C:/Users/ANITESH/Documents/GitHub/College/backend/tests/notificationsQASecurityAudit.test.js)) was created and executed alongside the full backend test suite of 171 automated tests.

All identified vulnerabilities and bugs were resolved, verified with regression tests, and confirmed passing with **171/171 tests passed (0 failures)** and **0 frontend build errors**.

---

## 2. Security Vulnerabilities Identified & Remediated

### 2.1 Insecure Deduplication Suppressing Distinct Chat Messages (Logic / Integrity Flaw)
- **Severity:** Medium
- **Location:** `backend/src/services/notificationService.js` (lines 111–128)
- **Vulnerability Description:** The original deduplication logic queried for existing notifications matching `recipientId`, `type`, `actorId`, and `relatedEntityId` within a 5-minute window. In chat conversations, `relatedEntityId` is the `conversationId`. Consequently, whenever Student A sent a second, third, or subsequent message within 5 minutes, the engine flagged it as a duplicate and silently dropped the notification.
- **Remediation:** Updated deduplication to inspect `data.messageId` when present (`whereClause.data = { path: ['messageId'], equals: data.messageId }`). Distinct messages in the same conversation now reliably trigger notifications, while network retries of the identical message ID are safely deduplicated.

### 2.2 Socket.IO Count Key Mismatch Causing Silent Desynchronization (Client-Server Desync)
- **Severity:** Low
- **Location:** `backend/src/services/socketService.js` vs `src/context/AppContext.jsx`
- **Vulnerability Description:** `socketService.emitUnreadCount` dispatched the event payload as `{ unreadCount }`, whereas the frontend socket listener in `AppContext.jsx` and test assertions expected `payload?.count`. This resulted in `undefined` counts being processed in device synchronization.
- **Remediation:** Standardized the emission payload to provide both keys: `{ count: unreadCount, unreadCount }`. In addition, updated `AppContext.jsx` to defensively handle both formats.

### 2.3 Potential Denial of Service on Large College Broadcasts (Resource Exhaustion)
- **Severity:** Medium
- **Location:** `backend/src/modules/admin/admin.routes.js` (`POST /broadcast-notice`) & `campus.service.js`
- **Vulnerability Description:** Broadcast notifications to up to 500 or 1,000 students were processed in unbatched sequential/concurrent promise chains on the main thread, risking event loop starvation and socket latency spikes.
- **Remediation:** Added `setImmediate` background scheduling and chunked execution in batches of 25 (`CHUNK_SIZE = 25`), allowing the HTTP API to return immediately while notifications stream smoothly through worker cycles.

### 2.4 Missing Input Sanitization on Administrator Broadcast (Injection & Malformed Payload)
- **Severity:** Low
- **Location:** `backend/src/modules/admin/admin.routes.js`
- **Vulnerability Description:** Missing explicit type, length, and whitespace checks on `title`, `message`, and `targetCollege` parameters.
- **Remediation:** Enforced strict string validation: `title` (max 200 chars), `message` (max 2,000 chars), and `targetCollege` (sanitized case-insensitive match).

### 2.5 Incomplete User Status Validation (Access Control)
- **Severity:** Low
- **Location:** `backend/src/services/notificationService.js`
- **Vulnerability Description:** Previously only checked `recipient.accountStatus === 'SUSPENDED'`. Accounts in `INACTIVE` or `PENDING` states were not guarded, and the actor's status was unchecked.
- **Remediation:** Enforced `recipient.accountStatus === 'ACTIVE'` and `actor.accountStatus === 'ACTIVE'`, ensuring suspended or de-activated accounts can neither receive nor trigger notifications.

---

## 3. Scenarios Tested

### 3.1 Event Accuracy & Business Rules
| Scenario | Description | Status |
| :--- | :--- | :--- |
| **2.1 NEW_LIKE** | Dispatched with correct recipient, actor, title, and `NEW_LIKE` type | **PASSED** |
| **2.2 LIKE_ACCEPTED** | Dispatched to original like sender when mutual match is confirmed | **PASSED** |
| **2.3 Rejected Like Requests** | Verified that rejecting a like request dispatches **zero** notifications | **PASSED** |
| **2.4 NEW_MESSAGE / NEW_VOICE_MESSAGE** | Distinct messages in the same conversation generate distinct notifications | **PASSED** |
| **2.5 Deduplication** | Retried identical `messageId` within window returns existing notification without DB duplicate | **PASSED** |
| **2.6 Two-Way Block** | Verified notifications are blocked in **both** directions if either user blocked the other | **PASSED** |
| **2.7 Self-Notification** | Verified users cannot notify themselves | **PASSED** |
| **2.8 Inactive / Suspended** | Suspended accounts cannot receive or dispatch notifications | **PASSED** |

### 3.2 Security, Authorization & Access Control (IDOR & RBAC)
| Scenario | Description | Status |
| :--- | :--- | :--- |
| **3.1 Unauthenticated Access** | All notification endpoints reject missing/invalid tokens with HTTP 401 | **PASSED** |
| **3.2 IDOR Read Isolation** | Student B cannot retrieve Student A's notifications via `GET /api/v1/notifications` | **PASSED** |
| **3.3 IDOR Read Status Modification** | Student B cannot mark Student A's notification as read (`PATCH /:id/read` returns 404) | **PASSED** |
| **3.4 IDOR Deletion Protection** | Student B cannot delete Student A's notification (`DELETE /:id` returns 404) | **PASSED** |
| **3.5 Admin Broadcast Privilege Escalation** | Regular student token calling `/api/v1/admin/broadcast-notice` rejected with 401 | **PASSED** |
| **3.6 Admin Broadcast Role Check** | `SUPPORT_ADMIN` calling broadcast rejected with 403 Forbidden | **PASSED** |
| **3.7 Admin Broadcast Authorization** | `SUPER_ADMIN` and `ADMIN` authorized, with input bounds validation | **PASSED** |
| **3.8 Query Parameter Sanitization** | Extreme bounds (`page=-5`, `limit=99999`) and SQL injection strings safely handled | **PASSED** |

### 3.3 Real-Time Multi-Device & Socket Security
| Scenario | Description | Status |
| :--- | :--- | :--- |
| **4.1 Multi-Device Connections** | Student connects simultaneously from desktop web and mobile app sockets | **PASSED** |
| **4.2 Multi-Device Delivery** | Incoming notification emitted to `user:${id}` arrives in real time on both active devices | **PASSED** |
| **4.3 Multi-Device State Sync** | Marking all read on Device 1 emits `unread_notification_count: 0` to Device 2 | **PASSED** |
| **4.4 Offline Persistence** | Notification sent while student is offline is saved in PostgreSQL with `isRead: false` | **PASSED** |
| **4.5 Socket Eavesdropping Prevention** | Client attempting to join unauthorized conversation room is rejected with error ack | **PASSED** |

### 3.4 Performance, Reliability & Concurrency
| Scenario | Description | Status |
| :--- | :--- | :--- |
| **5.1 Concurrent Notification Dispatch** | 20 simultaneous notification creations execute cleanly with zero race conditions | **PASSED** |
| **5.2 Unread Count Accuracy** | `GET /unread-count` matches PostgreSQL `count({ isRead: false })` exactly | **PASSED** |
| **5.3 Deletion Count Decrement** | Deleting an unread notification decrements unread count by 1 and syncs devices | **PASSED** |

---

## 4. Frontend UI & Accessibility Verification

1. **Numeric Badge & Live Counter:**
   - Bell icon shows counter badge (`1`, `5`, `99+`) whenever unread notifications exist.
   - Header displays live counter (`X new`) and quick "Mark all read" button.
2. **Keyboard & Touch Accessibility:**
   - Added `mousedown`, `touchstart`, and `keydown (Escape)` listeners to automatically close the notification and profile dropdowns when tapping outside or pressing the Escape key.
3. **Dropdown Responsiveness:**
   - Styled with `w-[calc(100vw-1.5rem)] max-w-sm sm:w-96` to ensure no horizontal overflow on 320px–480px mobile screens.
4. **Empty and Loading States:**
   - Empty state shows a clean bell illustration and "You're all caught up with your college activity."

---

## 5. Test Suite Execution & Build Results

### 5.1 QA & Security Audit Test Suite
```bash
node --test tests/notificationsQASecurityAudit.test.js
```
- **Passed:** 24 / 24 tests
- **Failed:** 0
- **Duration:** 4.15s

### 5.2 Full Backend Regression Test Suite
```bash
npm test
```
- **Total Test Suites:** 17 suites
- **Total Tests:** 171 tests
- **Passed:** 171 (100%)
- **Failed:** 0
- **Duration:** 5.68s

### 5.3 Frontend Production Build
```bash
npm run build
```
- **Tool:** Vite v6.4.6
- **Status:** Built in 5.34s
- **Errors:** 0

---

## 6. Remaining Risks & Operational Recommendations

1. **Email Fallback for Offline Students:**
   - While in-app PostgreSQL notifications reliably wait for the student's next login, critical notifications (such as admin security notices or matched like requests) should ideally have optional email alerts enabled once production SMTP credentials are configured.
2. **Horizontal Redis Scaling:**
   - The Socket.IO Redis adapter is attached and verified. In multi-server container environments, ensure Redis persistence (AOF/RDB) is monitored to maintain pub/sub reliability under heavy network partition events.
