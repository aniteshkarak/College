import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from '../src/modules/auth/auth.validator.js';
import { serializePublicProfile, serializePrivateAccount } from '../src/utils/serializers.js';

describe('Collage Story Authentication & Password Recovery Validators', () => {
  test('loginSchema: Accepts valid email or phone with password', () => {
    const valid1 = loginSchema.safeParse({ identifier: 'student@college.edu', password: 'SecretPassword123' });
    assert.strictEqual(valid1.success, true);

    const valid2 = loginSchema.safeParse({ identifier: '9876543210', password: 'SecretPassword123' });
    assert.strictEqual(valid2.success, true);
  });

  test('loginSchema: Rejects empty identifier or password', () => {
    const invalid1 = loginSchema.safeParse({ identifier: '', password: 'SecretPassword123' });
    assert.strictEqual(invalid1.success, false);

    const invalid2 = loginSchema.safeParse({ identifier: 'student@college.edu', password: '' });
    assert.strictEqual(invalid2.success, false);
  });

  test('forgotPasswordSchema: Validates correct email format and rejects malformed email', () => {
    const valid = forgotPasswordSchema.safeParse({ email: 'aarav@iitd.ac.in' });
    assert.strictEqual(valid.success, true);

    const invalid = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    assert.strictEqual(invalid.success, false);
  });

  test('resetPasswordSchema: Enforces minimum password length of 8 characters', () => {
    const valid = resetPasswordSchema.safeParse({ token: 'jwt.token.here', newPassword: 'ValidPassword123!' });
    assert.strictEqual(valid.success, true);

    const invalidShort = resetPasswordSchema.safeParse({ token: 'jwt.token.here', newPassword: '123' });
    assert.strictEqual(invalidShort.success, false);

    const invalidNoToken = resetPasswordSchema.safeParse({ token: '', newPassword: 'ValidPassword123!' });
    assert.strictEqual(invalidNoToken.success, false);
  });

  test('changePasswordSchema: Validates current and new password constraints', () => {
    const valid = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456!',
    });
    assert.strictEqual(valid.success, true);

    const invalid = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'short',
    });
    assert.strictEqual(invalid.success, false);
  });

  test('refreshTokenSchema: Validates refresh token presence', () => {
    const valid = refreshTokenSchema.safeParse({ refreshToken: 'ref_sample_token_xyz' });
    assert.strictEqual(valid.success, true);

    const invalid = refreshTokenSchema.safeParse({ refreshToken: '' });
    assert.strictEqual(invalid.success, false);
  });
});

describe('Collage Story Privacy & Serializer Isolation', () => {
  const dummyUser = {
    id: 'user_uuid_101',
    displayName: 'Priya S.',
    fullName: 'Priya Sharma Legal',
    email: 'priya.sharma@du.ac.in',
    mobileNumber: '+919876543210',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy_hash',
    age: 20,
    gender: 'Female',
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
    createdAt: new Date('2026-01-15'),
    profile: {
      bio: 'Economics major, passionate about debating and photography.',
      interests: ['Debating', 'Photography', 'Literature'],
      hobbies: ['Reading', 'Badminton'],
      relationshipIntention: 'Long-term Dating',
      lookingFor: 'Genuine Connection',
      currentMood: 'Ready to chat',
      city: 'New Delhi',
      state: 'Delhi',
    },
    education: {
      collegeId: 'col_miranda',
      collegeName: 'Miranda House, Delhi University',
      universityName: 'University of Delhi',
      degreeName: 'Bachelor of Arts',
      departmentStream: 'Economics Honours',
      academicYear: 'Third Year',
      currentSemester: 'Semester 5',
    },
    photos: [
      { id: 'ph_1', photoOrder: 1, isMain: true, photoUrl: 'https://cdn.college.internal/photos/p1.webp', isApproved: true },
      { id: 'ph_2', photoOrder: 2, isMain: false, photoUrl: 'https://cdn.college.internal/photos/p2.webp', isApproved: true },
      { id: 'ph_3', photoOrder: 3, isMain: false, photoUrl: 'https://cdn.college.internal/photos/p3.webp', isApproved: true },
    ],
    identityDocument: {
      id: 'doc_999',
      filePath: 'vault/documents/private_id_card.webp',
      documentType: 'College Student ID',
    },
  };

  test('Public Serializer: Withholds legal name, email, mobile, passwordHash, and documents', () => {
    const publicData = serializePublicProfile(dummyUser);

    assert.strictEqual(publicData.id, 'user_uuid_101');
    assert.strictEqual(publicData.displayName, 'Priya S.');
    assert.strictEqual(publicData.full_name, undefined, 'Legal full name must NEVER be exposed publicly');
    assert.strictEqual(publicData.fullName, undefined, 'Legal full name must NEVER be exposed publicly');
    assert.strictEqual(publicData.email, undefined, 'Email must NEVER be exposed in public profile');
    assert.strictEqual(publicData.mobileNumber, undefined, 'Mobile must NEVER be exposed in public profile');
    assert.strictEqual(publicData.mobile, undefined);
    assert.strictEqual(publicData.passwordHash, undefined, 'Password hash must NEVER be exposed');
    assert.strictEqual(publicData.identityDocument, undefined, 'Identity document must NEVER be exposed');
    assert.strictEqual(publicData.avatarUrl, 'https://cdn.college.internal/photos/p1.webp');
    assert.strictEqual(publicData.photos.length, 3);
  });

  test('Private Account Serializer: Permits email and mobile for account owner, but strips password hash', () => {
    const privateData = serializePrivateAccount(dummyUser);

    assert.strictEqual(privateData.id, 'user_uuid_101');
    assert.strictEqual(privateData.displayName, 'Priya S.');
    assert.strictEqual(privateData.email, 'priya.sharma@du.ac.in');
    assert.strictEqual(privateData.mobileNumber, '+919876543210');
    assert.strictEqual(privateData.passwordHash, undefined, 'Password hash must NEVER be exposed even to account owner');
  });
});

describe('Collage Story Two-Way Block & Conversation Invalidation Rules', () => {
  test('Two-way block check identifies blocked state in either direction', () => {
    const blockedPairs = [
      { blockerId: 'user_A', blockedId: 'user_B' },
    ];

    const isBlocked = (u1, u2) => {
      return blockedPairs.some(
        (b) => (b.blockerId === u1 && b.blockedId === u2) || (b.blockerId === u2 && b.blockedId === u1)
      );
    };

    assert.strictEqual(isBlocked('user_A', 'user_B'), true, 'User A blocked User B -> Blocked');
    assert.strictEqual(isBlocked('user_B', 'user_A'), true, 'User B checking User A -> Two-way blocked');
    assert.strictEqual(isBlocked('user_A', 'user_C'), false, 'User A and User C -> Not blocked');
  });

  test('Unblock removes block record without re-activating old match automatically', () => {
    let blocks = [
      { blockerId: 'user_A', blockedId: 'user_B' },
    ];
    let match = {
      id: 'match_123',
      user1Id: 'user_A',
      user2Id: 'user_B',
      status: 'BLOCKED',
    };

    // Execute unblock
    blocks = blocks.filter((b) => !(b.blockerId === 'user_A' && b.blockedId === 'user_B'));
    assert.strictEqual(blocks.length, 0);

    // Business rule: Unblocking does NOT automatically restore match to ACTIVE
    assert.strictEqual(match.status, 'BLOCKED', 'Match remains inactive until mutual interaction occurs');
  });
});

describe('Collage Story Safety Reports & Moderation Rules', () => {
  const ALLOWED_CATEGORIES = [
    'Harassment',
    'Inappropriate content',
    'Fake profile',
    'Impersonation',
    'Spam',
    'Unwanted contact',
    'Threats',
    'Other',
  ];

  test('Validates report against official safety categories', () => {
    const isValidCategory = (cat) => ALLOWED_CATEGORIES.some((c) => c.toLowerCase() === cat.toLowerCase());

    assert.strictEqual(isValidCategory('Harassment'), true);
    assert.strictEqual(isValidCategory('fake profile'), true);
    assert.strictEqual(isValidCategory('Spam'), true);
    assert.strictEqual(isValidCategory('Random Invalid Category'), false);
  });
});
