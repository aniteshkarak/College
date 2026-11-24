# Collage Story — Real-Time Notification System Report

## 1. Executive Summary
A comprehensive, end-to-end, multi-device real-time notification system has been designed, implemented, and verified for **Collage Story**. The architecture uses PostgreSQL as the single source of truth, Prisma ORM with safe non-destructive migrations, Express REST APIs, Socket.IO with multi-device user rooms, and a responsive frontend interface integrated into the College navigation system.

---

## 2. Notification Types & Trigger Matrix

| Notification Type | Trigger Event | Destination Room / Recipient | Target Navigation | Reject/Block Suppression |
| :--- | :--- | :--- | :--- | :--- |
| `NEW_LIKE` | Student sends a match request (`POST /api/v1/matching/send-request`) | `user:${recipientId}` | `navigateTo('matches')` | Suppressed if either user is blocked |
| `LIKE_ACCEPTED` | Student accepts incoming request (`POST /api/v1/matching/requests/:id/accept`) | `user:${actorId}` (original sender) | `navigateTo('chats')` | Mutual match created, conversation enabled |
| `NEW_MESSAGE` | Student sends text chat message | `user:${recipientId}` | `navigateTo('chats')` | Suppressed if conversation is blocked |
| `NEW_VOICE_MESSAGE` | Student sends voice note audio | `user:${recipientId}` | `navigateTo('chats')` | Suppressed if conversation is blocked |
| `CAMPUS_ANNOUNCEMENT` | Verified student publishes announcement on college board | All verified peers in that college (`education: { collegeName }`) | `navigateTo('campus-board')` | Asynchronously broadcast to peer accounts |
| `ADMIN_NOTICE` | Platform admin issues official announcement | All active students or filtered college | Default view / notice alert | Broadcast with admin identity verification |
| `REPORT_UPDATE` | Administrator resolves or dismisses report | Reporter's personal account | `navigateTo('settings')` | Private update visible only to submitter |

> [!IMPORTANT]
> **Safety Constraint Enforcement:**
> In accordance with product requirements, **no notification is generated when a like request is rejected** (`POST /api/v1/matching/requests/:id/reject`). This protects student dignity, prevents harassment, and avoids awkward interactions.
> Furthermore, any two-way block (`UserBlock` table) suppresses all notifications between those two accounts.

---

## 3. Database Schema & Architecture

### Prisma Model: `Notification`
```prisma
model Notification {
  id              String    @id @default(uuid())
  recipientId     String    @map("userId")
  actorId         String?
  type            String
  title           String
  message         String    @map("body")
  relatedEntityId String?
  data            Json?
  isRead          Boolean   @default(false)
  readAt          DateTime?
  createdAt       DateTime  @default(now())

  // Relations
  recipient User  @relation("RecipientNotifications", fields: [recipientId], references: [id], onDelete: Cascade)
  actor     User? @relation("ActorNotifications", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([recipientId, isRead])
  @@index([recipientId, createdAt])
  @@index([recipientId, type])
  @@map("notifications")
}
```

### Zero Data Loss & Non-Destructive Migration
- Used `@map("userId")` and `@map("body")` to preserve all existing PostgreSQL columns without table dropped or reset.
- Added composite indexes `[recipientId, isRead]`, `[recipientId, createdAt]`, and `[recipientId, type]` for ultra-fast pagination and unread count queries.
- Verified that all 17 pre-existing notification records in PostgreSQL remained intact.

---

## 4. Authenticated Backend REST API Endpoints

All notification endpoints derive the recipient's identity strictly from the authenticated JWT token (`req.user.id`). Client-supplied recipient IDs are never trusted.

1. **`GET /api/v1/notifications`**
   - Query Parameters: `page` (default 1), `limit` (default 20, max 100), `isRead` (boolean filter), `type` (type filter)
   - Response: Returns paginated array of notifications formatted with camelCase and snake_case compatibility, plus pagination metadata (`totalPages`, `totalCount`, `hasMore`).

2. **`GET /api/v1/notifications/unread-count`**
   - Returns: `{ success: true, data: { unreadCount: number } }`
   - Optimized with `prisma.notification.count({ where: { recipientId, isRead: false } })`.

3. **`PATCH /api/v1/notifications/:id/read`**
   - Marks a specific notification as read, sets `readAt: new Date()`.
   - Security: Rejects with `404 Not Found` if the notification does not belong to `req.user.id`.
   - Real-Time: Emits updated `unread_notification_count` over Socket.IO to all devices of the user.

4. **`PATCH /api/v1/notifications/read-all`** (also legacy alias `POST /mark-all-read`)
   - Atomically updates all unread notifications of `req.user.id` to `isRead: true`.
   - Emits `unread_notification_count: 0` to all user socket instances.

5. **`DELETE /api/v1/notifications/:id`**
   - Permanently deletes a specific notification owned by `req.user.id`.
   - Prevents unauthorized deletion of another student's notifications.
   - Synchronizes unread count across devices if the deleted item was unread.

6. **`POST /api/v1/admin/broadcast-notice`**
   - Accessible only to authorized `SUPER_ADMIN` and `ADMIN` roles.
   - Dispatches `ADMIN_NOTICE` in real-time to active student accounts.

---

## 5. Real-Time Socket.IO Synchronization

### Multi-Device Room Topology
- On connection and authentication, each student's socket joins their private user room:
  ```javascript
  socket.join(`user:${user.id}`);
  socket.join(`user_${user.id}`);
  ```
- Any event (web, mobile browser, multiple tabs) emitting to `user:${recipientId}` automatically reaches **every active device** belonging to that student simultaneously.
- Events emitted:
  - `new_notification`: Payload containing notification ID, type, title, message, related entity, and actor details.
  - `unread_notification_count`: Payload containing `{ count }`.

### Offline Persistence Guarantee
- Notifications are **always committed to PostgreSQL first** before Socket.IO emission.
- If a user is offline, the notification remains in PostgreSQL with `isRead = false`.
- Upon next login or reconnection, the frontend automatically fetches `GET /api/v1/notifications` and `GET /api/v1/notifications/unread-count`, ensuring zero lost notifications.

---

## 6. Frontend UI & Interaction Design

### Navbar Notification Bell & Unread Badge
- **Unread Badge:** Displays an animated numeric badge (`1`, `5`, `99+`) over the Bell icon whenever unread notifications exist.
- **Header:** Features a live unread counter (`X new`) and a one-click "Mark all read" button with check icon.
- **Notification Item States:**
  - **Type-Specific Icons:**
    - `NEW_LIKE`: Rose pink heart icon
    - `LIKE_ACCEPTED`: Emerald sparkles icon
    - `NEW_MESSAGE`: Blue chat bubble icon
    - `NEW_VOICE_MESSAGE`: Indigo microphone icon
    - `CAMPUS_ANNOUNCEMENT`: Amber megaphone icon
    - `ADMIN_NOTICE`: Purple shield-alert icon
    - `REPORT_UPDATE`: Orange alert-circle icon
  - **Read/Unread Differentiation:** Unread items display bold typography, a subtle rose tint background, and a rose indicator dot. Read items display clean slate styling.
  - **Per-Item Quick Actions:** Hover/tap actions to individually mark as read or delete a notification without opening it.
  - **Click-Through Navigation:**
    - Clicking a `NEW_LIKE` notification navigates to `matches`.
    - Clicking `LIKE_ACCEPTED`, `NEW_MESSAGE`, or `NEW_VOICE_MESSAGE` opens `chats`.
    - Clicking `CAMPUS_ANNOUNCEMENT` opens `campus-board`.
    - Clicking `REPORT_UPDATE` opens `settings`.
  - **Empty State:** Friendly graphic with "No notifications yet. You're all caught up with your college activity."

---

## 7. Verification & Test Results

### Test Suite Execution
- **Notification System Integration Tests:** `tests/notifications.test.js`
  - `✔ 1. Create notifications for user1 with types NEW_LIKE and NEW_MESSAGE`
  - `✔ 2. GET /api/v1/notifications/unread-count returns accurate unread count`
  - `✔ 3. GET /api/v1/notifications returns paginated list of user notifications`
  - `✔ 4. PATCH /api/v1/notifications/:id/read marks single notification as read & prevents cross-user access`
  - `✔ 5. PATCH /api/v1/notifications/read-all marks all unread notifications read`
  - `✔ 6. DELETE /api/v1/notifications/:id deletes notification securely`
  - `✔ 7. Rejection of like request creates NO notification`
  - **Result: 7/7 PASSED (100%)**

- **Full Backend Test Suite:** `npm test`
  - All 147 test scenarios across Admin Auth, Campus Board, Chat, Discovery Privacy, Matching, E2E Journey, and Notifications executed with **0 failures**:
  - `ℹ tests 147`
  - `ℹ suites 12`
  - `ℹ pass 147`
  - `ℹ fail 0`

- **Frontend Production Build:** `npm run build`
  - Vite v6.4.6 production build completed in 5.17s with **0 errors**.
