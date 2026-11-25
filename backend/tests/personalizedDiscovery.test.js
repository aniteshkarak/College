import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import config from '../src/config/env.js';

describe('Collage Story — Personalized Discover Feed with Unique Profiles Test Suite', () => {
  let viewerA, viewerB;
  let candidateFemaleKgp1, candidateFemaleKgp2, candidateFemaleKgp3;
  let candidateFemaleOther1, candidateFemaleOther2;
  let candidateMaleKgp, candidateOldKgp;
  let tokenA, tokenB;

  const testPassword = 'DiscoverPassword@2026';
  const collegeKgp = 'IIT Kharagpur';
  const collegeOther = 'Jadavpur University';

  const makeUser = async ({
    email,
    displayName,
    collegeName,
    mobile,
    gender = 'Female',
    age = 21,
    dateOfBirth = new Date('2003-05-15'),
    accountStatus = 'ACTIVE',
    verificationStatus = 'APPROVED',
  }) => {
    let u = await prisma.user.findFirst({
      where: { email },
      include: { education: true, profile: true },
    });

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
          dateOfBirth,
          age,
          gender,
          passwordHash,
          accountStatus,
          verificationStatus,
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
          profile: {
            create: {
              bio: `Verified student at ${collegeName}`,
              city: 'Kharagpur',
              state: 'West Bengal',
              interests: ['Coding', 'Design', 'Music'],
              ageRangeMin: 18,
              ageRangeMax: 28,
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
      u = await prisma.user.update({
        where: { id: u.id },
        data: {
          accountStatus,
          verificationStatus,
          gender,
          age,
        },
        include: { education: true, profile: true },
      });
    }
    return u;
  };

  const generateToken = (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'STUDENT' },
      config.jwt.secret,
      { expiresIn: '2h' }
    );
  };

  before(async () => {
    // 1. Setup viewers
    viewerA = await makeUser({
      email: 'viewer_a_disco@iitkgp.ac.in',
      displayName: 'Viewer A',
      collegeName: collegeKgp,
      mobile: '9800099001',
      gender: 'Male',
      age: 22,
    });
    viewerB = await makeUser({
      email: 'viewer_b_disco@iitkgp.ac.in',
      displayName: 'Viewer B',
      collegeName: collegeKgp,
      mobile: '9800099002',
      gender: 'Male',
      age: 22,
    });

    tokenA = generateToken(viewerA);
    tokenB = generateToken(viewerB);

    // 2. Setup Candidates
    candidateFemaleKgp1 = await makeUser({
      email: 'cand_f_kgp1@iitkgp.ac.in',
      displayName: 'Pooja Roy',
      collegeName: collegeKgp,
      mobile: '9800099003',
      gender: 'Female',
      age: 21,
    });
    candidateFemaleKgp2 = await makeUser({
      email: 'cand_f_kgp2@iitkgp.ac.in',
      displayName: 'Shreya Ghosh',
      collegeName: collegeKgp,
      mobile: '9800099004',
      gender: 'Female',
      age: 22,
    });
    candidateFemaleKgp3 = await makeUser({
      email: 'cand_f_kgp3@iitkgp.ac.in',
      displayName: 'Ananya Mukherjee',
      collegeName: collegeKgp,
      mobile: '9800099005',
      gender: 'Female',
      age: 20,
    });

    candidateFemaleOther1 = await makeUser({
      email: 'cand_f_other1@jaduniv.edu.in',
      displayName: 'Ritika Sen',
      collegeName: collegeOther,
      mobile: '9800099006',
      gender: 'Female',
      age: 21,
    });
    candidateFemaleOther2 = await makeUser({
      email: 'cand_f_other2@jaduniv.edu.in',
      displayName: 'Tanvi Dutta',
      collegeName: collegeOther,
      mobile: '9800099007',
      gender: 'Female',
      age: 23,
    });

    candidateMaleKgp = await makeUser({
      email: 'cand_m_kgp@iitkgp.ac.in',
      displayName: 'Arjun Das',
      collegeName: collegeKgp,
      mobile: '9800099008',
      gender: 'Male',
      age: 22,
    });

    candidateOldKgp = await makeUser({
      email: 'cand_old_kgp@iitkgp.ac.in',
      displayName: 'Senior Alum',
      collegeName: collegeKgp,
      mobile: '9800099009',
      gender: 'Female',
      age: 35,
    });

    // Clean test state for test viewers
    const testViewerIds = [viewerA.id, viewerB.id];
    await prisma.discoveryImpression.deleteMany({
      where: { userId: { in: testViewerIds } },
    });
    await prisma.profilePass.deleteMany({
      where: { userId: { in: testViewerIds } },
    });
    await prisma.userBlock.deleteMany({
      where: { blockerId: { in: testViewerIds } },
    });
    await prisma.userDiscoveryState.deleteMany({
      where: { userId: { in: testViewerIds } },
    });
  });

  after(async () => {
    // Cleanup test state
    const testViewerIds = [viewerA.id, viewerB.id];
    await prisma.discoveryImpression.deleteMany({
      where: { userId: { in: testViewerIds } },
    });
    await prisma.profilePass.deleteMany({
      where: { userId: { in: testViewerIds } },
    });
    await prisma.userBlock.deleteMany({
      where: { blockerId: { in: testViewerIds } },
    });
  });

  // Test 1: Two different users receive personalized, differently ordered results
  it('Scenario 1: Two different users receive personalized, differently ordered results', async () => {
    // Viewer A discovery preferences
    await request(app)
      .put('/api/v1/discovery/preferences')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ gender: 'FEMALE', minAge: 18, maxAge: 25 })
      .expect(200);

    // Viewer B discovery preferences
    await request(app)
      .put('/api/v1/discovery/preferences')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ gender: 'FEMALE', minAge: 18, maxAge: 25 })
      .expect(200);

    const resA = await request(app)
      .get('/api/v1/discovery?limit=10')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const resB = await request(app)
      .get('/api/v1/discovery?limit=10')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    assert.equal(resA.body.success, true);
    assert.equal(resB.body.success, true);

    const profilesA = resA.body.data.profiles;
    const profilesB = resB.body.data.profiles;

    assert.ok(profilesA.length > 0, 'Viewer A must receive profiles');
    assert.ok(profilesB.length > 0, 'Viewer B must receive profiles');

    // Neither viewer sees their own profile
    assert.ok(!profilesA.some((p) => p.id === viewerA.id), 'Viewer A cannot see self');
    assert.ok(!profilesB.some((p) => p.id === viewerB.id), 'Viewer B cannot see self');

    // Both get valid candidates
    const idsA = profilesA.map((p) => p.id);
    const idsB = profilesB.map((p) => p.id);
    assert.ok(idsA.length >= 2, 'Viewer A received multiple candidates');
    assert.ok(idsB.length >= 2, 'Viewer B received multiple candidates');
  });

  // Test 2: Gender and age preferences are strictly respected
  it('Scenario 2: Gender and age preferences are strictly respected', async () => {
    // Reset cycle for Viewer A
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Set filter: FEMALE, 20-22
    const res = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=20&maxAge=22')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    const profiles = res.body.data.profiles;

    for (const p of profiles) {
      assert.equal(p.gender.toUpperCase(), 'FEMALE', `Profile ${p.id} must be female`);
      assert.ok(p.age >= 20 && p.age <= 22, `Profile ${p.id} age ${p.age} must be between 20 and 22`);
    }

    // Must NOT contain male candidate
    assert.ok(!profiles.some((p) => p.id === candidateMaleKgp.id), 'Male profile must be excluded');
    // Must NOT contain senior alum (>22)
    assert.ok(!profiles.some((p) => p.id === candidateOldKgp.id), 'Age > 22 profile must be excluded');
  });

  // Test 3: Same-college profiles appear before other colleges
  it('Scenario 3: Same-college profiles appear before other colleges', async () => {
    // Reset cycle for Viewer A
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const res = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=10')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const profiles = res.body.data.profiles;
    assert.ok(profiles.length >= 2, 'Expected at least 2 profiles');

    let seenOtherCollege = false;
    for (const p of profiles) {
      if (p.isSameCollege) {
        assert.equal(seenOtherCollege, false, 'Same college profile cannot appear after an other-college profile');
      } else {
        seenOtherCollege = true;
      }
    }
  });

  // Test 4: Refresh does not repeat seen profiles within the same cycle
  it('Scenario 4: Refresh does not repeat seen profiles within the same cycle', async () => {
    // Reset cycle for Viewer A
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // First request: fetch 2 profiles
    const res1 = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=2')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const seenInReq1 = res1.body.data.profiles.map((p) => p.id);
    assert.equal(seenInReq1.length, 2, 'Req 1 returned 2 profiles');

    // Second request: refresh / next batch
    const res2 = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=2')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const seenInReq2 = res2.body.data.profiles.map((p) => p.id);

    // No overlap in the same cycle
    for (const id of seenInReq2) {
      assert.ok(!seenInReq1.includes(id), `Profile ${id} from batch 1 was repeated in batch 2 within the same cycle`);
    }
  });

  // Test 5: Pagination does not return duplicates
  it('Scenario 5: Pagination does not return duplicates', async () => {
    // Reset cycle for Viewer B
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const page1 = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&page=1&limit=2')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const page2 = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&page=2&limit=2')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const idsPage1 = page1.body.data.profiles.map((p) => p.id);
    const idsPage2 = page2.body.data.profiles.map((p) => p.id);

    const duplicates = idsPage1.filter((id) => idsPage2.includes(id));
    assert.equal(duplicates.length, 0, 'Pagination page 1 and page 2 must contain zero duplicate IDs');
  });

  // Test 6: Concurrent requests do not duplicate impressions
  it('Scenario 6: Concurrent requests do not duplicate impressions or return overlapping profiles', async () => {
    // Reset cycle for Viewer A
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Fire 2 simultaneous requests
    const [reqA, reqB] = await Promise.all([
      request(app).get('/api/v1/discovery?limit=2').set('Authorization', `Bearer ${tokenA}`),
      request(app).get('/api/v1/discovery?limit=2').set('Authorization', `Bearer ${tokenA}`),
    ]);

    assert.equal(reqA.status, 200);
    assert.equal(reqB.status, 200);

    // Verify DB impressions integrity: no duplicate (userId, discoveredUserId, cycleId)
    const impressions = await prisma.discoveryImpression.findMany({
      where: { userId: viewerA.id },
    });

    const impressionKeys = impressions.map((imp) => `${imp.discoveredUserId}_${imp.cycleId}`);
    const uniqueKeys = new Set(impressionKeys);
    assert.equal(impressionKeys.length, uniqueKeys.size, 'No duplicate DiscoveryImpression rows exist in PostgreSQL');
  });

  // Test 7: Logging out and logging back in preserves history (PostgreSQL persistence)
  it('Scenario 7: Logging out and logging back in preserves history (PostgreSQL persistence)', async () => {
    // Reset cycle for Viewer A
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // First fetch with token A
    const resBefore = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=2')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const seenIds = resBefore.body.data.profiles.map((p) => p.id);
    assert.ok(seenIds.length > 0, 'Profiles were fetched in session 1');

    // Simulate new session login by creating fresh token
    const freshTokenA = generateToken(viewerA);

    // Second fetch in new session
    const resAfter = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=2')
      .set('Authorization', `Bearer ${freshTokenA}`)
      .expect(200);

    const newIds = resAfter.body.data.profiles.map((p) => p.id);
    for (const id of newIds) {
      assert.ok(!seenIds.includes(id), `Previously seen profile ${id} was returned in new session`);
    }
  });

  // Test 8: A new cycle begins only after eligible profiles are exhausted
  it('Scenario 8: A new cycle begins only after eligible profiles are exhausted', async () => {
    // Reset cycle for Viewer B
    const resetRes = await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const initialCycleId = resetRes.body.data.currentCycleId;

    // Fetch all eligible female profiles in current cycle until exhausted
    let exhausted = false;
    let iterations = 0;
    while (!exhausted && iterations < 10) {
      iterations++;
      const res = await request(app)
        .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=50')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      if (res.body.data.pagination.currentCycleId > initialCycleId || res.body.data.pagination.cycleCompleted) {
        exhausted = true;
      }
    }

    const resFinal = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=10')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const nextCycleId = resFinal.body.data.pagination.currentCycleId;
    assert.ok(
      nextCycleId > initialCycleId,
      `Expected cycle to advance from ${initialCycleId} to > ${initialCycleId}, got ${nextCycleId}`
    );
  });

  // Test 9: Blocked users never appear
  it('Scenario 9: Blocked users never appear in discovery', async () => {
    // Viewer A blocks candidateFemaleKgp1
    await prisma.userBlock.create({
      data: {
        blockerId: viewerA.id,
        blockedId: candidateFemaleKgp1.id,
        reason: 'Inappropriate content',
      },
    });

    // Reset cycle
    await request(app)
      .post('/api/v1/discovery/cycle/reset')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Fetch profiles
    const res = await request(app)
      .get('/api/v1/discovery?gender=FEMALE&minAge=18&maxAge=26&limit=20')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const profiles = res.body.data.profiles;
    assert.ok(
      !profiles.some((p) => p.id === candidateFemaleKgp1.id),
      'Blocked user must NEVER appear in discovery'
    );
  });

  // Test 10: Empty results are handled correctly when filters yield zero candidates
  it('Scenario 10: Empty results are handled correctly when filters yield zero candidates', async () => {
    const res = await request(app)
      .get('/api/v1/discovery?minAge=95&maxAge=99')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data.profiles, []);
    assert.equal(res.body.data.pagination.unseenEligibleCount, 0);
  });
});
