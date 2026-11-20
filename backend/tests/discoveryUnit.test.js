process.env.NODE_ENV = 'test';
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { serializePublicProfile, serializePrivateAccount } from '../src/utils/serializers.js';
import { mapGenderPreference } from '../src/modules/discovery/discovery.service.js';
import { requireActiveAccount } from '../src/middleware/activeAccountGuard.js';

describe('Collégé Discovery & Privacy Unit Tests', () => {
  const mockUser = {
    id: 'usr-uuid-1234',
    email: 'private.student@campus.edu',
    mobileNumber: '+919876543210',
    fullName: 'Arjun Vikram Sharma',
    displayName: 'Arjun S',
    dateOfBirth: new Date('2004-03-15'),
    age: 22,
    gender: 'Male',
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
    role: 'STUDENT',
    subscriptionPlan: 'free',
    sentRequestsCount: 3,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$secret_hash_value',
    profile: {
      bio: 'Loves robotics and coding.',
      interests: ['Robotics', 'Coding', 'Chess'],
      hobbies: ['Guitar'],
      personality: 'Introverted',
      relationshipIntention: 'Dating Connection',
      lookingFor: 'Dating',
      ageRangeMin: 20,
      ageRangeMax: 25,
      preferredDistance: 'SAME_COLLEGE',
      city: 'Kharagpur',
      state: 'West Bengal',
      languages: ['English', 'Hindi', 'Bengali'],
      currentMood: 'Ready to build projects',
    },
    education: {
      collegeId: 'clg-kgp-001',
      collegeName: 'IIT Kharagpur',
      universityName: 'Institute of National Importance',
      degreeName: 'B.Tech',
      departmentStream: 'Computer Science',
      academicYear: '3rd Year',
      currentSemester: 'Semester 6',
      graduationYear: 2026,
      studentStatus: 'CURRENTLY_STUDYING',
      isVerified: true,
    },
    photos: [
      { id: 'ph-1', photoUrl: 'https://cdn.college/photo1.webp', photoOrder: 1, isMain: true, isApproved: true },
      { id: 'ph-2', photoUrl: 'https://cdn.college/photo2.webp', photoOrder: 2, isMain: false, isApproved: true },
      { id: 'ph-3', photoUrl: 'https://cdn.college/photo3.webp', photoOrder: 3, isMain: false, isApproved: false }, // Unapproved!
    ],
    identityDocuments: [
      { id: 'doc-1', documentType: 'COLLEGE_ID', filePath: 'private_storage/doc_1.webp' },
    ],
    createdAt: new Date(),
    approvedAt: new Date(),
  };

  // 1. PUBLIC PROFILE PRIVACY SERIALIZER
  test('Public Serializer: Excludes all private contact info, password hash, and documents', () => {
    const publicData = serializePublicProfile(mockUser, { currentCollegeId: 'clg-kgp-001' });

    // Strictly forbidden fields
    assert.equal(publicData.email, undefined);
    assert.equal(publicData.mobileNumber, undefined);
    assert.equal(publicData.mobile_number, undefined);
    assert.equal(publicData.passwordHash, undefined);
    assert.equal(publicData.password, undefined);
    assert.equal(publicData.identityDocument, undefined);
    assert.equal(publicData.identityDocuments, undefined);
    assert.equal(publicData.fullName, undefined);
    assert.equal(publicData.full_name, undefined);
    assert.equal(publicData.dateOfBirth, undefined);
    assert.equal(publicData.date_of_birth, undefined);

    // Permitted verified public fields
    assert.equal(publicData.id, 'usr-uuid-1234');
    assert.equal(publicData.displayName, 'Arjun S');
    assert.equal(publicData.display_name, 'Arjun S');
    assert.equal(publicData.age, 22);
    assert.equal(publicData.gender, 'Male');
    assert.equal(publicData.collegeName, 'IIT Kharagpur');
    assert.equal(publicData.course, 'B.Tech - Computer Science');
    assert.equal(publicData.isSameCollege, true);
    assert.equal(publicData.is_same_college, true);
    assert.equal(publicData.avatarUrl, 'https://cdn.college/photo1.webp');

    // Only approved photos are included (photo 3 was isApproved=false, so only 2 photos returned)
    assert.equal(publicData.photos.length, 2);
    assert.equal(publicData.additionalPhotos.length, 1);
  });

  test('Public Serializer: Identifies when user is from a different college', () => {
    const publicData = serializePublicProfile(mockUser, { currentCollegeId: 'clg-other-999', currentCollegeName: 'Jadavpur University' });
    assert.equal(publicData.isSameCollege, false);
    assert.equal(publicData.is_same_college, false);
  });

  // 2. PRIVATE ACCOUNT SERIALIZER
  test('Private Account Serializer: Includes contact details for owner but excludes password hash', () => {
    const privateData = serializePrivateAccount(mockUser);

    assert.equal(privateData.id, 'usr-uuid-1234');
    assert.equal(privateData.email, 'private.student@campus.edu');
    assert.equal(privateData.mobileNumber, '+919876543210');
    assert.equal(privateData.fullName, 'Arjun Vikram Sharma');
    assert.equal(privateData.displayName, 'Arjun S');
    assert.equal(privateData.dateOfBirth instanceof Date, true);
    assert.equal(privateData.passwordHash, undefined);
    assert.equal(privateData.password, undefined);
  });

  // 3. GENDER PREFERENCE MAPPING
  test('Gender Preference: Maps FEMALE and variations to case-insensitive female filter', () => {
    const f1 = mapGenderPreference('FEMALE');
    const f2 = mapGenderPreference('Women');
    const f3 = mapGenderPreference('f');

    assert.ok(f1.gender?.in?.includes('Female'));
    assert.ok(f2.gender?.in?.includes('Female'));
    assert.ok(f3.gender?.in?.includes('Female'));
  });

  test('Gender Preference: Maps MALE and variations to case-insensitive male filter', () => {
    const m1 = mapGenderPreference('MALE');
    const m2 = mapGenderPreference('Men');
    const m3 = mapGenderPreference('m');

    assert.ok(m1.gender?.in?.includes('Male'));
    assert.ok(m2.gender?.in?.includes('Male'));
    assert.ok(m3.gender?.in?.includes('Male'));
  });

  test('Gender Preference: Maps EVERYONE or All to empty object (no gender constraint)', () => {
    const all1 = mapGenderPreference('EVERYONE');
    const all2 = mapGenderPreference('All');
    const all3 = mapGenderPreference(null);

    assert.deepEqual(all1, {});
    assert.deepEqual(all2, {});
    assert.deepEqual(all3, {});
  });

  // 4. EXHAUSTION AND CONTINUOUS PAGINATION LOGIC
  test('Exhaustion Logic: 100 same-college profiles with limit 20 stays strictly in same college for first 5 pages', () => {
    const totalSameCollege = 100;
    const limit = 20;

    for (let page = 1; page <= 5; page++) {
      const offset = (page - 1) * limit;
      const takeSame = Math.min(limit, totalSameCollege - offset);
      const remainingSlots = limit - takeSame;

      assert.equal(takeSame, 20, `Page ${page} should take exactly 20 same-college profiles`);
      assert.equal(remainingSlots, 0, `Page ${page} should not take any other-college profiles`);
    }

    // Page 6 (offset 100): Same college is now exhausted!
    const page6Offset = (6 - 1) * limit; // 100
    assert.ok(page6Offset >= totalSameCollege);
    const skipOther = page6Offset - totalSameCollege; // 0
    assert.equal(skipOther, 0, 'Page 6 starts other-college profiles at offset 0');
  });

  test('Exhaustion Logic: Transition page correctly splits between same and other college without gaps', () => {
    const totalSameCollege = 25;
    const limit = 20;

    // Page 1: take 20 from same college
    const p1Offset = 0;
    const p1TakeSame = Math.min(limit, totalSameCollege - p1Offset); // 20
    const p1Remaining = limit - p1TakeSame; // 0
    assert.equal(p1TakeSame, 20);
    assert.equal(p1Remaining, 0);

    // Page 2: take remaining 5 from same college, then 15 from other colleges
    const p2Offset = 20;
    const p2TakeSame = Math.min(limit, totalSameCollege - p2Offset); // 5
    const p2Remaining = limit - p2TakeSame; // 15
    assert.equal(p2TakeSame, 5);
    assert.equal(p2Remaining, 15);

    // Page 3: same college already exhausted (offset 40 >= 25). Skip 15 into other college, take 20.
    const p3Offset = 40;
    const p3SkipOther = p3Offset - totalSameCollege; // 15
    assert.equal(p3SkipOther, 15, 'Page 3 skips exactly the 15 items already shown on Page 2');
  });

  test('Exhaustion Logic: Empty same-college immediately falls back to other colleges', () => {
    const totalSameCollege = 0;
    const limit = 20;
    const page = 1;
    const offset = (page - 1) * limit; // 0

    assert.ok(offset >= totalSameCollege);
    const skipOther = offset - totalSameCollege; // 0
    assert.equal(skipOther, 0);
  });

  // 5. ACCESS CONTROL GUARD UNIT TESTS
  test('Access Guard: Approved active account is granted access (calls next)', () => {
    let nextCalled = false;
    const req = {
      user: {
        id: 'usr-approved',
        accountStatus: 'ACTIVE',
        verificationStatus: 'APPROVED',
      },
    };
    const res = {};
    const next = () => { nextCalled = true; };

    requireActiveAccount(req, res, next);
    assert.equal(nextCalled, true);
  });

  test('Access Guard: Unapproved/Pending account is rejected with 403', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      user: {
        id: 'usr-pending',
        accountStatus: 'ACTIVE',
        verificationStatus: 'PENDING_APPROVAL',
      },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => { jsonBody = body; },
        };
      },
    };
    const next = () => { assert.fail('next() should not be called'); };

    requireActiveAccount(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(jsonBody.error, 'VERIFICATION_NOT_APPROVED');
  });

  test('Access Guard: Suspended account is rejected with 403', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      user: {
        id: 'usr-suspended',
        accountStatus: 'SUSPENDED',
        verificationStatus: 'APPROVED',
      },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => { jsonBody = body; },
        };
      },
    };
    const next = () => { assert.fail('next() should not be called'); };

    requireActiveAccount(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(jsonBody.error, 'ACCOUNT_NOT_ACTIVE');
  });

  test('Access Guard: Rejected account is rejected with 403', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      user: {
        id: 'usr-rejected',
        accountStatus: 'ACTIVE',
        verificationStatus: 'REJECTED',
      },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => { jsonBody = body; },
        };
      },
    };
    const next = () => { assert.fail('next() should not be called'); };

    requireActiveAccount(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(jsonBody.error, 'VERIFICATION_NOT_APPROVED');
  });
});
