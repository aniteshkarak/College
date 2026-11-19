import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { initStorage, applicationsRepo, usersRepo } from '../src/services/file.service.js';

describe('Collégé Zero-Database Backend Test Suite', () => {
  before(async () => {
    // Initialize storage & seed default admin accounts
    await initStorage();
  });

  // 1. Health & Root
  test('Health check endpoint returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.mode, 'JSON Atomic Persistence Engine (No Database Required)');
  });

  // 2. Under-18 Applicant Rejection
  test('Registration rejects applicant under 18 years old', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'Minor Student',
        display_name: 'Minor',
        date_of_birth: '2012-05-14', // 14 years old
        email: 'minor@gmail.com',
        mobile: '9876543210',
        password: 'Password123!',
        college_name: 'Test College',
        degree_name: 'B.Tech',
        verification_id_type: 'College Student ID',
        verification_id_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        photo_1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        photo_2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        photo_3: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'VALIDATION_FAILED');
  });

  // 3. Mandatory Photo Validations (Missing all, only 1, only 2)
  test('Registration rejects submission with 0 photographs', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'No Photo Student',
        display_name: 'NoPhoto',
        date_of_birth: '2003-05-14',
        email: 'nophoto@gmail.com',
        mobile: '9876543211',
        password: 'Password123!',
        college_name: 'Test College',
        degree_name: 'B.Tech',
        verification_id_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'MISSING_MANDATORY_PHOTOGRAPHS');
  });

  test('Registration rejects submission with only 1 photograph', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'One Photo Student',
        display_name: 'OnePhoto',
        date_of_birth: '2003-05-14',
        email: 'onephoto@gmail.com',
        mobile: '9876543212',
        password: 'Password123!',
        college_name: 'Test College',
        degree_name: 'B.Tech',
        verification_id_url: 'data:image/png;base64,test',
        photo_1: 'data:image/png;base64,test1',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'MISSING_MANDATORY_PHOTOGRAPHS');
  });

  test('Registration rejects submission with only 2 photographs', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'Two Photo Student',
        display_name: 'TwoPhoto',
        date_of_birth: '2003-05-14',
        email: 'twophoto@gmail.com',
        mobile: '9876543213',
        password: 'Password123!',
        college_name: 'Test College',
        degree_name: 'B.Tech',
        verification_id_url: 'data:image/png;base64,test',
        photo_1: 'data:image/png;base64,test1',
        photo_2: 'data:image/png;base64,test2',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'MISSING_MANDATORY_PHOTOGRAPHS');
  });

  // 4. Missing Identity Document Rejection
  test('Registration rejects submission missing identity document', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'No ID Student',
        display_name: 'NoID',
        date_of_birth: '2003-05-14',
        email: 'noid@gmail.com',
        mobile: '9876543214',
        password: 'Password123!',
        college_name: 'Test College',
        degree_name: 'B.Tech',
        photo_1: 'data:image/png;base64,test1',
        photo_2: 'data:image/png;base64,test2',
        photo_3: 'data:image/png;base64,test3',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'MISSING_IDENTITY_DOCUMENT');
  });

  // 5. Successful Registration Submission
  let registeredAppId = null;
  const testStudentEmail = `tanvi.sharma.${Date.now()}@gmail.com`;
  const testStudentMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  test('Valid applicant submits registration successfully with all 3 photos and ID', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'Tanvi Sharma',
        display_name: 'Tanvi',
        date_of_birth: '2004-08-19', // 22 years old
        email: testStudentEmail,
        mobile: testStudentMobile,
        password: 'SecurePassword2026!',
        college_name: "St. Xavier's College, Kolkata",
        degree_name: 'B.Sc Economics (Honours)',
        department_stream: 'Economics',
        academic_year: '3rd Year',
        current_semester: 'Semester 6',
        graduation_year: 2026,
        student_status: 'CURRENTLY_STUDYING',
        verification_id_type: 'College Student ID',
        verification_id_url: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba',
        photo_1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        photo_2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
        photo_3: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
        bio: 'Economics major, amateur violinist, cafe explorer.',
        looking_for: 'Dating',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.applicationId.startsWith('COL-'));
    assert.equal(res.body.data.status, 'PENDING_REVIEW');
    assert.ok(res.body.data.reviewDeadline);

    registeredAppId = res.body.data.applicationId;
  });

  // 6. Duplicate Registration Prevention
  test('Duplicate email registration is blocked', async () => {
    const res = await request(app)
      .post('/api/v1/registration/submit')
      .send({
        legal_name: 'Tanvi Clone',
        display_name: 'TanviClone',
        date_of_birth: '2004-08-19',
        email: testStudentEmail, // duplicate email
        mobile: '9811223344',
        password: 'Password123!',
        college_name: 'Test College',
        degree_name: 'B.Tech',
        verification_id_url: 'https://example.com/id.jpg',
        photo_1: 'https://example.com/p1.jpg',
        photo_2: 'https://example.com/p2.jpg',
        photo_3: 'https://example.com/p3.jpg',
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'APPLICATION_ALREADY_PENDING');
  });

  // 7. Check Application Status
  test('Applicant can check their application status and 72h SLA progress', async () => {
    const res = await request(app).get(`/api/v1/registration/status/${registeredAppId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.applicationId, registeredAppId);
    assert.equal(res.body.data.status, 'PENDING_REVIEW');
    assert.equal(res.body.data.legalName, 'Tanvi Sharma');
  });

  // 8. Pending Applicant Login is Blocked
  test('Pending applicant cannot log in before admin approval', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testStudentEmail,
        password: 'SecurePassword2026!'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'ACCOUNT_NOT_ACTIVE');
    assert.equal(res.body.details.status, 'PENDING_REVIEW');
    assert.equal(res.body.details.applicationId, registeredAppId);
  });

  // 9. Unauthenticated or Pending User cannot access Community / Chat
  test('Pending user or unauthenticated request cannot access chat', async () => {
    const res = await request(app).get('/api/v1/chat/threads');
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'UNAUTHORIZED');
  });

  // 10. Admin Authentication
  let adminToken = null;
  test('Admin logs in with secure admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@college.internal',
        password: 'AdminSecurePassword2026!'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.equal(res.body.data.user.role, 'SUPER_ADMIN');

    adminToken = res.body.data.accessToken;
  });

  // 11. Admin Metrics
  test('Admin fetches 72h overview metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.total >= 1);
    assert.ok(res.body.data.pending >= 1);
  });

  // 12. Admin Claims Application (UNDER_REVIEW)
  test('Admin claims applicant for manual inspection', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${registeredAppId}/start-review`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'UNDER_REVIEW');
    assert.ok(res.body.data.assigned_admin);
  });

  // 13. Admin Requests Correction
  test('Admin can request correction on application', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${registeredAppId}/request-correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fields: ['verification_id_url'],
        message: 'Your student ID card scan was slightly blurry. Please upload a clear photo.'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'NEEDS_CORRECTION');
    assert.deepEqual(res.body.data.correction_fields, ['verification_id_url']);
  });

  // 14. Applicant Resubmission
  test('Applicant resubmits corrected details successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/resubmit/${registeredAppId}`)
      .send({
        verification_id_url: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?clear=true'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'RESUBMITTED');
  });

  // 15. Admin Approval & Transactional User Creation
  test('Admin approves application creating active user in users.json', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/applications/${registeredAppId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.application.status, 'APPROVED');
    assert.equal(res.body.data.user.account_status, 'ACTIVE');
    assert.equal(res.body.data.user.email, testStudentEmail);

    // Verify user is in users.json
    const userInDb = await usersRepo.findByEmail(testStudentEmail);
    assert.ok(userInDb);
    assert.equal(userInDb.account_status, 'ACTIVE');
  });

  // 16. Approved User Login
  let studentToken = null;
  test('Approved user logs in successfully and receives JWT access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testStudentEmail,
        password: 'SecurePassword2026!'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.equal(res.body.data.user.email, testStudentEmail);
    assert.equal(res.body.data.user.account_status, 'ACTIVE');

    studentToken = res.body.data.accessToken;
  });

  // 17. Active User Can Now Access Community & Chat
  test('Active approved user can access chat and members', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  // 18. Unauthorized Document Streaming is Blocked
  test('Unauthorized user cannot stream private documents', async () => {
    const res = await request(app)
      .get('/api/v1/admin/documents/vault/non_existent.jpg')
      .set('Authorization', `Bearer ${studentToken}`); // Student token, not admin!

    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'FORBIDDEN');
  });

  // 19. Simultaneous Submissions Safe Queue Writing
  test('Multiple simultaneous submissions do not corrupt storage', async () => {
    const promises = [1, 2, 3].map((i) =>
      request(app)
        .post('/api/v1/registration/submit')
        .send({
          legal_name: `Concurrent Student ${i}`,
          display_name: `Student${i}`,
          date_of_birth: '2003-01-10',
          email: `concurrent_${i}_${Date.now()}@gmail.com`,
          mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
          password: 'Password123!',
          college_name: 'Kolkata College',
          degree_name: 'B.A.',
          verification_id_url: 'https://example.com/id.jpg',
          photo_1: 'https://example.com/p1.jpg',
          photo_2: 'https://example.com/p2.jpg',
          photo_3: 'https://example.com/p3.jpg',
          termsAccepted: true,
          privacyAccepted: true,
          ageConfirmed18Plus: true,
          verificationConsent: true
        })
    );

    const results = await Promise.all(promises);
    for (const r of results) {
      assert.equal(r.status, 201);
      assert.equal(r.body.success, true);
    }
  });
});
