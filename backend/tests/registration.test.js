import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';

after(async () => {
  await prisma.$disconnect().catch(() => {});
  try {
    redis.disconnect();
  } catch {}
});

const sampleApplicant = {
  legalName: 'Debolina Bose',
  displayName: 'Debolina',
  dateOfBirth: '2003-08-25',
  email: `test_debolina_${Date.now()}@gmail.com`,
  mobileNumber: '9831987654',
  gender: 'Female',
  city: 'Kolkata',
  state: 'West Bengal',
  languagesSpoken: ['English', 'Bengali', 'Hindi'],
  password: 'Password@2026',

  // Step 2 College
  collegeName: 'Jadavpur University',
  universityName: 'Jadavpur University',
  degreeName: 'M.A. English Literature',
  departmentStream: 'Arts & Humanities',
  academicYear: '1st Year Master',
  graduationYear: 2026,
  studentStatus: 'CURRENTLY_STUDYING',

  // Step 3 Document
  documentType: 'COLLEGE_ID',
  documentUrl: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba',

  // Step 4 Exactly 3 Photographs
  photo1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  photo2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
  photo3: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',

  // Step 5 About & Preferences
  bio: 'Literature scholar, avid reader, coffee enthusiast. Excited to connect with campus peers across India!',
  interests: ['Reading', 'Debating', 'Music'],
  hobbies: ['Poetry', 'Cafe hopping'],
  lookingFor: 'Friendship',
  ageRangeMin: 18,
  ageRangeMax: 26,
  preferredDistance: 'ANYWHERE_INDIA',

  // Step 6 Consents
  termsAccepted: true,
  privacyAccepted: true,
  ageConfirmed18Plus: true,
  verificationConsent: true,
};

test('Registration: Searchable colleges endpoint returns institutions', async () => {
  const res = await request(app).get('/api/v1/registration/colleges?q=Xavier');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data.colleges));
  assert.ok(res.body.data.colleges.length > 0);
  assert.ok(res.body.data.colleges[0].name.includes('Xavier'));
});

test('Registration: Under-18 applicant is rejected server-side', async () => {
  const minorApplicant = {
    ...sampleApplicant,
    email: `minor_${Date.now()}@gmail.com`,
    mobileNumber: '9831999999',
    dateOfBirth: '2012-01-01', // Under 18
  };

  const res = await request(app)
    .post('/api/v1/registration/submit')
    .send(minorApplicant);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('Registration: Missing photo (fewer than 3 photos) is rejected', async () => {
  const incompletePhotos = {
    ...sampleApplicant,
    email: `nophoto_${Date.now()}@gmail.com`,
    mobileNumber: '9831888888',
    photo3: '', // Missing 3rd photo
  };

  const res = await request(app)
    .post('/api/v1/registration/submit')
    .send(incompletePhotos);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('Registration: Missing identity document is rejected', async () => {
  const missingDoc = {
    ...sampleApplicant,
    email: `nodoc_${Date.now()}@gmail.com`,
    mobileNumber: '9831777777',
    documentUrl: '', // Missing ID document
  };

  const res = await request(app)
    .post('/api/v1/registration/submit')
    .send(missingDoc);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('Access Control: Unauthenticated or non-active applicant cannot access discovery', async () => {
  const res = await request(app).get('/api/v1/discovery');
  // Should be blocked by requireActiveAccount / authentication
  assert.ok(res.status === 401 || res.status === 403);
});
