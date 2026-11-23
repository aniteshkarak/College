process.env.NODE_ENV = 'test';
import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';
import config from '../src/config/env.js';
import { STORAGE_PATHS } from '../src/config/storage.js';

describe('Collage Story Admin Authentication & Security Audit Test Suite', () => {
  const timestamp = Date.now();
  const testPassword = 'AuditAdminPassword2026!';
  let passwordHash;

  // Test Admin Accounts
  let superAdmin;
  let verifAdmin;
  let supportAdmin;
  let inactiveAdmin;

  // Tokens
  let superAdminToken;
  let verifAdminToken;
  let supportAdminToken;
  let studentToken;

  // Test Applications & Files
  let appA;
  let appB;
  let docA;
  let docB;
  let photoA;
  let photoB;
  let createdUserId;

  const testDocAFile = `audit_doc_a_${timestamp}.webp`;
  const testDocBFile = `audit_doc_b_${timestamp}.webp`;
  const testPhotoAFile = `audit_photo_a_${timestamp}.webp`;
  const testPhotoBFile = `audit_photo_b_${timestamp}.webp`;

  before(async () => {
    // 1. Generate Argon2id password hash for test admins
    passwordHash = await argon2.hash(testPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // 2. Create test administrators
    superAdmin = await prisma.admin.create({
      data: {
        email: `test_super_${timestamp}@college.internal`,
        fullName: 'Audit Super Administrator',
        passwordHash,
        roleName: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    verifAdmin = await prisma.admin.create({
      data: {
        email: `test_verif_${timestamp}@college.internal`,
        fullName: 'Audit Verification Reviewer',
        passwordHash,
        roleName: 'VERIFICATION_ADMIN',
        isActive: true,
      },
    });

    supportAdmin = await prisma.admin.create({
      data: {
        email: `test_support_${timestamp}@college.internal`,
        fullName: 'Audit Support Staff',
        passwordHash,
        roleName: 'SUPPORT_ADMIN',
        isActive: true,
      },
    });

    inactiveAdmin = await prisma.admin.create({
      data: {
        email: `test_inactive_${timestamp}@college.internal`,
        fullName: 'Audit Deactivated Admin',
        passwordHash,
        roleName: 'VERIFICATION_ADMIN',
        isActive: false,
      },
    });

    // 3. Create dummy files on disk in private storage
    const dummyWebpContent = Buffer.from('RIFF\x24\x00\x00\x00WEBPVP8 \x18\x00\x00\x000\x01\x00\x9d\x01*\x01\x00\x01\x00\x00');
    fs.writeFileSync(path.join(STORAGE_PATHS.DOCUMENTS_DIR, testDocAFile), dummyWebpContent);
    fs.writeFileSync(path.join(STORAGE_PATHS.DOCUMENTS_DIR, testDocBFile), dummyWebpContent);
    fs.writeFileSync(path.join(STORAGE_PATHS.PHOTOS_DIR, testPhotoAFile), dummyWebpContent);
    fs.writeFileSync(path.join(STORAGE_PATHS.PHOTOS_DIR, testPhotoBFile), dummyWebpContent);

    // 4. Create two separate test applications to test cross-application isolation
    appA = await prisma.pendingRegistration.create({
      data: {
        applicationId: `COL-AUDIT-A-${timestamp}`,
        status: 'PENDING_REVIEW',
        legalName: 'Applicant Alpha',
        displayName: 'Alpha',
        dateOfBirth: new Date('2002-05-15'),
        age: 24,
        email: `applicant_alpha_${timestamp}@test.college.internal`,
        mobileNumber: `98765${String(timestamp).slice(-5)}`,
        passwordHash,
        collegeName: 'Alpha Institute of Technology',
        degreeName: 'B.Tech CS',
        departmentStream: 'Engineering',
        academicYear: '4th Year',
        graduationYear: 2026,
        studentStatus: 'CURRENTLY_STUDYING',
        bio: 'Alpha student bio test',
        interests: ['Tech', 'Coding'],
        hobbies: ['Chess'],
        lookingFor: 'Friendship',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true,
        reviewDeadline: new Date(Date.now() + 72 * 3600 * 1000),
        city: 'Bengaluru',
        state: 'Karnataka',
        languagesSpoken: ['English', 'Hindi'],
        preferredDistance: 'ANYWHERE_INDIA',
      },
    });

    docA = await prisma.identityDocument.create({
      data: {
        registration: { connect: { id: appA.id } },
        documentType: 'COLLEGE_ID',
        filePath: testDocAFile,
        fileName: testDocAFile,
        mimeType: 'image/webp',
        fileSize: dummyWebpContent.length,
      },
    });

    photoA = await prisma.userPhoto.create({
      data: {
        registration: { connect: { id: appA.id } },
        photoUrl: testPhotoAFile,
        photoOrder: 1,
      },
    });

    appB = await prisma.pendingRegistration.create({
      data: {
        applicationId: `COL-AUDIT-B-${timestamp}`,
        status: 'PENDING_REVIEW',
        legalName: 'Applicant Beta',
        displayName: 'Beta',
        dateOfBirth: new Date('2003-09-20'),
        age: 23,
        email: `applicant_beta_${timestamp}@test.college.internal`,
        mobileNumber: `91234${String(timestamp).slice(-5)}`,
        passwordHash,
        collegeName: 'Beta College of Arts',
        degreeName: 'B.A. English',
        departmentStream: 'Humanities',
        academicYear: '3rd Year',
        graduationYear: 2027,
        studentStatus: 'CURRENTLY_STUDYING',
        bio: 'Beta student bio test',
        interests: ['Literature', 'Art'],
        hobbies: ['Writing'],
        lookingFor: 'Friendship',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true,
        reviewDeadline: new Date(Date.now() + 72 * 3600 * 1000),
        city: 'Kolkata',
        state: 'West Bengal',
        languagesSpoken: ['English', 'Bengali'],
        preferredDistance: 'ANYWHERE_INDIA',
      },
    });

    docB = await prisma.identityDocument.create({
      data: {
        registration: { connect: { id: appB.id } },
        documentType: 'GOVT_ID',
        filePath: testDocBFile,
        fileName: testDocBFile,
        mimeType: 'image/webp',
        fileSize: dummyWebpContent.length,
      },
    });

    photoB = await prisma.userPhoto.create({
      data: {
        registration: { connect: { id: appB.id } },
        photoUrl: testPhotoBFile,
        photoOrder: 1,
      },
    });

    // 5. Generate Student JWT token (signed with student secret, NOT adminSecret)
    studentToken = jwt.sign(
      {
        sub: 'student-fake-uuid',
        userId: 'student-fake-uuid',
        type: 'STUDENT',
        role: 'STUDENT',
      },
      config.jwt.secret,
      {
        expiresIn: '1h',
        issuer: 'college-api',
        audience: 'college-users',
      }
    );
  });

  after(async () => {
    // Clean up files
    [
      path.join(STORAGE_PATHS.DOCUMENTS_DIR, testDocAFile),
      path.join(STORAGE_PATHS.DOCUMENTS_DIR, testDocBFile),
      path.join(STORAGE_PATHS.PHOTOS_DIR, testPhotoAFile),
      path.join(STORAGE_PATHS.PHOTOS_DIR, testPhotoBFile),
    ].forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    });

    // Clean up created user records if application was approved
    if (createdUserId) {
      await prisma.userProfile.deleteMany({ where: { userId: createdUserId } }).catch(() => {});
      await prisma.education.deleteMany({ where: { userId: createdUserId } }).catch(() => {});
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }

    // Clean up test verification history and audit logs
    const testAdminIds = [superAdmin?.id, verifAdmin?.id, supportAdmin?.id, inactiveAdmin?.id].filter(Boolean);
    await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: testAdminIds } } }).catch(() => {});
    await prisma.verificationHistory.deleteMany({ where: { registrationId: { in: [appA?.id, appB?.id].filter(Boolean) } } }).catch(() => {});
    await prisma.identityDocument.deleteMany({ where: { id: { in: [docA?.id, docB?.id].filter(Boolean) } } }).catch(() => {});
    await prisma.userPhoto.deleteMany({ where: { id: { in: [photoA?.id, photoB?.id].filter(Boolean) } } }).catch(() => {});
    await prisma.pendingRegistration.deleteMany({ where: { id: { in: [appA?.id, appB?.id].filter(Boolean) } } }).catch(() => {});
    await prisma.admin.deleteMany({ where: { id: { in: testAdminIds } } }).catch(() => {});

    await prisma.$disconnect().catch(() => {});
    try {
      redis.disconnect();
    } catch {}
  });

  // =========================================================================
  // 1. ADMINISTRATOR AUTHENTICATION & LOGIN AUDIT
  // =========================================================================

  test('1.1 Admin Login: Valid credentials successfully authenticate and return token', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: superAdmin.email,
        password: testPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token, 'Should return a JWT token');
    assert.equal(res.body.data.tokenType, 'Bearer');
    assert.equal(res.body.data.admin.id, superAdmin.id);
    assert.equal(res.body.data.admin.email, superAdmin.email);
    assert.equal(res.body.data.admin.roleName, 'SUPER_ADMIN');
    assert.equal(res.body.data.admin.passwordHash, undefined, 'Must NEVER leak passwordHash');

    // Store for subsequent tests
    superAdminToken = res.body.data.token;
  });

  test('1.2 Admin Login: Audit log entry is automatically created in AdminAuditLog', async () => {
    const auditEntry = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: superAdmin.id,
        action: 'LOGIN',
      },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(auditEntry, 'Audit log entry must be present in AdminAuditLog');
    assert.equal(auditEntry.targetType, 'ADMIN');
    assert.equal(auditEntry.targetId, superAdmin.id);
    assert.ok(auditEntry.details.includes('Audit Super Administrator'));
  });

  test('1.3 Admin Login: Invalid password fails with generic 401 error', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: superAdmin.email,
        password: 'CompletelyWrongPassword!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.', 'Must not leak account existence');
  });

  test('1.4 Admin Login: Inactive admin account is rejected with generic 401 error', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: inactiveAdmin.email,
        password: testPassword,
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.', 'Must not leak account inactive status');
  });

  test('1.5 Admin Login: Non-existent admin email fails with generic 401 error', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'nobody@nonexistent.internal',
        password: 'AnyPassword123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.');
  });

  test('1.6 Admin Login: Validation rejects missing or malformed inputs with 400', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'invalid-email-format',
        password: '',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('1.7 Authenticate Verification Admin & Support Admin for subsequent tests', async () => {
    const resVerif = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: verifAdmin.email, password: testPassword });
    assert.equal(resVerif.status, 200);
    verifAdminToken = resVerif.body.data.token;

    const resSupport = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: supportAdmin.email, password: testPassword });
    assert.equal(resSupport.status, 200);
    supportAdminToken = resSupport.body.data.token;
  });

  // =========================================================================
  // 2. AUTHORIZATION & TOKEN SECURITY
  // =========================================================================

  test('2.1 Token Security: Missing Authorization header is rejected with 401', async () => {
    const res = await request(app).get('/api/v1/admin/applications');
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Administrator authentication required.');
  });

  test('2.2 Token Security: Malformed or invalid JWT token is rejected with 401', async () => {
    const res = await request(app)
      .get('/api/v1/admin/applications')
      .set('Authorization', 'Bearer invalid.token.payload');
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid or expired administrator token.');
  });

  test('2.3 Token Security: Expired admin JWT token is rejected with 401', async () => {
    const expiredToken = jwt.sign(
      { sub: superAdmin.id, type: 'ADMIN', roleName: 'SUPER_ADMIN' },
      config.jwt.adminSecret,
      { expiresIn: '-1s', issuer: 'college-admin-api', audience: 'college-admin' }
    );

    const res = await request(app)
      .get('/api/v1/admin/applications')
      .set('Authorization', `Bearer ${expiredToken}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid or expired administrator token.');
  });

  test('2.4 Token Security: Student JWT token attempting admin access is rejected with 401', async () => {
    const res = await request(app)
      .get('/api/v1/admin/applications')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid or expired administrator token.');
  });

  // =========================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC)
  // =========================================================================

  test('3.1 RBAC: SUPER_ADMIN can access platform metrics (/metrics) and applications', async () => {
    const resMetrics = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${superAdminToken}`);
    assert.equal(resMetrics.status, 200);
    assert.equal(resMetrics.body.success, true);
    assert.ok(resMetrics.body.data.metrics);

    const resApps = await request(app)
      .get('/api/v1/admin/applications')
      .set('Authorization', `Bearer ${superAdminToken}`);
    assert.equal(resApps.status, 200);
    assert.equal(resApps.body.success, true);
  });

  test('3.2 RBAC: VERIFICATION_ADMIN can access applications but is FORBIDDEN from /metrics', async () => {
    const resApps = await request(app)
      .get('/api/v1/admin/applications')
      .set('Authorization', `Bearer ${verifAdminToken}`);
    assert.equal(resApps.status, 200);

    const resMetrics = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${verifAdminToken}`);
    assert.equal(resMetrics.status, 403);
    assert.equal(resMetrics.body.message, 'You do not have permission to perform this action.');
  });

  test('3.3 RBAC: SUPPORT_ADMIN is strictly FORBIDDEN from /metrics, /applications and review actions', async () => {
    // Forbidden from metrics
    const resMetrics = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${supportAdminToken}`);
    assert.equal(resMetrics.status, 403);

    // Forbidden from application review queue
    const resApps = await request(app)
      .get('/api/v1/admin/applications')
      .set('Authorization', `Bearer ${supportAdminToken}`);
    assert.equal(resApps.status, 403);

    // Forbidden from approving applications
    const resApprove = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/approve`)
      .set('Authorization', `Bearer ${supportAdminToken}`);
    assert.equal(resApprove.status, 403);

    // Forbidden from rejecting applications
    const resReject = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/reject`)
      .set('Authorization', `Bearer ${supportAdminToken}`)
      .send({ reason: 'Unauthorized attempt' });
    assert.equal(resReject.status, 403);
  });

  // =========================================================================
  // 4. REVIEW WORKFLOW INTEGRITY & DUPLICATE APPROVAL PREVENTION
  // =========================================================================

  test('4.1 Workflow: Assign application records assignment & audit log', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/assign`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify Audit Log
    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: verifAdmin.id,
        action: 'ASSIGN_APPLICATION',
        targetId: appA.id,
      },
    });
    assert.ok(audit, 'ASSIGN_APPLICATION audit entry must exist');
  });

  test('4.2 Workflow: Start review updates status to UNDER_REVIEW & logs action', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/start-review`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'UNDER_REVIEW');

    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: verifAdmin.id,
        action: 'START_REVIEW',
        targetId: appA.id,
      },
    });
    assert.ok(audit, 'START_REVIEW audit entry must exist');
  });

  test('4.3 Workflow: Request correction updates status to NEEDS_CORRECTION & logs action', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/request-correction`)
      .set('Authorization', `Bearer ${verifAdminToken}`)
      .send({
        fields: ['College Student ID'],
        message: 'Please re-upload a clearer picture of your college ID.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'NEEDS_CORRECTION');

    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: verifAdmin.id,
        action: 'REQUEST_CORRECTION',
        targetId: appA.id,
      },
    });
    assert.ok(audit, 'REQUEST_CORRECTION audit entry must exist');
  });

  test('4.4 Workflow: Approve application atomically creates User, Profile, Education & logs action', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/approve`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'APPROVED');
    assert.ok(res.body.data.userId);

    createdUserId = res.body.data.userId;

    // Verify Active User created in database
    const createdUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      include: { profile: true, education: true },
    });
    assert.ok(createdUser, 'User account must be created in PostgreSQL');
    assert.equal(createdUser.accountStatus, 'ACTIVE');
    assert.equal(createdUser.role, 'STUDENT');
    assert.equal(createdUser.verificationStatus, 'APPROVED');
    assert.ok(createdUser.profile, 'UserProfile must be created');
    assert.ok(createdUser.education, 'Education must be created');
    assert.equal(createdUser.education.isVerified, true);

    // Verify Audit Log
    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: verifAdmin.id,
        action: 'APPROVE_APPLICATION',
        targetId: appA.id,
      },
    });
    assert.ok(audit, 'APPROVE_APPLICATION audit entry must exist');
  });

  test('4.5 Security: Duplicate approval is strictly prevented on already approved applications', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/approve`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Application has already been approved and account is active');
  });

  test('4.6 Security: Rejection is blocked on already approved applications', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${appA.id}/reject`)
      .set('Authorization', `Bearer ${verifAdminToken}`)
      .send({ reason: 'Invalid rejection attempt' });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Cannot reject an application that has already been approved.');
  });

  // =========================================================================
  // 5. PRIVATE DOCUMENT & PHOTOGRAPH SECURITY
  // =========================================================================

  test('5.1 Document Access: Legitimate owner document is streamed with secure headers & audit log', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/applications/${appA.id}/documents/${docA.id}`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'image/webp');
    assert.ok(res.headers['content-disposition'].includes('inline'));

    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: verifAdmin.id,
        action: 'VIEW_DOCUMENT',
        targetId: docA.id,
      },
    });
    assert.ok(audit, 'VIEW_DOCUMENT audit log must be recorded');
  });

  test('5.2 Photo Access: Legitimate owner photo is streamed with secure headers & audit log', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/applications/${appA.id}/photos/${photoA.id}`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'image/webp');
    assert.ok(res.headers['content-disposition'].includes('inline'));

    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: verifAdmin.id,
        action: 'VIEW_PHOTO',
        targetId: photoA.id,
      },
    });
    assert.ok(audit, 'VIEW_PHOTO audit log must be recorded');
  });

  test('5.3 Security: Cross-application document access is blocked (prevents document leakage)', async () => {
    // Attempting to access docB (belongs to appB) via appA endpoint
    const res = await request(app)
      .get(`/api/v1/admin/applications/${appA.id}/documents/${docB.id}`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Identity document not found for this application');
  });

  test('5.4 Security: Cross-application photo access is blocked (prevents photo leakage)', async () => {
    // Attempting to access photoB (belongs to appB) via appA endpoint
    const res = await request(app)
      .get(`/api/v1/admin/applications/${appA.id}/photos/${photoB.id}`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Photograph not found for this application');
  });

  test('5.5 Security: Generic unverified file streaming route has been removed', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/documents/documents/${testDocAFile}`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    // Route has been removed; must return 404
    assert.equal(res.status, 404);
  });

  test('5.6 Security: Path traversal attempts in document requests are blocked', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/applications/${appA.id}/documents/../../etc/passwd`)
      .set('Authorization', `Bearer ${verifAdminToken}`);

    assert.equal(res.status, 404);
  });

  // =========================================================================
  // 6. AUDIT TRAIL INTEGRITY
  // =========================================================================

  test('6.1 Audit Trail: All recorded admin actions have valid adminId, targetType and timestamp', async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: {
        adminId: { in: [superAdmin.id, verifAdmin.id] },
      },
    });

    assert.ok(logs.length >= 6, 'Should have recorded at least 6 audit log entries');
    logs.forEach((log) => {
      assert.ok(log.id);
      assert.ok(log.action);
      assert.ok(log.targetType);
      assert.ok(log.targetId);
      assert.ok(log.details);
      assert.ok(log.createdAt);
      assert.equal(log.details.includes('password'), false, 'Must NEVER log passwords');
    });
  });
});
