import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import config from '../src/config/env.js';

describe('Collage Story — Comprehensive Matching & Relationship Experience Test Suite', () => {
  let studentA, studentB, studentC, suspendedUser;
  let tokenA, tokenB, tokenC, tokenSuspended;

  const testPassword = 'MatchPassword@2026';
  const collegeA = 'IIT Kharagpur';
  const collegeB = 'Jadavpur University';

  const makeUser = async (email, displayName, collegeName, mobile, accountStatus = 'ACTIVE', verificationStatus = 'APPROVED') => {
    let u = await prisma.user.findFirst({ where: { email } });
    if (!u) {
      const passwordHash = await argon2.hash(testPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
      });

      u = await prisma.user.create({
        data: {
          email,
          mobileNumber: mobile,
          fullName: displayName + ' Student',
          displayName,
          dateOfBirth: new Date('2003-08-20'),
          age: 21,
          gender: 'Female',
          passwordHash,
          accountStatus,
          verificationStatus,
          education: {
            create: {
              collegeName,
              degreeName: 'B.Tech',
              departmentStream: 'Electrical',
              academicYear: '2nd Year',
              graduationYear: 2026,
              studentStatus: 'REGULAR',
              isVerified: true,
            },
          },
          profile: {
            create: {
              bio: `Active student at ${collegeName}`,
              city: 'Kolkata',
              state: 'West Bengal',
              interests: ['Music', 'Reading', 'Coding'],
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
        include: { education: true, profile: true },
      });
    } else {
      // Ensure test status
      u = await prisma.user.update({
        where: { id: u.id },
        data: { accountStatus, verificationStatus },
        include: { education: true, profile: true },
      });
    }
    return u;
  };

  const generateToken = (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'STUDENT' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  };

  before(async () => {
    studentA = await makeUser('studentA_match@iitkgp.ac.in', 'Aanya Sharma', collegeA, '9800000101');
    studentB = await makeUser('studentB_match@jaduniv.edu.in', 'Rohan Sen', collegeB, '9800000102');
    studentC = await makeUser('studentC_match@iitkgp.ac.in', 'Dev Malhotra', collegeA, '9800000103');
    suspendedUser = await makeUser('suspended_match@college.in', 'Suspended Student', collegeA, '9800000104', 'SUSPENDED', 'APPROVED');

    tokenA = generateToken(studentA);
    tokenB = generateToken(studentB);
    tokenC = generateToken(studentC);
    tokenSuspended = generateToken(suspendedUser);

    // Clean up any pre-existing requests/matches between these test users
    const userIds = [studentA.id, studentB.id, studentC.id, suspendedUser.id];
    await prisma.userBlock.deleteMany({
      where: {
        OR: [
          { blockerId: { in: userIds } },
          { blockedId: { in: userIds } },
        ],
      },
    });

    await prisma.matchRequest.deleteMany({
      where: {
        OR: [
          { senderId: { in: userIds } },
          { receiverId: { in: userIds } },
        ],
      },
    });

    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: { in: userIds } },
          { user2Id: { in: userIds } },
        ],
      },
    });
  });

  after(async () => {
    // Clean up
    const userIds = [studentA?.id, studentB?.id, studentC?.id, suspendedUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.matchRequest.deleteMany({
        where: {
          OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
        },
      });
      await prisma.match.deleteMany({
        where: {
          OR: [{ user1Id: { in: userIds } }, { user2Id: { in: userIds } }],
        },
      });
    }
  });

  // =========================================================================
  // 1. Validation & Gatekeeping
  // =========================================================================
  describe('1. Request Creation & Safety Gatekeeping', () => {
    it('prevents self-matching (Student A liking Student A)', async () => {
      const res = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: studentA.id });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /cannot like yourself/i);
    });

    it('prevents suspended student from sending match requests', async () => {
      const res = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenSuspended}`)
        .send({ receiverId: studentB.id });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /not active|Only active and approved/i);
    });

    it('prevents sending request to a suspended student', async () => {
      const res = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: suspendedUser.id });

      assert.equal(res.status, 404);
      assert.match(res.body.message, /not active or approved/i);
    });

    it('prevents interaction between blocked users in both directions', async () => {
      // Student A blocks Student C
      await prisma.userBlock.create({
        data: { blockerId: studentA.id, blockedId: studentC.id },
      });

      // Student A tries to like Student C -> blocked
      const resA = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: studentC.id });
      assert.equal(resA.status, 403);

      // Student C tries to like Student A -> blocked
      const resC = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ receiverId: studentA.id });
      assert.equal(resC.status, 403);

      // Clean up block
      await prisma.userBlock.deleteMany({
        where: { blockerId: studentA.id, blockedId: studentC.id },
      });
    });
  });

  // =========================================================================
  // 2. Sending, Outgoing Requests & Cancellation
  // =========================================================================
  describe('2. Request Workflow: Send, View Sent & Cancel', () => {
    let sentRequestId;

    it('allows Student A to send a match request to Student B', async () => {
      const res = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: studentB.id });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.request.status, 'PENDING');
      assert.equal(res.body.data.request.senderId, studentA.id);
      assert.equal(res.body.data.request.receiverId, studentB.id);
      sentRequestId = res.body.data.request.id;

      // Verify recipient received NEW_LIKE in-app notification
      const notif = await prisma.notification.findFirst({
        where: {
          recipientId: studentB.id,
          actorId: studentA.id,
          type: 'NEW_LIKE',
        },
      });
      assert.ok(notif, 'Receiver should receive NEW_LIKE notification');
    });

    it('prevents duplicate pending request between the same students', async () => {
      const res = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: studentB.id });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /already exists/i);
    });

    it('displays the sent request in Student A outgoing list with status PENDING', async () => {
      const res = await request(app)
        .get('/api/v1/matching/sent')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      const list = res.body.data.sentRequests;
      assert.ok(Array.isArray(list));
      const found = list.find((item) => item.receiverId === studentB.id);
      assert.ok(found, 'Sent request should be in outgoing list');
      assert.equal(found.status, 'PENDING');
      assert.equal(found.user.displayName, studentB.displayName);
      // Privacy check: No email, mobile, or legal name exposed
      assert.equal(found.user.email, undefined);
      assert.equal(found.user.mobileNumber, undefined);
      assert.equal(found.user.legalName, undefined);
    });

    it('displays the incoming request in Student B incoming list with status PENDING', async () => {
      const res = await request(app)
        .get('/api/v1/matching/incoming')
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(res.status, 200);
      const list = res.body.data.incomingLikes;
      assert.ok(Array.isArray(list));
      const found = list.find((item) => item.senderId === studentA.id);
      assert.ok(found, 'Incoming request should be in receiver list');
      assert.equal(found.user.displayName, studentA.displayName);
      // Privacy check
      assert.equal(found.user.email, undefined);
      assert.equal(found.user.mobileNumber, undefined);
    });

    it('allows Student A to cancel their pending sent request', async () => {
      const res = await request(app)
        .delete(`/api/v1/matching/requests/${sentRequestId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.match(res.body.message, /cancelled successfully/i);

      // Verify request is removed from database
      const check = await prisma.matchRequest.findUnique({ where: { id: sentRequestId } });
      assert.equal(check, null);

      // Verify NEW_LIKE notification was cleaned up from Student B
      const notifCheck = await prisma.notification.findFirst({
        where: { relatedEntityId: sentRequestId },
      });
      assert.equal(notifCheck, null, 'Notification should be cleaned up on cancellation');
    });

    it('prevents non-owner from cancelling someone else request', async () => {
      // Re-create request from A to B
      const reqRes = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: studentB.id });
      const newReqId = reqRes.body.data.request.id;

      // Student C attempts to cancel Student A's request -> 404 Unauthorized
      const resC = await request(app)
        .delete(`/api/v1/matching/requests/${newReqId}`)
        .set('Authorization', `Bearer ${tokenC}`);
      assert.equal(resC.status, 404);

      // Cancel legitimately for next tests
      await request(app)
        .delete(`/api/v1/matching/requests/${newReqId}`)
        .set('Authorization', `Bearer ${tokenA}`);
    });
  });

  // =========================================================================
  // 3. Rejection Workflow
  // =========================================================================
  describe('3. Rejection Workflow', () => {
    let rejectReqId;

    it('allows Student C to send request to Student B, and Student B rejects it', async () => {
      const sendRes = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ receiverId: studentB.id });
      rejectReqId = sendRes.body.data.request.id;

      const rejectRes = await request(app)
        .post(`/api/v1/matching/requests/${rejectReqId}/reject`)
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(rejectRes.status, 200);
      assert.match(rejectRes.body.message, /declined/i);

      // Verify database status is REJECTED
      const reqRecord = await prisma.matchRequest.findUnique({ where: { id: rejectReqId } });
      assert.equal(reqRecord.status, 'REJECTED');

      // Verify rejection did NOT create a Match or Conversation
      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: studentC.id, user2Id: studentB.id },
            { user1Id: studentB.id, user2Id: studentC.id },
          ],
        },
      });
      assert.equal(match, null, 'Rejection must never create a match');
    });

    it('does not reveal private rejection reasons or internal notes to sender', async () => {
      const res = await request(app)
        .get('/api/v1/matching/sent')
        .set('Authorization', `Bearer ${tokenC}`);

      assert.equal(res.status, 200);
      const found = res.body.data.sentRequests.find((r) => r.id === rejectReqId);
      assert.ok(found);
      assert.equal(found.status, 'REJECTED');
      assert.equal(found.rejectionReason, undefined);
      assert.equal(found.adminNotes, undefined);
    });
  });

  // =========================================================================
  // 4. Acceptance, Mutual Match & Conversation Creation
  // =========================================================================
  describe('4. Acceptance, Mutual Match, Atomic Transactions & Notifications', () => {
    let matchReqId;
    let createdMatchId;
    let createdConvId;

    it('Student A sends request to Student B, and Student B accepts', async () => {
      // 1. Send request
      const sendRes = await request(app)
        .post('/api/v1/matching/send-request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverId: studentB.id });
      assert.equal(sendRes.status, 201);
      matchReqId = sendRes.body.data.request.id;

      // 2. Accept request
      const acceptRes = await request(app)
        .post(`/api/v1/matching/requests/${matchReqId}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(acceptRes.status, 200);
      assert.ok(acceptRes.body.data.match);
      assert.ok(acceptRes.body.data.conversation);
      createdMatchId = acceptRes.body.data.match.id;
      createdConvId = acceptRes.body.data.conversation.id;

      // Verify Match in DB
      const matchInDb = await prisma.match.findUnique({
        where: { id: createdMatchId },
      });
      assert.equal(matchInDb.status, 'ACTIVE');
      assert.equal(matchInDb.stage, 'Friend');

      // Verify Conversation in DB
      const convInDb = await prisma.conversation.findUnique({
        where: { id: createdConvId },
        include: { messages: true },
      });
      assert.ok(convInDb);
      assert.equal(convInDb.matchId, createdMatchId);
      assert.ok(convInDb.messages.length >= 1, 'Initial greeting system prompt should exist');
    });

    it('delivers mutual match notifications to BOTH Student A and Student B', async () => {
      // Check notification for Student A (sender)
      const notifA = await prisma.notification.findFirst({
        where: {
          recipientId: studentA.id,
          actorId: studentB.id,
          type: 'LIKE_ACCEPTED',
        },
      });
      assert.ok(notifA, 'Student A must receive match notification');

      // Check notification for Student B (acceptor)
      const notifB = await prisma.notification.findFirst({
        where: {
          recipientId: studentB.id,
          actorId: studentA.id,
          type: 'LIKE_ACCEPTED',
        },
      });
      assert.ok(notifB, 'Student B must receive match confirmation notification');
    });

    it('prevents duplicate acceptance on already accepted request', async () => {
      const res = await request(app)
        .post(`/api/v1/matching/requests/${matchReqId}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /already ACCEPTED/i);
    });

    it('lists the active match in both students matches feed', async () => {
      const resA = await request(app)
        .get('/api/v1/matching/matches')
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(resA.status, 200);
      const matchA = resA.body.data.matches.find((m) => m.id === createdMatchId);
      assert.ok(matchA);
      assert.equal(matchA.user.displayName, studentB.displayName);

      const resB = await request(app)
        .get('/api/v1/matching/matches')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(resB.status, 200);
      const matchB = resB.body.data.matches.find((m) => m.id === createdMatchId);
      assert.ok(matchB);
      assert.equal(matchB.user.displayName, studentA.displayName);
    });

    it('allows messaging between matched students in their conversation', async () => {
      const res = await request(app)
        .post(`/api/v1/chat/conversations/${createdConvId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Hello Rohan! Glad to connect.',
          messageType: 'TEXT',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.message.content, 'Hello Rohan! Glad to connect.');
    });

    it('prevents third-party student (Student C) from posting to their conversation', async () => {
      const res = await request(app)
        .post(`/api/v1/chat/conversations/${createdConvId}/messages`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({
          content: 'Unauthorized intrusion message',
          messageType: 'TEXT',
        });

      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // 5. Unmatching, Conversation Disabling & Non-Restoration
  // =========================================================================
  describe('5. Unmatching & Conversation Access Revocation', () => {
    let activeMatch;

    before(async () => {
      activeMatch = await prisma.match.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            { user1Id: studentA.id, user2Id: studentB.id },
            { user1Id: studentB.id, user2Id: studentA.id },
          ],
        },
        include: { conversation: true },
      });
    });

    it('allows Student A to unmatch Student B', async () => {
      const res = await request(app)
        .post(`/api/v1/matching/matches/${activeMatch.id}/unmatch`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.match(res.body.message, /unmatched successfully/i);

      const updated = await prisma.match.findUnique({ where: { id: activeMatch.id } });
      assert.equal(updated.status, 'UNMATCHED');
    });

    it('immediately prevents messaging after unmatch', async () => {
      const res = await request(app)
        .post(`/api/v1/chat/conversations/${activeMatch.conversation.id}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          content: 'Trying to send message after unmatch',
          messageType: 'TEXT',
        });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /blocked or inactive/i);
    });

    it('does not display unmatched connections in GET /matching/matches', async () => {
      const res = await request(app)
        .get('/api/v1/matching/matches')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      const found = res.body.data.matches.find((m) => m.id === activeMatch.id);
      assert.equal(found, undefined, 'Unmatched connection must not appear in active matches');
    });

    it('does not silently restore match if unblocking occurs', async () => {
      // Simulate blocking and subsequent unblocking
      await prisma.userBlock.create({
        data: { blockerId: studentA.id, blockedId: studentB.id },
      });

      await request(app)
        .post('/api/v1/matching/unblock')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ unblockId: studentB.id });

      // Match status must still remain UNMATCHED, never silently restored
      const match = await prisma.match.findUnique({ where: { id: activeMatch.id } });
      assert.equal(match.status, 'UNMATCHED');
    });
  });
});
