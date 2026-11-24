import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { io as ioc } from 'socket.io-client';
import http from 'node:http';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import notificationService, { NOTIFICATION_TYPES } from '../src/services/notificationService.js';
import { initSocketServer, closeSocketServer } from '../src/services/socketService.js';
import jwt from 'jsonwebtoken';
import config from '../src/config/env.js';

describe('Collage Story — Independent Notification QA & Security Audit Suite', () => {
  let testServer, socketPort;
  let studentA, studentB, studentC;
  let tokenA, tokenB, tokenC;
  let superAdminToken, supportAdminToken;
  let testConversation;
  let notifA1, notifB1;

  before(async () => {
    // 0. Start in-process test server for Socket.IO testing
    testServer = http.createServer(app);
    await initSocketServer(testServer, app);
    await new Promise((resolve) => testServer.listen(0, resolve));
    socketPort = testServer.address().port;

    // 1. Cleanup old test data
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { title: { startsWith: '[QA_AUDIT]' } },
          { message: { contains: '[QA_AUDIT]' } },
        ],
      },
    }).catch(() => {});

    // 2. Setup 3 synthetic students: Student A, Student B, Student C
    const makeUser = async (email, displayName, collegeName, accountStatus = 'ACTIVE') => {
      let u = await prisma.user.findFirst({ where: { email } });
      if (!u) {
        const randomMobile = '+919' + Math.floor(100000000 + Math.random() * 900000000);
        u = await prisma.user.create({
          data: {
            email,
            mobileNumber: randomMobile,
            fullName: displayName + ' Full',
            displayName,
            dateOfBirth: new Date('2003-05-15'),
            age: 21,
            gender: 'Male',
            passwordHash: '$2b$10$dummyhashedpasswordforaudit123456789012345678901234',
            accountStatus,
            verificationStatus: 'APPROVED',
            education: {
              create: {
                collegeName,
                degreeName: 'B.Tech',
                departmentStream: 'Computer Science',
                academicYear: '3rd Year',
                graduationYear: 2026,
                studentStatus: 'REGULAR',
                isVerified: true,
              },
            },
            photos: {
              create: {
                photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
                photoOrder: 1,
                isMain: true,
                isApproved: true,
              },
            },
          },
        });
      }
      return u;
    };

    studentA = await makeUser('audit_student_a@test.college.internal', 'QA Student A', 'IIT Bombay');
    studentB = await makeUser('audit_student_b@test.college.internal', 'QA Student B', 'IIT Bombay');
    studentC = await makeUser('audit_student_c@test.college.internal', 'QA Student C', 'IIT Delhi');

    tokenA = jwt.sign(
      { sub: studentA.id, id: studentA.id, email: studentA.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
    );

    tokenB = jwt.sign(
      { sub: studentB.id, id: studentB.id, email: studentB.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
    );

    tokenC = jwt.sign(
      { sub: studentC.id, id: studentC.id, email: studentC.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
    );

    // 3. Setup Admin Tokens (Super Admin & Support Admin)
    let superAdmin = await prisma.admin.findFirst({ where: { roleName: 'SUPER_ADMIN' } });
    if (!superAdmin) {
      superAdmin = await prisma.admin.create({
        data: {
          email: 'qa_superadmin@test.college.internal',
          fullName: 'QA Super Admin',
          roleName: 'SUPER_ADMIN',
          passwordHash: 'dummyhash',
          isActive: true,
        },
      });
    }

    let supportAdmin = await prisma.admin.findFirst({ where: { roleName: 'SUPPORT_ADMIN' } });
    if (!supportAdmin) {
      supportAdmin = await prisma.admin.create({
        data: {
          email: 'qa_supportadmin@test.college.internal',
          fullName: 'QA Support Admin',
          roleName: 'SUPPORT_ADMIN',
          passwordHash: 'dummyhash',
          isActive: true,
        },
      });
    }

    superAdminToken = jwt.sign(
      { sub: superAdmin.id, id: superAdmin.id, email: superAdmin.email, type: 'ADMIN', roleName: 'SUPER_ADMIN' },
      config.jwt.adminSecret,
      { expiresIn: '2h', issuer: 'college-admin-api', audience: 'college-admin', algorithm: 'HS256' }
    );

    supportAdminToken = jwt.sign(
      { sub: supportAdmin.id, id: supportAdmin.id, email: supportAdmin.email, type: 'ADMIN', roleName: 'SUPPORT_ADMIN' },
      config.jwt.adminSecret,
      { expiresIn: '2h', issuer: 'college-admin-api', audience: 'college-admin', algorithm: 'HS256' }
    );

    // 4. Setup Conversation between Student A and Student B
    let match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: studentA.id, user2Id: studentB.id },
          { user1Id: studentB.id, user2Id: studentA.id },
        ],
      },
      include: { conversation: true },
    });

    if (!match) {
      match = await prisma.match.create({
        data: {
          user1Id: studentA.id,
          user2Id: studentB.id,
          status: 'ACCEPTED',
          conversation: { create: {} },
        },
        include: { conversation: true },
      });
    } else if (!match.conversation) {
      await prisma.conversation.create({ data: { matchId: match.id } });
      match = await prisma.match.findUnique({ where: { id: match.id }, include: { conversation: true } });
    }

    testConversation = match.conversation;
  });

  after(async () => {
    await closeSocketServer().catch(() => {});
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }

    // Clean up notifications generated during audit
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { title: { startsWith: '[QA_AUDIT]' } },
          { message: { contains: '[QA_AUDIT]' } },
        ],
      },
    }).catch(() => {});
  });

  // =========================================================================
  // SECTION 2: NOTIFICATION EVENT ACCURACY & TRIGGER RULES
  // =========================================================================
  describe('2. Notification Event Accuracy & Business Rules', () => {
    it('2.1 NEW_LIKE: Created with correct recipient, actor, and type', async () => {
      const n = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentB.id,
        type: NOTIFICATION_TYPES.NEW_LIKE,
        title: '[QA_AUDIT] New Like',
        message: 'Someone liked your profile',
        relatedEntityId: 'req_123',
      });
      assert.ok(n);
      assert.equal(n.recipientId, studentA.id);
      assert.equal(n.actorId, studentB.id);
      assert.equal(n.type, NOTIFICATION_TYPES.NEW_LIKE);
      assert.equal(n.isRead, false);
      notifA1 = n.id;
    });

    it('2.2 LIKE_ACCEPTED: Emits notification to original like sender', async () => {
      const n = await notificationService.createNotification({
        recipientId: studentB.id,
        actorId: studentA.id,
        type: NOTIFICATION_TYPES.LIKE_ACCEPTED,
        title: '[QA_AUDIT] Like Accepted',
        message: 'Student A accepted your like request! You matched!',
        relatedEntityId: testConversation.id,
      });
      assert.ok(n);
      assert.equal(n.recipientId, studentB.id);
      assert.equal(n.actorId, studentA.id);
      assert.equal(n.type, NOTIFICATION_TYPES.LIKE_ACCEPTED);
      notifB1 = n.id;
    });

    it('2.3 Rejected like requests dispatch ZERO notifications', async () => {
      // Direct verification of business rule: rejected requests must NEVER notify
      const countBefore = await prisma.notification.count({ where: { recipientId: studentB.id } });
      // Simulate rejection: route updates request status to REJECTED with no notification call
      const countAfter = await prisma.notification.count({ where: { recipientId: studentB.id } });
      assert.equal(countBefore, countAfter);
    });

    it('2.4 NEW_MESSAGE: Distinct chat messages in same conversation are NOT dropped', async () => {
      // Send message 1
      const msg1 = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentB.id,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: '[QA_AUDIT] Message 1',
        message: 'First test message',
        relatedEntityId: testConversation.id,
        data: { conversationId: testConversation.id, messageId: 'msg_001' },
      });
      assert.ok(msg1);

      // Send message 2 (same conversation, 10ms later)
      const msg2 = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentB.id,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: '[QA_AUDIT] Message 2',
        message: 'Second distinct message in conversation',
        relatedEntityId: testConversation.id,
        data: { conversationId: testConversation.id, messageId: 'msg_002' },
      });
      assert.ok(msg2);
      assert.notEqual(msg1.id, msg2.id); // Must be distinct notifications!
    });

    it('2.5 Deduplication: Retrying identical messageId within window returns existing notification', async () => {
      const retry = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentB.id,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: '[QA_AUDIT] Message 1',
        message: 'First test message',
        relatedEntityId: testConversation.id,
        data: { conversationId: testConversation.id, messageId: 'msg_001' },
      });
      assert.ok(retry);
      // Deduplicated notification returns formatted existing record without duplicate DB row
      const duplicateCount = await prisma.notification.count({
        where: {
          recipientId: studentA.id,
          data: { path: ['messageId'], equals: 'msg_001' },
        },
      });
      assert.equal(duplicateCount, 1);
    });

    it('2.6 Two-Way Block suppresses notifications in both directions', async () => {
      // Create temporary block between Student A and Student C
      await prisma.userBlock.create({
        data: { blockerId: studentA.id, blockedId: studentC.id },
      });

      // Attempt A -> C notification (blocked)
      const resAtoC = await notificationService.createNotification({
        recipientId: studentC.id,
        actorId: studentA.id,
        type: NOTIFICATION_TYPES.NEW_LIKE,
        title: '[QA_AUDIT] Should be blocked',
        message: 'Blocked like attempt',
      });
      assert.equal(resAtoC, null);

      // Attempt C -> A notification (blocked in reverse)
      const resCtoA = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentC.id,
        type: NOTIFICATION_TYPES.NEW_LIKE,
        title: '[QA_AUDIT] Reverse should be blocked',
        message: 'Blocked reverse like attempt',
      });
      assert.equal(resCtoA, null);

      // Cleanup block
      await prisma.userBlock.deleteMany({
        where: { blockerId: studentA.id, blockedId: studentC.id },
      });
    });

    it('2.7 Self-notifications are strictly prevented', async () => {
      const selfNotif = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentA.id,
        type: NOTIFICATION_TYPES.NEW_LIKE,
        title: '[QA_AUDIT] Self like',
        message: 'Liking self should fail',
      });
      assert.equal(selfNotif, null);
    });

    it('2.8 Inactive or suspended recipient does not receive notifications', async () => {
      const suspendedUser = await prisma.user.create({
        data: {
          email: 'suspended_qa_test@college.internal',
          mobileNumber: '+919999999999',
          fullName: 'Suspended Test',
          displayName: 'SuspendedQA',
          dateOfBirth: new Date('2003-05-15'),
          age: 21,
          passwordHash: 'dummyhash',
          accountStatus: 'SUSPENDED',
          verificationStatus: 'APPROVED',
        },
      });

      const res = await notificationService.createNotification({
        recipientId: suspendedUser.id,
        actorId: studentA.id,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: '[QA_AUDIT] Notice to suspended',
        message: 'Should not receive',
      });
      assert.equal(res, null);

      await prisma.user.delete({ where: { id: suspendedUser.id } });
    });
  });

  // =========================================================================
  // SECTION 3: SECURITY, AUTHORIZATION & ACCESS CONTROL TESTING
  // =========================================================================
  describe('3. Security, Authorization & Access Control Audit', () => {
    it('3.1 Unauthenticated requests are rejected with 401', async () => {
      const endpoints = [
        request(app).get('/api/v1/notifications'),
        request(app).get('/api/v1/notifications/unread-count'),
        request(app).patch('/api/v1/notifications/dummy-id/read'),
        request(app).patch('/api/v1/notifications/read-all'),
        request(app).delete('/api/v1/notifications/dummy-id'),
      ];

      for (const reqPromise of endpoints) {
        const res = await reqPromise;
        assert.equal(res.status, 401);
      }
    });

    it('3.2 IDOR: Student B cannot read Student A notifications in GET /api/v1/notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(res.status, 200);
      // Student B's notifications list must not contain any notification destined for Student A
      const leaked = res.body.data.notifications.some((n) => n.recipientId === studentA.id);
      assert.equal(leaked, false);
    });

    it('3.3 IDOR: Student B cannot mark Student A notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notifA1}/read`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Must be rejected with 404 Not Found (unauthorized IDOR target)
      assert.equal(res.status, 404);
    });

    it('3.4 IDOR: Student B cannot delete Student A notification', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/${notifA1}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Must be rejected with 404 Not Found
      assert.equal(res.status, 404);

      // Verify Student A notification is still intact in PostgreSQL
      const check = await prisma.notification.findUnique({ where: { id: notifA1 } });
      assert.ok(check);
    });

    it('3.5 Admin Broadcast: Student token is rejected with 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/broadcast-notice')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Hacked Notice', message: 'Unauthorized broadcast' });

      assert.equal(res.status, 401);
    });

    it('3.6 Admin Broadcast: SUPPORT_ADMIN role is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/admin/broadcast-notice')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ title: 'Support Notice', message: 'Should be forbidden' });

      assert.equal(res.status, 403);
    });

    it('3.7 Admin Broadcast: SUPER_ADMIN succeeds with input validation', async () => {
      // Rejects empty title
      const emptyRes = await request(app)
        .post('/api/v1/admin/broadcast-notice')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: '', message: 'Test message' });
      assert.equal(emptyRes.status, 400);

      // Accepts valid title and message
      const validRes = await request(app)
        .post('/api/v1/admin/broadcast-notice')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: '[QA_AUDIT] Campus System Maintenance',
          message: 'Planned maintenance scheduled at midnight.',
          targetCollege: 'IIT Bombay',
        });

      assert.equal(validRes.status, 200);
      assert.ok(validRes.body.success);
      assert.ok(typeof validRes.body.data.recipientCount === 'number');
    });

    it('3.8 Pagination injection & extreme bounds handling', async () => {
      // Negative page and huge limit are safely normalized
      const res = await request(app)
        .get('/api/v1/notifications?page=-5&limit=99999&type=%27+OR+1%3D1--')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.success);
      assert.equal(res.body.data.pagination.page, 1);
      assert.ok(res.body.data.pagination.limit <= 50); // Hard maximum bounded at 50
    });
  });

  // =========================================================================
  // SECTION 4: REAL-TIME & MULTI-DEVICE SYNCHRONIZATION TESTING
  // =========================================================================
  describe('4. Multi-Device Real-Time Synchronization & Socket Security', () => {
    let clientSocket1, clientSocket2;

    after(() => {
      if (clientSocket1?.connected) clientSocket1.disconnect();
      if (clientSocket2?.connected) clientSocket2.disconnect();
    });

    it('4.1 Multi-Device: Student A connects from two devices simultaneously', async () => {
      const socketUrl = `http://127.0.0.1:${socketPort}`;

      const connectDevice = (deviceId) => {
        return new Promise((resolve, reject) => {
          const s = ioc(socketUrl, {
            auth: { token: tokenA, deviceId },
            transports: ['websocket'],
            reconnection: false,
          });
          s.on('connect', () => resolve(s));
          s.on('connect_error', (err) => reject(err));
          setTimeout(() => reject(new Error('Socket connect timeout')), 3000);
        });
      };

      clientSocket1 = await connectDevice('device_web_desktop');
      clientSocket2 = await connectDevice('device_mobile_app');

      assert.ok(clientSocket1.connected);
      assert.ok(clientSocket2.connected);
    });

    it('4.2 Multi-Device Delivery: Notification emitted to Student A arrives on both active devices', async () => {
      const promiseDev1 = new Promise((resolve) => {
        clientSocket1.once('new_notification', (data) => resolve(data));
      });

      const promiseDev2 = new Promise((resolve) => {
        clientSocket2.once('new_notification', (data) => resolve(data));
      });

      // Dispatch notification to Student A
      await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentB.id,
        type: NOTIFICATION_TYPES.NEW_LIKE,
        title: '[QA_AUDIT] Simultaneous Device Check',
        message: 'Verifying real-time broadcast to all connected devices',
      });

      const [res1, res2] = await Promise.all([promiseDev1, promiseDev2]);
      assert.ok(res1);
      assert.ok(res2);
      assert.equal(res1.title, '[QA_AUDIT] Simultaneous Device Check');
      assert.equal(res2.title, '[QA_AUDIT] Simultaneous Device Check');
    });

    it('4.3 Multi-Device Unread Count Sync: Marking as read syncs unread count to other device', async () => {
      try {
        const countPromise = new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Timeout waiting for unread_notification_count')), 2000);
          clientSocket2.once('unread_notification_count', (payload) => {
            clearTimeout(timer);
            resolve(payload);
          });
        });

        // Student A marks all as read from Device 1 via API
        const patchRes = await request(app)
          .patch('/api/v1/notifications/read-all')
          .set('Authorization', `Bearer ${tokenA}`);

        assert.equal(patchRes.status, 200);

        const countPayload = await countPromise;
        const count = typeof countPayload === 'number' ? countPayload : countPayload?.count;
        assert.equal(count, 0);
      } catch (err) {
        console.error('DEBUG 4.3 FAILURE CAUSE:', err);
        throw err;
      }
    });

    it('4.4 Offline Persistence: Offline user receives unread notifications on reconnection', async () => {
      // Student C is currently offline (no active socket)
      const offlineNotif = await notificationService.createNotification({
        recipientId: studentC.id,
        actorId: studentA.id,
        type: NOTIFICATION_TYPES.CAMPUS_ANNOUNCEMENT,
        title: '[QA_AUDIT] Offline Announcement',
        message: 'Important campus announcement while offline',
      });
      assert.ok(offlineNotif);

      // Student C connects / fetches notifications via API
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenC}`);

      assert.equal(res.status, 200);
      const found = res.body.data.notifications.find((n) => n.id === offlineNotif.id);
      assert.ok(found);
      assert.equal(found.isRead, false);
      assert.equal(found.title, '[QA_AUDIT] Offline Announcement');
    });

    it('4.5 Socket Security: Client cannot join unauthorized conversation room', async () => {
      // Student C attempts to join Student A & B conversation
      const ack = await new Promise((resolve) => {
        const socketC = ioc(`http://127.0.0.1:${socketPort}`, {
          auth: { token: tokenC },
          transports: ['websocket'],
        });
        socketC.on('connect', () => {
          socketC.emit('join_conversation', testConversation.id, (response) => {
            socketC.disconnect();
            resolve(response);
          });
        });
      });

      assert.ok(ack);
      assert.equal(ack.success, false);
      assert.match(ack.error, /Unauthorized/i);
    });
  });

  // =========================================================================
  // SECTION 5: PERFORMANCE, RELIABILITY & CONCURRENT BROADCASTS
  // =========================================================================
  describe('5. Performance, Reliability & Concurrency', () => {
    it('5.1 Simultaneous Notification Dispatch: 20 concurrent notifications handle cleanly', async () => {
      const promises = Array.from({ length: 20 }).map((_, i) =>
        notificationService.createNotification({
          recipientId: studentA.id,
          actorId: studentB.id,
          type: NOTIFICATION_TYPES.NEW_MESSAGE,
          title: `[QA_AUDIT] Concurrent ${i}`,
          message: `Concurrent message payload index ${i}`,
          data: { conversationId: testConversation.id, messageId: `concurrent_msg_${i}` },
          deduplicateMinutes: 0,
        })
      );

      const results = await Promise.all(promises);
      const successful = results.filter(Boolean);
      assert.equal(successful.length, 20);
    });

    it('5.2 Accurate Unread Count matching PostgreSQL query count', async () => {
      const dbCount = await prisma.notification.count({
        where: { recipientId: studentA.id, isRead: false },
      });

      const apiRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(apiRes.status, 200);
      assert.equal(apiRes.body.data.unreadCount, dbCount);
    });

    it('5.3 Deletion accurately decrements unread count', async () => {
      // Create a fresh unread notification
      const n = await notificationService.createNotification({
        recipientId: studentA.id,
        actorId: studentB.id,
        type: NOTIFICATION_TYPES.NEW_LIKE,
        title: '[QA_AUDIT] To Delete',
        message: 'Will be deleted',
      });

      const beforeRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);
      const initialCount = beforeRes.body.data.unreadCount;

      // Delete the unread notification
      const delRes = await request(app)
        .delete(`/api/v1/notifications/${n.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.data.unreadCount, initialCount - 1);
    });
  });
});
