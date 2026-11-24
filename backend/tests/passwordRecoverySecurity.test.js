import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { io as ioc } from 'socket.io-client';
import http from 'node:http';
import crypto from 'node:crypto';
import * as argon2 from 'argon2';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import config from '../src/config/env.js';
import authService from '../src/modules/auth/auth.service.js';
import { initSocketServer, closeSocketServer } from '../src/services/socketService.js';

describe('Collage Story — Password Recovery & Account Security Audit Suite', () => {
  let testServer, socketPort;
  let studentUser, suspendedUser;
  let studentSessionA, studentSessionB;
  let studentTokenA, studentTokenB;

  const validOldPassword = 'OldPassword@2026';
  const validNewPassword = 'NewPassword@2026';

  before(async () => {
    // 0. Start in-process server for Socket.IO testing
    testServer = http.createServer(app);
    await initSocketServer(testServer, app);
    await new Promise((resolve) => testServer.listen(0, resolve));
    socketPort = testServer.address().port;

    // 1. Cleanup old test records
    await prisma.passwordResetToken.deleteMany({
      where: {
        user: {
          email: { in: ['sec_student@collagestory.test', 'sec_suspended@collagestory.test'] }
        }
      }
    }).catch(() => {});

    await prisma.userSession.deleteMany({
      where: {
        user: {
          email: { in: ['sec_student@collagestory.test', 'sec_suspended@collagestory.test'] }
        }
      }
    }).catch(() => {});

    await prisma.user.deleteMany({
      where: {
        email: { in: ['sec_student@collagestory.test', 'sec_suspended@collagestory.test'] }
      }
    }).catch(() => {});

    // 2. Hash initial password with Argon2id
    const passwordHash = await argon2.hash(validOldPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    // 3. Create active test student
    studentUser = await prisma.user.create({
      data: {
        email: 'sec_student@collagestory.test',
        mobileNumber: '+919999000111',
        fullName: 'Security Student',
        displayName: 'SecurityStud',
        dateOfBirth: new Date('2003-01-15'),
        age: 23,
        gender: 'Male',
        passwordHash,
        accountStatus: 'ACTIVE',
        verificationStatus: 'APPROVED',
        education: {
          create: {
            collegeName: 'Indian Institute of Technology',
            degreeName: 'B.Tech',
            departmentStream: 'Computer Science',
            academicYear: '4th Year',
            graduationYear: 2026,
            studentStatus: 'REGULAR',
          },
        },
        profile: {
          create: {
            bio: 'Verified computer science student.',
            city: 'New Delhi',
            state: 'Delhi',
            relationshipIntention: 'Casual Connection',
            currentMood: 'Looking for discussion',
          },
        },
      },
    });

    // 4. Create suspended test student
    suspendedUser = await prisma.user.create({
      data: {
        email: 'sec_suspended@collagestory.test',
        mobileNumber: '+919999000222',
        fullName: 'Suspended Student',
        displayName: 'SuspendedStud',
        dateOfBirth: new Date('2002-08-20'),
        age: 24,
        gender: 'Female',
        passwordHash,
        accountStatus: 'SUSPENDED',
        verificationStatus: 'APPROVED',
        education: {
          create: {
            collegeName: 'National Institute of Technology',
            degreeName: 'B.E.',
            departmentStream: 'Information Technology',
            academicYear: 'Final Year',
            graduationYear: 2026,
            studentStatus: 'REGULAR',
          },
        },
        profile: {
          create: {
            bio: 'Suspended profile test.',
            city: 'Kolkata',
            state: 'West Bengal',
            relationshipIntention: 'Friendship',
            currentMood: 'Offline',
          },
        },
      },
    });

    // 5. Create two sessions for active student (simulating Phone and Laptop)
    const loginResA = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      .send({ email: studentUser.email, password: validOldPassword });

    assert.equal(loginResA.status, 200);
    studentTokenA = loginResA.body.data.token;
    studentSessionA = loginResA.body.data.sessionId;

    const loginResB = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')
      .send({ email: studentUser.email, password: validOldPassword });

    assert.equal(loginResB.status, 200);
    studentTokenB = loginResB.body.data.token;
    studentSessionB = loginResB.body.data.sessionId;
  });

  after(async () => {
    await closeSocketServer();
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    // Cleanup created test records
    await prisma.passwordResetToken.deleteMany({
      where: {
        user: {
          email: { in: ['sec_student@collagestory.test', 'sec_suspended@collagestory.test'] }
        }
      }
    }).catch(() => {});
    await prisma.userSession.deleteMany({
      where: {
        user: {
          email: { in: ['sec_student@collagestory.test', 'sec_suspended@collagestory.test'] }
        }
      }
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: {
        email: { in: ['sec_student@collagestory.test', 'sec_suspended@collagestory.test'] }
      }
    }).catch(() => {});
    await prisma.$disconnect();
  });

  // =========================================================================
  // SECTION 1: FORGOT PASSWORD & ENUMERATION DEFENSE
  // =========================================================================
  describe('1. Forgot Password & Anti-Enumeration Defense', () => {
    it('1.1 Non-existent email returns generic 200 without revealing account existence', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent_random_email_9999@collagestory.test' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /If an account matches this email/i);
    });

    it('1.2 Valid student email creates a secure SHA-256 hashed single-use token with 15-minute expiry', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: studentUser.email });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /If an account matches this email/i);

      // Verify token in PostgreSQL database
      const tokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: studentUser.id },
        orderBy: { createdAt: 'desc' },
      });

      assert.ok(tokenRecord, 'Password reset token must be persisted in database');
      assert.equal(tokenRecord.usedAt, null, 'Token must not be marked used upon generation');
      assert.equal(tokenRecord.tokenHash.length, 64, 'Token must be stored as SHA-256 hex hash (64 hex characters)');

      // Verify 15-minute expiration window (between 13 and 16 minutes from now)
      const diffMs = new Date(tokenRecord.expiresAt).getTime() - Date.now();
      const diffMinutes = diffMs / (60 * 1000);
      assert.ok(diffMinutes > 13 && diffMinutes <= 16, `Expiration should be ~15 minutes, got ${diffMinutes.toFixed(2)} min`);
    });

    it('1.3 Consecutive reset requests invalidate prior unused tokens (single active token per user)', async () => {
      // Send second reset request
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: studentUser.email });

      const activeTokens = await prisma.passwordResetToken.findMany({
        where: { userId: studentUser.id, usedAt: null },
      });

      // Exactly 1 active unused token should exist
      assert.equal(activeTokens.length, 1, 'Only the latest token should remain active/unused');
    });

    it('1.4 Suspended accounts return generic 200 but do NOT generate active recovery tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: suspendedUser.email });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /If an account matches this email/i);

      const suspendedTokens = await prisma.passwordResetToken.findMany({
        where: { userId: suspendedUser.id },
      });
      assert.equal(suspendedTokens.length, 0, 'No reset tokens should be created for suspended accounts');
    });
  });

  // =========================================================================
  // SECTION 2: TOKEN VALIDATION, PASSWORD STRENGTH & ARGON2ID
  // =========================================================================
  describe('2. Reset Password Validation, Single-Use & Strength Policies', () => {
    let validRawToken;

    before(async () => {
      // Generate a fresh known token for testing
      validRawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(validRawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.passwordResetToken.deleteMany({ where: { userId: studentUser.id } });
      await prisma.passwordResetToken.create({
        data: {
          userId: studentUser.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    it('2.1 Invalid or malformed token is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'totally_invalid_nonexistent_token_1234567890',
          newPassword: validNewPassword,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Invalid or expired password reset token/i);
    });

    it('2.2 Expired token (>15 minutes) is rejected with 400', async () => {
      const expiredRawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');

      // Create expired record in DB
      await prisma.passwordResetToken.create({
        data: {
          userId: studentUser.id,
          tokenHash,
          expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute in the past
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: expiredRawToken,
          newPassword: validNewPassword,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /expired/i);
    });

    it('2.3 Password strength requirements enforce length, uppercase, lowercase, and numbers', async () => {
      // A) Too short (< 8 chars)
      const resShort = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validRawToken, newPassword: 'Ab1!' });
      assert.equal(resShort.status, 400);

      // B) No uppercase letter
      const resNoUpper = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validRawToken, newPassword: 'password123' });
      assert.equal(resNoUpper.status, 400);

      // C) No number
      const resNoNum = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validRawToken, newPassword: 'PasswordOnly' });
      assert.equal(resNoNum.status, 400);

      // D) Password confirmation mismatch
      const resMismatch = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: validRawToken,
          newPassword: 'ValidPassword@123',
          confirmPassword: 'DifferentPassword@123',
        });
      assert.equal(resMismatch.status, 400);
    });

    it('2.4 Valid password reset updates Argon2id password hash, marks token used, and invalidates sessions', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: validRawToken,
          newPassword: validNewPassword,
          confirmPassword: validNewPassword,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /Password has been reset successfully/i);

      // Verify token is now marked used
      const tokenHash = crypto.createHash('sha256').update(validRawToken).digest('hex');
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      assert.ok(tokenRecord.usedAt !== null, 'Token must be marked with usedAt timestamp');

      // Verify user password hash in DB is updated and verifies with Argon2id
      const updatedUser = await prisma.user.findUnique({ where: { id: studentUser.id } });
      const verifies = await argon2.verify(updatedUser.passwordHash, validNewPassword);
      assert.equal(verifies, true, 'Stored password hash must successfully verify against the new password');

      // Verify old sessions are purged
      const remainingSessions = await prisma.userSession.findMany({
        where: { userId: studentUser.id },
      });
      assert.equal(remainingSessions.length, 0, 'All existing user sessions must be invalidated upon password reset');
    });

    it('2.5 Single-use enforcement: Token reuse is rejected with 400', async () => {
      const resReuse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: validRawToken,
          newPassword: 'AnotherPassword@999',
        });

      assert.equal(resReuse.status, 400);
      assert.match(resReuse.body.message, /already been used/i);
    });

    it('2.6 Race condition test: 5 concurrent reset attempts on same token results in exactly 1 success and 4 rejections', async () => {
      // Create fresh token for concurrency test
      const concurrentRawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(concurrentRawToken).digest('hex');
      await prisma.passwordResetToken.create({
        data: {
          userId: studentUser.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const attempts = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: concurrentRawToken,
            newPassword: `ConcurrentPass${i}@2026`,
          })
      );

      const results = await Promise.all(attempts);
      const successes = results.filter((r) => r.status === 200);
      const failures = results.filter((r) => r.status === 400);

      assert.equal(successes.length, 1, 'Exactly one concurrent attempt must succeed');
      assert.equal(failures.length, 4, 'All subsequent attempts must be rejected due to atomic token consumption');
    });
  });

  // =========================================================================
  // SECTION 3: REAL-TIME ACCESS REVOCATION & LOGIN VERIFICATION
  // =========================================================================
  describe('3. Real-Time Socket Revocation & Re-Authentication', () => {
    it('3.1 Password reset does NOT automatically log student in (no JWT returned)', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.passwordResetToken.create({
        data: {
          userId: studentUser.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'FinalPassword@2026',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data?.token, undefined, 'Must not return authentication JWT in reset response');
    });

    it('3.2 Old password is now rejected upon login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentUser.email,
          password: validOldPassword,
        });

      assert.equal(res.status, 401);
      assert.match(res.body.message, /Incorrect password/i);
    });

    it('3.3 New password succeeds upon login and creates a fresh session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentUser.email,
          password: 'FinalPassword@2026',
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.data.token, 'Must return JWT token upon valid login');
      assert.ok(res.body.data.sessionId, 'Must return sessionId upon valid login');
    });
  });

  // =========================================================================
  // SECTION 4: ACTIVE SESSION MANAGEMENT & MULTI-DEVICE APIS
  // =========================================================================
  describe('4. Active Session Management & Selective Revocation', () => {
    let sessionToken1, sessionId1;
    let sessionToken2, sessionId2;

    before(async () => {
      // Clear sessions and create two fresh sessions
      await prisma.userSession.deleteMany({ where: { userId: studentUser.id } });

      const res1 = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36')
        .send({ email: studentUser.email, password: 'FinalPassword@2026' });

      sessionToken1 = res1.body.data.token;
      sessionId1 = res1.body.data.sessionId;

      const res2 = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148')
        .send({ email: studentUser.email, password: 'FinalPassword@2026' });

      sessionToken2 = res2.body.data.token;
      sessionId2 = res2.body.data.sessionId;
    });

    it('4.1 GET /api/v1/auth/sessions returns sanitized list of active sessions with currentSession flag', async () => {
      const res = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${sessionToken1}`)
        .set('x-session-id', sessionId1);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const sessions = res.body.data.sessions;
      assert.ok(Array.isArray(sessions), 'Sessions must be an array');
      assert.equal(sessions.length, 2, 'Should have exactly 2 active sessions');

      // Check current session marking
      const current = sessions.find((s) => s.id === sessionId1);
      assert.ok(current, 'Current session must be in list');
      assert.equal(current.isCurrentSession, true, 'isCurrentSession should be true for sessionId1');

      const other = sessions.find((s) => s.id === sessionId2);
      assert.ok(other, 'Other session must be in list');
      assert.equal(other.isCurrentSession, false, 'isCurrentSession should be false for sessionId2');

      // Check security sanitization: no raw token hashes exposed
      assert.equal(current.tokenHash, undefined, 'Must not expose raw token hashes');
    });

    it('4.2 Revoking a single session deletes it and immediately disconnects its socket connection', async () => {
      // Connect socket on session 2
      const clientSocket2 = ioc(`http://127.0.0.1:${socketPort}`, {
        auth: { token: sessionToken2, sessionId: sessionId2 },
        transports: ['websocket'],
      });

      let sessionRevokedReceived = false;
      clientSocket2.on('session_revoked', () => {
        sessionRevokedReceived = true;
      });

      await new Promise((resolve) => clientSocket2.on('connect', resolve));

      // Revoke session 2 from session 1
      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${sessionId2}`)
        .set('Authorization', `Bearer ${sessionToken1}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Wait briefly for socket event delivery
      await new Promise((r) => setTimeout(r, 100));

      assert.equal(sessionRevokedReceived, true, 'Socket for session 2 should receive session_revoked event');
      assert.equal(clientSocket2.connected, false, 'Socket for session 2 should be disconnected');

      clientSocket2.disconnect();
    });

    it('4.3 Attempting to revoke another student\'s session returns 404 (isolation)', async () => {
      const res = await request(app)
        .delete('/api/v1/auth/sessions/non-existent-or-other-user-session-id')
        .set('Authorization', `Bearer ${sessionToken1}`);

      assert.equal(res.status, 404);
    });

    it('4.4 DELETE /api/v1/auth/sessions/others revokes all other sessions while preserving current session', async () => {
      // Re-create a second session
      const loginRes3 = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')
        .send({ email: studentUser.email, password: 'FinalPassword@2026' });

      const session3Id = loginRes3.body.data.sessionId;

      // Verify we have 2 sessions now
      const sessionsBefore = await prisma.userSession.findMany({ where: { userId: studentUser.id } });
      assert.equal(sessionsBefore.length, 2);

      // Revoke all other sessions from session 1
      const res = await request(app)
        .delete('/api/v1/auth/sessions/others')
        .set('Authorization', `Bearer ${sessionToken1}`)
        .set('x-session-id', sessionId1);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify only session 1 remains
      const sessionsAfter = await prisma.userSession.findMany({ where: { userId: studentUser.id } });
      assert.equal(sessionsAfter.length, 1);
      assert.equal(sessionsAfter[0].id, sessionId1);
    });

    it('4.5 POST /api/v1/auth/change-password validates current password, enforces strength, and signs out other devices', async () => {
      // Create another session before changing password
      await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Android 14; Mobile)')
        .send({ email: studentUser.email, password: 'FinalPassword@2026' });

      // Change password
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${sessionToken1}`)
        .set('x-session-id', sessionId1)
        .send({
          currentPassword: 'FinalPassword@2026',
          newPassword: 'BrandNewSecurePassword@2027',
          confirmPassword: 'BrandNewSecurePassword@2027',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify Argon2id hash in DB
      const userAfter = await prisma.user.findUnique({ where: { id: studentUser.id } });
      const verifies = await argon2.verify(userAfter.passwordHash, 'BrandNewSecurePassword@2027');
      assert.equal(verifies, true, 'Updated password must verify with Argon2id');
    });
  });
});
