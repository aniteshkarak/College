process.env.NODE_ENV = 'test';
import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import sharp from 'sharp';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';

describe('Collage Story Full-Stack End-to-End User Journey Test Suite', () => {
  const timestamp = Date.now();
  const testPassword = 'CampusStudent2026!';
  const adminPassword = 'SuperAdminSecurePass2026!';

  let adminUser;
  let adminToken;

  let validImageBuffer;
  let validDocBuffer;
  let sampleVoiceBuffer;

  let appA;
  let appB;

  let studentAUser;
  let studentBUser;
  let studentAToken;
  let studentBToken;

  let matchRequestId;
  let mutualMatchId;
  let conversationId;
  let textMessageId;
  let voiceMessageId;

  const emailA = `arjun.sharma.${timestamp}@iitkgp.ac.in`;
  const emailB = `ananya.sen.${timestamp}@iitkgp.ac.in`;
  const mobileA = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const mobileB = `99${Math.floor(10000000 + Math.random() * 90000000)}`;

  before(async () => {
    // 1. Generate real compliant image buffers for testing Multer & Sharp
    validImageBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 225, g: 29, b: 72 },
      },
    })
      .jpeg()
      .toBuffer();

    validDocBuffer = await sharp({
      create: {
        width: 400,
        height: 250,
        channels: 3,
        background: { r: 59, g: 130, b: 246 },
      },
    })
      .jpeg()
      .toBuffer();

    // 1-second sample audio buffer (RIFF/WAV format)
    sampleVoiceBuffer = Buffer.from(
      'RIFF4\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x10\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00',
      'binary'
    );

    // 2. Ensure Super Admin account exists for verification workflow
    const adminPasswordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    adminUser = await prisma.admin.upsert({
      where: { email: 'aniteshkarak@gmail.com' },
      update: {
        passwordHash: adminPasswordHash,
        isActive: true,
        roleName: 'SUPER_ADMIN',
      },
      create: {
        email: 'aniteshkarak@gmail.com',
        fullName: 'Super Administrator Anitesh',
        passwordHash: adminPasswordHash,
        roleName: 'SUPER_ADMIN',
        isActive: true,
      },
    });
  });

  after(async () => {
    // Graceful teardown
    await prisma.$disconnect().catch(() => {});
    try {
      redis.disconnect();
    } catch {}
  });

  // =========================================================================
  // STEP 1 & 2: STUDENT REGISTRATION (3 PHOTOS + 1 ID DOC)
  // =========================================================================

  test('Step 1: Register Student A (Arjun Sharma, IIT Kharagpur) with 3 photos & ID', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .field('legalName', 'Arjun Sharma')
      .field('displayName', 'Arjun')
      .field('dateOfBirth', '2003-05-15')
      .field('age', 22)
      .field('gender', 'Male')
      .field('city', 'Kharagpur')
      .field('state', 'West Bengal')
      .field('collegeName', 'Indian Institute of Technology Kharagpur')
      .field('degreeName', 'B.Tech Computer Science')
      .field('departmentStream', 'CSE')
      .field('academicYear', '3rd Year')
      .field('currentSemester', 'Semester 6')
      .field('graduationYear', 2026)
      .field('studentStatus', 'CURRENTLY_STUDYING')
      .field('verificationIdType', 'College Student ID')
      .field('email', emailA)
      .field('mobileNumber', mobileA)
      .field('password', testPassword)
      .field('languagesSpoken', 'English, Hindi, Bengali')
      .field('interests', 'Coding, Chess, Music')
      .field('hobbies', 'Photography, Reading')
      .field('bio', 'Final year CSE student at IIT Kharagpur!')
      .field('termsAccepted', 'true')
      .field('privacyAccepted', 'true')
      .field('ageConfirmed18Plus', 'true')
      .field('verificationConsent', 'true')
      .attach('photo_1', validImageBuffer, 'photo1.jpg')
      .attach('photo_2', validImageBuffer, 'photo2.jpg')
      .attach('photo_3', validImageBuffer, 'photo3.jpg')
      .attach('identity_document', validDocBuffer, 'college_id.jpg');

    assert.equal(res.status, 201, `Failed to register Student A: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.applicationId);
    assert.equal(res.body.data.status, 'PENDING_REVIEW');
    appA = res.body.data;
  });

  test('Step 2: Register Student B (Ananya Sen, IIT Kharagpur) with 3 photos & ID', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .field('legalName', 'Ananya Sen')
      .field('displayName', 'Ananya')
      .field('dateOfBirth', '2004-03-20')
      .field('age', 22)
      .field('gender', 'Female')
      .field('city', 'Kharagpur')
      .field('state', 'West Bengal')
      .field('collegeName', 'Indian Institute of Technology Kharagpur')
      .field('degreeName', 'B.Tech Electronics & Electrical Communication')
      .field('departmentStream', 'ECE')
      .field('academicYear', '3rd Year')
      .field('currentSemester', 'Semester 6')
      .field('graduationYear', 2026)
      .field('studentStatus', 'CURRENTLY_STUDYING')
      .field('verificationIdType', 'College Student ID')
      .field('email', emailB)
      .field('mobileNumber', mobileB)
      .field('password', testPassword)
      .field('languagesSpoken', 'English, Hindi, Bengali')
      .field('interests', 'Robotics, Art, Travel')
      .field('hobbies', 'Badminton, Painting')
      .field('bio', 'ECE student fascinated by microelectronics and art!')
      .field('termsAccepted', 'true')
      .field('privacyAccepted', 'true')
      .field('ageConfirmed18Plus', 'true')
      .field('verificationConsent', 'true')
      .attach('photo_1', validImageBuffer, 'photo1.jpg')
      .attach('photo_2', validImageBuffer, 'photo2.jpg')
      .attach('photo_3', validImageBuffer, 'photo3.jpg')
      .attach('identity_document', validDocBuffer, 'college_id.jpg');

    assert.equal(res.status, 201, `Failed to register Student B: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.applicationId);
    assert.equal(res.body.data.status, 'PENDING_REVIEW');
    appB = res.body.data;
  });

  // =========================================================================
  // STEP 3: PRE-APPROVAL SECURITY GATEKEEPING
  // =========================================================================

  test('Step 3: Unapproved applicant cannot log in and receives 403 ACCOUNT_NOT_ACTIVE', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: emailA,
        password: testPassword,
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'ACCOUNT_NOT_ACTIVE');
    assert.equal(res.body.details.status, 'PENDING_REVIEW');
  });

  // =========================================================================
  // STEP 4: SUPER ADMIN AUTHENTICATION
  // =========================================================================

  test('Step 4: Super Admin logs in via /api/v1/admin/auth/login and receives JWT', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'aniteshkarak@gmail.com',
        password: adminPassword,
      });

    assert.equal(res.status, 200, `Admin login failed: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.admin.roleName, 'SUPER_ADMIN');
    adminToken = res.body.data.token;
  });

  // =========================================================================
  // STEP 5: ADMIN INSPECTION OF APPLICATION DOCUMENTS
  // =========================================================================

  test('Step 5: Admin inspects Student A application and verifies document & photos', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/applications/${appA.applicationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.application.applicationId, appA.applicationId);
    assert.equal(res.body.data.application.photographs.length, 3);
    assert.ok(res.body.data.application.identityDocument);
  });

  // =========================================================================
  // STEP 6: ADMIN APPROVAL -> TRANSACTIONAL USER CREATION
  // =========================================================================

  test('Step 6: Admin approves Student A and Student B applications', async () => {
    // Approve Student A
    const resA = await request(app)
      .post(`/api/v1/admin/applications/${appA.applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reviewNotes: 'Verified enrolled student with valid College ID.' });

    assert.equal(resA.status, 200);
    assert.equal(resA.body.data.status, 'APPROVED');

    // Approve Student B
    const resB = await request(app)
      .post(`/api/v1/admin/applications/${appB.applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reviewNotes: 'Verified enrolled student with valid College ID.' });

    assert.equal(resB.status, 200);
    assert.equal(resB.body.data.status, 'APPROVED');

    // Verify Active User records created in PostgreSQL
    studentAUser = await prisma.user.findFirst({
      where: { email: emailA },
      include: { profile: true, education: true, photos: true },
    });
    studentBUser = await prisma.user.findFirst({
      where: { email: emailB },
      include: { profile: true, education: true, photos: true },
    });

    assert.ok(studentAUser);
    assert.equal(studentAUser.accountStatus, 'ACTIVE');
    assert.equal(studentAUser.education.collegeName, 'Indian Institute of Technology Kharagpur');

    assert.ok(studentBUser);
    assert.equal(studentBUser.accountStatus, 'ACTIVE');
    assert.equal(studentBUser.education.collegeName, 'Indian Institute of Technology Kharagpur');
  });

  // =========================================================================
  // STEP 7 & 8: STUDENT LOGIN
  // =========================================================================

  test('Step 7: Approved Student A logs in successfully and receives JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: emailA,
        password: testPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, emailA);
    studentAToken = res.body.data.token;
  });

  test('Step 8: Approved Student B logs in successfully and receives JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: emailB,
        password: testPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, emailB);
    studentBToken = res.body.data.token;
  });

  // =========================================================================
  // STEP 9: DISCOVERY
  // =========================================================================

  test('Step 9: Student A discovers Student B via /api/v1/discovery', async () => {
    const res = await request(app)
      .get('/api/v1/discovery')
      .set('Authorization', `Bearer ${studentAToken}`);

    assert.equal(res.status, 200, `Discovery failed: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    const users = res.body.data.users || res.body.data.profiles;
    assert.ok(Array.isArray(users));

    const discoveredB = users.find((u) => u.id === studentBUser.id);
    assert.ok(discoveredB, 'Student B should be discoverable by Student A');
    assert.equal(discoveredB.displayName || discoveredB.display_name, 'Ananya');
    assert.equal(discoveredB.education?.collegeName || discoveredB.college_name, 'Indian Institute of Technology Kharagpur');
  });

  // =========================================================================
  // STEP 10: SEND MATCH REQUEST (LIKE)
  // =========================================================================

  test('Step 10: Student A sends match request to Student B', async () => {
    const res = await request(app)
      .post('/api/v1/matching/send-request')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ receiverId: studentBUser.id });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.request.status, 'PENDING');
    matchRequestId = res.body.data.request.id;
  });

  // =========================================================================
  // STEP 11: INCOMING REQUEST & NOTIFICATIONS
  // =========================================================================

  test('Step 11: Student B views incoming match requests and notifications', async () => {
    // 1. Check incoming match requests
    const res = await request(app)
      .get('/api/v1/matching/incoming')
      .set('Authorization', `Bearer ${studentBToken}`);

    assert.equal(res.status, 200);
    const requests = res.body.data.requests || res.body.data.incomingLikes;
    assert.ok(Array.isArray(requests));
    const reqFromA = requests.find((r) => r.senderId === studentAUser.id || r.user?.id === studentAUser.id);
    assert.ok(reqFromA, 'Incoming request from Student A must be present');

    // 2. Check in-app notification in PostgreSQL
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentBToken}`);

    assert.equal(notifRes.status, 200);
    const likeNotif = notifRes.body.data.notifications.find((n) => n.type === 'LIKE' || n.type === 'MATCH_REQUEST');
    assert.ok(likeNotif, 'Student B should have a LIKE / MATCH_REQUEST notification');
  });

  // =========================================================================
  // STEP 12: ACCEPT REQUEST -> MUTUAL MATCH & CONVERSATION CREATION
  // =========================================================================

  test('Step 12: Student B accepts match request -> Mutual match & Conversation created', async () => {
    const res = await request(app)
      .post(`/api/v1/matching/requests/${matchRequestId}/accept`)
      .set('Authorization', `Bearer ${studentBToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.match);
    assert.ok(res.body.data.conversation);
    assert.equal(res.body.data.match.status, 'ACTIVE');

    mutualMatchId = res.body.data.match.id;
    conversationId = res.body.data.conversation.id;
  });

  // =========================================================================
  // STEP 13: FETCH ACTIVE CONVERSATIONS
  // =========================================================================

  test('Step 13: Both students can fetch active mutual conversation', async () => {
    // Student A
    const resA = await request(app)
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${studentAToken}`);

    assert.equal(resA.status, 200);
    const convA = resA.body.data.conversations.find((c) => c.id === conversationId);
    assert.ok(convA, 'Conversation must be visible to Student A');

    // Student B
    const resB = await request(app)
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${studentBToken}`);

    assert.equal(resB.status, 200);
    const convB = resB.body.data.conversations.find((c) => c.id === conversationId);
    assert.ok(convB, 'Conversation must be visible to Student B');
  });

  // =========================================================================
  // STEP 14: SEND TEXT MESSAGE
  // =========================================================================

  test('Step 14: Student A sends text message in conversation', async () => {
    const res = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        content: 'Hi Ananya! Great to connect with another IIT KGP student here!',
        messageType: 'TEXT',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.message.messageType, 'TEXT');
    textMessageId = res.body.data.message.id;
  });

  // =========================================================================
  // STEP 15: SEND REAL VOICE NOTE (AUDIO STREAM UPLOAD)
  // =========================================================================

  test('Step 15: Student B uploads voice message (audio blob + duration)', async () => {
    const res = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/voice`)
      .set('Authorization', `Bearer ${studentBToken}`)
      .field('duration', 12)
      .attach('audio', sampleVoiceBuffer, 'voice_reply.wav');

    assert.equal(res.status, 201, `Voice upload failed: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.message.messageType, 'VOICE_NOTE');
    assert.equal(res.body.data.message.voiceDuration, 12);
    assert.ok(res.body.data.message.mediaUrl);
    voiceMessageId = res.body.data.message.id;
  });

  // =========================================================================
  // STEP 16: RETRIEVE MESSAGES & STREAM PRIVATE VOICE AUDIO
  // =========================================================================

  test('Step 16: Student A retrieves messages and streams private voice audio with auth check', async () => {
    // 1. Retrieve all messages in conversation
    const resMsg = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentAToken}`);

    assert.equal(resMsg.status, 200);
    const messages = resMsg.body.data.messages;
    assert.ok(messages.length >= 2, 'Should contain system greeting, text message and voice note');

    const voiceMsg = messages.find((m) => m.id === voiceMessageId);
    assert.ok(voiceMsg, 'Voice note must be present in conversation messages');
    assert.equal(voiceMsg.messageType, 'VOICE_NOTE');
    assert.equal(voiceMsg.voiceDuration, 12);

    // 2. Stream private voice audio with participant authorization (Student A)
    const audioRes = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages/${voiceMessageId}/audio`)
      .set('Authorization', `Bearer ${studentAToken}`);

    assert.ok(
      audioRes.status === 200 || audioRes.status === 206,
      `Expected 200/206 audio stream, got ${audioRes.status}`
    );
    assert.ok(audioRes.headers['content-type'], 'Audio stream must have content-type header');

    // 3. Unauthorized access check: Unauthenticated request must receive 401
    const unauthRes = await request(app).get(
      `/api/v1/chat/conversations/${conversationId}/messages/${voiceMessageId}/audio`
    );
    assert.equal(unauthRes.status, 401);

    // 4. Mark conversation as read
    const readRes = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${studentAToken}`);
    assert.equal(readRes.status, 200);

    // 5. Verify database persistence in PostgreSQL
    const dbConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });
    assert.ok(dbConversation);
    assert.ok(dbConversation.messages.length >= 2);

    const dbNotifications = await prisma.notification.findMany({
      where: { userId: { in: [studentAUser.id, studentBUser.id] } },
    });
    assert.ok(dbNotifications.length >= 2);
  });
});
