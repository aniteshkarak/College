process.env.NODE_ENV = 'test';
import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';
import config from '../src/config/env.js';

describe('Collage Story Discovery & Profile Privacy Test Suite (17 Comprehensive Tests)', () => {
  const timestamp = Date.now();
  const testPassword = 'DiscoverySecurePass2026!';
  let passwordHash;

  // College names
  const collegeKgp = `IIT Kharagpur Test ${timestamp}`;
  const collegeJdv = `Jadavpur University Test ${timestamp}`;
  const collegeSolo = `Solo College Test ${timestamp}`;

  // Test Users
  let approvedKgpMale;
  let approvedKgpFemale1;
  let approvedKgpFemale2;
  let approvedKgpFemale3;
  let approvedJdvFemale1;
  let approvedJdvMale1;
  let approvedSoloUser;

  let pendingApplicant;
  let rejectedUser;
  let suspendedUser;

  // Tokens
  let tokenKgpMale;
  let tokenKgpFemale1;
  let tokenSoloUser;
  let tokenPending;
  let tokenRejected;
  let tokenSuspended;

  // Helper to generate compliant student JWT
  const generateStudentToken = (userId) => {
    return jwt.sign(
      { sub: userId, role: 'STUDENT' },
      config.jwt.secret,
      { expiresIn: '7d', issuer: 'college-api', audience: 'college-mobile-web' }
    );
  };

  before(async () => {
    passwordHash = await argon2.hash(testPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Helper to create an approved active student
    const createApprovedStudent = async (params) => {
      const email = `disc_${params.prefix}_${timestamp}@college.test`;
      const mobileNumber = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

      return prisma.user.create({
        data: {
          email,
          mobileNumber,
          passwordHash,
          fullName: params.fullName,
          displayName: params.displayName,
          dateOfBirth: new Date(Date.now() - params.age * 365.25 * 24 * 60 * 60 * 1000),
          age: params.age,
          gender: params.gender,
          accountStatus: 'ACTIVE',
          verificationStatus: 'APPROVED',
          role: 'STUDENT',
          profile: {
            create: {
              bio: `Bio of ${params.displayName}`,
              interests: params.interests || ['Music', 'Tech'],
              hobbies: ['Reading'],
              relationshipIntention: params.intention || 'Casual Connection',
              city: params.city || 'Kolkata',
              state: 'West Bengal',
              currentMood: 'Want to make friends',
            },
          },
          education: {
            create: {
              collegeName: params.collegeName,
              universityName: 'State Technical University',
              degreeName: 'B.Tech',
              departmentStream: 'Computer Science',
              academicYear: '3rd Year',
              currentSemester: 'Semester 6',
              graduationYear: 2027,
              studentStatus: 'CURRENTLY_STUDYING',
              isVerified: true,
            },
          },
          photos: {
            create: [
              { photoUrl: `https://cdn.college.internal/photos/${params.prefix}_1.webp`, photoOrder: 1, isMain: true, isApproved: true },
              { photoUrl: `https://cdn.college.internal/photos/${params.prefix}_2.webp`, photoOrder: 2, isMain: false, isApproved: true },
              { photoUrl: `https://cdn.college.internal/photos/${params.prefix}_3.webp`, photoOrder: 3, isMain: false, isApproved: true },
            ],
          },
          identityDocuments: {
            create: {
              documentType: 'COLLEGE_ID',
              filePath: `private_id_${params.prefix}.webp`,
              fileName: 'college_id.webp',
              fileSize: 10240,
              mimeType: 'image/webp',
              isVerified: true,
            },
          },
        },
      });
    };

    // 1. Create Same-College Students (IIT Kharagpur)
    approvedKgpMale = await createApprovedStudent({
      prefix: 'kgp_m',
      fullName: 'Arjun Sharma',
      displayName: 'Arjun S',
      gender: 'Male',
      age: 21,
      collegeName: collegeKgp,
      intention: 'Casual Connection',
    });

    approvedKgpFemale1 = await createApprovedStudent({
      prefix: 'kgp_f1',
      fullName: 'Priya Sen',
      displayName: 'Priya S',
      gender: 'Female',
      age: 20,
      collegeName: collegeKgp,
      intention: 'Casual Connection',
    });

    approvedKgpFemale2 = await createApprovedStudent({
      prefix: 'kgp_f2',
      fullName: 'Ananya Roy',
      displayName: 'Ananya R',
      gender: 'Female',
      age: 22,
      collegeName: collegeKgp,
      intention: 'Dating Connection',
    });

    approvedKgpFemale3 = await createApprovedStudent({
      prefix: 'kgp_f3',
      fullName: 'Sneha Mukherjee',
      displayName: 'Sneha M',
      gender: 'Female',
      age: 23,
      collegeName: collegeKgp,
      intention: 'Friendship',
    });

    // 2. Create Other-College Students (Jadavpur University)
    approvedJdvFemale1 = await createApprovedStudent({
      prefix: 'jdv_f1',
      fullName: 'Riya Das',
      displayName: 'Riya D',
      gender: 'Female',
      age: 21,
      collegeName: collegeJdv,
      intention: 'Casual Connection',
    });

    approvedJdvMale1 = await createApprovedStudent({
      prefix: 'jdv_m1',
      fullName: 'Rohan Bose',
      displayName: 'Rohan B',
      gender: 'Male',
      age: 22,
      collegeName: collegeJdv,
      intention: 'Dating Connection',
    });

    // 3. Create Solo-College Student (with 0 peers in same college)
    approvedSoloUser = await createApprovedStudent({
      prefix: 'solo_u',
      fullName: 'Vikram Patel',
      displayName: 'Vikram P',
      gender: 'Male',
      age: 24,
      collegeName: collegeSolo,
      intention: 'Friendship',
    });

    // 4. Create Pending Registration (Pre-approval applicant, NO User record)
    pendingApplicant = await prisma.pendingRegistration.create({
      data: {
        applicationId: `COL-TEST-${timestamp}`,
        legalName: 'Pending Student',
        displayName: 'Pending S',
        email: `pending_${timestamp}@college.test`,
        mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        passwordHash,
        dateOfBirth: new Date('2003-05-15'),
        age: 23,
        gender: 'Male',
        city: 'Kolkata',
        state: 'West Bengal',
        collegeName: collegeKgp,
        degreeName: 'B.Tech',
        departmentStream: 'Electrical',
        academicYear: '4th Year',
        graduationYear: 2026,
        bio: 'Pending applicant bio',
        status: 'PENDING_REVIEW',
        reviewDeadline: new Date(Date.now() + 72 * 3600 * 1000),
      },
    });

    // 5. Create Rejected User
    rejectedUser = await prisma.user.create({
      data: {
        email: `rejected_${timestamp}@college.test`,
        mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        passwordHash,
        fullName: 'Rejected Student',
        displayName: 'Rejected S',
        dateOfBirth: new Date('2004-01-01'),
        age: 22,
        gender: 'Female',
        accountStatus: 'ACTIVE',
        verificationStatus: 'REJECTED',
        role: 'STUDENT',
      },
    });

    // 6. Create Suspended User
    suspendedUser = await prisma.user.create({
      data: {
        email: `suspended_${timestamp}@college.test`,
        mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        passwordHash,
        fullName: 'Suspended Student',
        displayName: 'Suspended S',
        dateOfBirth: new Date('2002-08-20'),
        age: 24,
        gender: 'Male',
        accountStatus: 'SUSPENDED',
        verificationStatus: 'APPROVED',
        role: 'STUDENT',
      },
    });

    // Generate tokens
    tokenKgpMale = generateStudentToken(approvedKgpMale.id);
    tokenKgpFemale1 = generateStudentToken(approvedKgpFemale1.id);
    tokenSoloUser = generateStudentToken(approvedSoloUser.id);
    tokenPending = generateStudentToken(pendingApplicant.id);
    tokenRejected = generateStudentToken(rejectedUser.id);
    tokenSuspended = generateStudentToken(suspendedUser.id);
  });

  after(async () => {
    // Cleanup created test records
    try {
      const testEmails = [
        approvedKgpMale?.email,
        approvedKgpFemale1?.email,
        approvedKgpFemale2?.email,
        approvedKgpFemale3?.email,
        approvedJdvFemale1?.email,
        approvedJdvMale1?.email,
        approvedSoloUser?.email,
        rejectedUser?.email,
        suspendedUser?.email,
      ].filter(Boolean);

      await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
      if (pendingApplicant?.id) {
        await prisma.pendingRegistration.delete({ where: { id: pendingApplicant.id } }).catch(() => {});
      }
    } catch (err) {
      // Ignore cleanup error
    }
  });

  // =========================================================================
  // TEST 1: APPROVED USER CAN ACCESS DISCOVERY
  // =========================================================================
  test('Test 1: Approved user can access discovery successfully', async () => {
    const res = await request(app)
      .get('/api/v1/discovery')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.profiles));
    assert.ok(res.body.data.pagination);
  });

  // =========================================================================
  // TEST 2: PENDING USER CANNOT ACCESS DISCOVERY
  // =========================================================================
  test('Test 2: Pending user cannot access discovery and receives 401 or 403', async () => {
    const res = await request(app)
      .get('/api/v1/discovery')
      .set('Authorization', `Bearer ${tokenPending}`);

    assert.ok([401, 403].includes(res.status));
    assert.equal(res.body.success, false);
  });

  // =========================================================================
  // TEST 3: REJECTED USER CANNOT ACCESS DISCOVERY
  // =========================================================================
  test('Test 3: Rejected user cannot access discovery and receives 403', async () => {
    const res = await request(app)
      .get('/api/v1/discovery')
      .set('Authorization', `Bearer ${tokenRejected}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // =========================================================================
  // TEST 4: SUSPENDED USER CANNOT ACCESS DISCOVERY
  // =========================================================================
  test('Test 4: Suspended user cannot access discovery and receives 403', async () => {
    const res = await request(app)
      .get('/api/v1/discovery')
      .set('Authorization', `Bearer ${tokenSuspended}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // =========================================================================
  // TEST 5: FEMALE PREFERENCE RETURNS FEMALE PROFILES ONLY
  // =========================================================================
  test('Test 5: Female preference returns female profiles only', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?gender=FEMALE')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;
    assert.ok(profiles.length > 0);
    for (const p of profiles) {
      assert.ok(['Female', 'female', 'Woman', 'Women'].includes(p.gender), `Expected female profile but got ${p.gender}`);
    }
  });

  // =========================================================================
  // TEST 6: MALE PREFERENCE RETURNS MALE PROFILES ONLY
  // =========================================================================
  test('Test 6: Male preference returns male profiles only', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?gender=MALE')
      .set('Authorization', `Bearer ${tokenKgpFemale1}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;
    assert.ok(profiles.length > 0);
    for (const p of profiles) {
      assert.ok(['Male', 'male', 'Man', 'Men'].includes(p.gender), `Expected male profile but got ${p.gender}`);
    }
  });

  // =========================================================================
  // TEST 7: EVERYONE PREFERENCE RETURNS ALL ELIGIBLE GENDER PROFILES
  // =========================================================================
  test('Test 7: Everyone preference returns both male and female profiles', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?gender=EVERYONE')
      .set('Authorization', `Bearer ${tokenSoloUser}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;
    assert.ok(profiles.length >= 2);
    const hasFemale = profiles.some((p) => ['Female', 'female', 'Woman', 'Women'].includes(p.gender));
    const hasMale = profiles.some((p) => ['Male', 'male', 'Man', 'Men'].includes(p.gender));
    assert.ok(hasFemale, 'Should return at least one female profile');
    assert.ok(hasMale, 'Should return at least one male profile');
  });

  // =========================================================================
  // TEST 8: SAME-COLLEGE PROFILES APPEAR FIRST
  // =========================================================================
  test('Test 8: Profiles from the same college appear first in discovery', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?gender=EVERYONE&limit=10')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;
    assert.ok(profiles.length > 0);

    // The first profile must be from the same college (IIT Kharagpur)
    assert.equal(profiles[0].college_name, collegeKgp);
    assert.equal(profiles[0].is_same_college, true);
  });

  // =========================================================================
  // TEST 9: OTHER-COLLEGE PROFILES APPEAR ONLY AFTER SAME-COLLEGE EXHAUSTION
  // =========================================================================
  test('Test 9: Other-college profiles appear only after all same-college profiles are shown', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?gender=EVERYONE&limit=10')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;

    let seenOtherCollege = false;
    for (const p of profiles) {
      if (p.college_name !== collegeKgp) {
        seenOtherCollege = true;
      }
      if (seenOtherCollege) {
        // Once an other-college profile appears, no same-college profiles should follow
        assert.notEqual(p.college_name, collegeKgp, 'Same-college profile appeared after other-college profile!');
      }
    }
  });

  // =========================================================================
  // TEST 10: MORE SAME-COLLEGE PROFILES THAN ONE PAGE ARE HANDLED CORRECTLY
  // =========================================================================
  test('Test 10: Multiple pages of same-college profiles stay within same college until exhausted', async () => {
    // There are 3 eligible same-college peers for kgpMale: kgpFemale1, kgpFemale2, kgpFemale3
    // With limit=2:
    // Page 1 should return 2 same-college profiles
    const page1 = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&page=1&limit=2')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.profiles.length, 2);
    assert.equal(page1.body.data.profiles[0].college_name, collegeKgp);
    assert.equal(page1.body.data.profiles[1].college_name, collegeKgp);

    // Page 2 should return the 3rd same-college profile, plus 1 other-college profile (jdvFemale1)
    const page2 = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&page=2&limit=2')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(page2.status, 200);
    assert.equal(page2.body.data.profiles.length, 2);
    // First item of page 2 is the 3rd same-college profile
    assert.equal(page2.body.data.profiles[0].college_name, collegeKgp);
    // Second item of page 2 begins other-college profiles
    assert.equal(page2.body.data.profiles[1].college_name, collegeJdv);
  });

  // =========================================================================
  // TEST 11: PAGINATION DOES NOT CREATE DUPLICATES
  // =========================================================================
  test('Test 11: Pagination across pages produces zero duplicate profiles', async () => {
    const page1 = await request(app)
      .get('/api/v1/discovery?gender=EVERYONE&page=1&limit=2')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    const page2 = await request(app)
      .get('/api/v1/discovery?gender=EVERYONE&page=2&limit=2')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    const ids1 = page1.body.data.profiles.map((p) => p.id);
    const ids2 = page2.body.data.profiles.map((p) => p.id);

    for (const id of ids1) {
      assert.ok(!ids2.includes(id), `Duplicate profile ID ${id} found across page 1 and page 2!`);
    }
  });

  // =========================================================================
  // TEST 12: PREFERENCE CHANGES RECALCULATE RESULTS
  // =========================================================================
  test('Test 12: Updating discovery preferences recalculates eligible profiles', async () => {
    // 1. Set preference to MALE
    const updateRes = await request(app)
      .put('/api/v1/discovery/preferences')
      .set('Authorization', `Bearer ${tokenKgpFemale1}`)
      .send({ gender: 'MALE', minAge: 20, maxAge: 23 });

    assert.equal(updateRes.status, 200);

    // 2. Query discovery using updated saved preference
    const res = await request(app)
      .get('/api/v1/discovery')
      .set('Authorization', `Bearer ${tokenKgpFemale1}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;
    for (const p of profiles) {
      assert.ok(['Male', 'male', 'Man', 'Men'].includes(p.gender));
      assert.ok(p.age >= 20 && p.age <= 23);
    }
  });

  // =========================================================================
  // TEST 13: EMPTY SAME-COLLEGE RESULTS FALL BACK TO OTHER COLLEGES
  // =========================================================================
  test('Test 13: When no same-college profiles exist, immediately shows other colleges', async () => {
    // soloUser is the ONLY student in collegeSolo
    const res = await request(app)
      .get('/api/v1/discovery?limit=10')
      .set('Authorization', `Bearer ${tokenSoloUser}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.pagination.totalSameCollege, 0);
    assert.ok(res.body.data.profiles.length > 0);
    // All returned profiles must be from other colleges
    for (const p of res.body.data.profiles) {
      assert.notEqual(p.college_name, collegeSolo);
      assert.equal(p.is_same_college, false);
    }
  });

  // =========================================================================
  // TEST 14: OWN PROFILE IS NEVER RETURNED
  // =========================================================================
  test('Test 14: Requester own profile is strictly excluded from discovery results', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?gender=EVERYONE&limit=50')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(res.status, 200);
    const ids = res.body.data.profiles.map((p) => p.id);
    assert.ok(!ids.includes(approvedKgpMale.id), 'Requester own profile was returned in discovery!');
  });

  // =========================================================================
  // TEST 15: BLOCKED PROFILES ARE EXCLUDED
  // =========================================================================
  test('Test 15: Blocked profiles are strictly excluded from discovery', async () => {
    // kgpMale blocks jdvMale1
    await request(app)
      .post('/api/v1/matching/block')
      .set('Authorization', `Bearer ${tokenKgpMale}`)
      .send({ blockedId: approvedJdvMale1.id, reason: 'Test block' });

    // Discovery for kgpMale must NOT include jdvMale1
    const res1 = await request(app)
      .get('/api/v1/discovery?gender=MALE&limit=50')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    const ids1 = res1.body.data.profiles.map((p) => p.id);
    assert.ok(!ids1.includes(approvedJdvMale1.id), 'Blocked user was returned in discovery feed!');

    // Reverse check: Discovery for jdvMale1 must NOT include kgpMale
    const tokenJdvMale = generateStudentToken(approvedJdvMale1.id);
    const res2 = await request(app)
      .get('/api/v1/discovery?gender=MALE&limit=50')
      .set('Authorization', `Bearer ${tokenJdvMale}`);

    const ids2 = res2.body.data.profiles.map((p) => p.id);
    assert.ok(!ids2.includes(approvedKgpMale.id), 'Blocker was returned in blocked user discovery feed!');
  });

  // =========================================================================
  // TEST 16: PUBLIC RESPONSES DO NOT CONTAIN PRIVATE CONTACT INFORMATION
  // =========================================================================
  test('Test 16: Public responses strictly omit email, mobile, passwordHash, and documents', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?limit=10')
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(res.status, 200);
    const profiles = res.body.data.profiles;
    assert.ok(profiles.length > 0);

    for (const p of profiles) {
      assert.equal(p.email, undefined, 'Public profile leaked private email!');
      assert.equal(p.mobileNumber, undefined, 'Public profile leaked mobile number!');
      assert.equal(p.mobile_number, undefined, 'Public profile leaked mobile_number!');
      assert.equal(p.password, undefined, 'Public profile leaked password!');
      assert.equal(p.passwordHash, undefined, 'Public profile leaked passwordHash!');
      assert.equal(p.identityDocument, undefined, 'Public profile leaked identityDocument!');
      assert.equal(p.identityDocuments, undefined, 'Public profile leaked identityDocuments!');
      assert.equal(p.fullName, undefined, 'Public profile leaked legal full name!');
      assert.equal(p.full_name, undefined, 'Public profile leaked legal full_name!');
      assert.equal(p.dateOfBirth, undefined, 'Public profile leaked date of birth!');
      assert.equal(p.date_of_birth, undefined, 'Public profile leaked date_of_birth!');
      assert.ok(p.displayName, 'Public profile should have displayName');
      assert.ok(p.age, 'Public profile should have age');
    }

    // Also check GET /api/v1/users/:id when student A views student B
    const userRes = await request(app)
      .get(`/api/v1/users/${approvedKgpFemale1.id}`)
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.equal(userRes.status, 200);
    const publicUser = userRes.body.data.user;
    assert.equal(publicUser.email, undefined, 'Single user view leaked private email!');
    assert.equal(publicUser.mobileNumber, undefined, 'Single user view leaked mobile number!');
    assert.equal(publicUser.passwordHash, undefined, 'Single user view leaked password hash!');
    assert.equal(publicUser.fullName, undefined, 'Single user view leaked full legal name!');
    assert.ok(publicUser.displayName);
  });

  // =========================================================================
  // TEST 17: UNAUTHORIZED DOCUMENT ACCESS IS REJECTED
  // =========================================================================
  test('Test 17: Unauthorized student attempting to access private document is rejected', async () => {
    // Student attempting to hit admin private document endpoint
    const res = await request(app)
      .get(`/api/v1/admin/applications/test/documents/test`)
      .set('Authorization', `Bearer ${tokenKgpMale}`);

    assert.ok([401, 403].includes(res.status), 'Student token was able to access private admin document route!');
  });
});
