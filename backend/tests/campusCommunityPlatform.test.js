import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { io as ioc } from 'socket.io-client';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import config from '../src/config/env.js';
import { initSocketServer, closeSocketServer } from '../src/services/socketService.js';

describe('Collage Story — Campus Community Platform & College Isolation Audit Suite', () => {
  let testServer, socketPort;
  let studentA, studentB, studentC, superAdmin;
  let tokenA, tokenB, tokenC, tokenAdmin;
  let socketA, socketB, socketC;

  const testPassword = 'CampusPassword@2026';
  const collegeDTU = 'Delhi Technological University';
  const collegeIITB = 'Indian Institute of Technology Bombay';

  const makeUser = async (email, displayName, collegeName, mobile) => {
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
          dateOfBirth: new Date('2003-05-15'),
          age: 21,
          gender: 'Male',
          passwordHash,
          accountStatus: 'ACTIVE',
          verificationStatus: 'APPROVED',
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
              city: 'New Delhi',
              state: 'Delhi',
              interests: ['Campus', 'Community'],
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
    }
    return u;
  };

  before(async () => {
    // 0. Start test server with Socket.IO
    testServer = http.createServer(app);
    await initSocketServer(testServer, app);
    await new Promise((resolve) => testServer.listen(0, resolve));
    socketPort = testServer.address().port;

    // 1. Cleanup old test users & related records
    const testEmails = [
      'comm_dtu_a@test.collagestory.internal',
      'comm_iitb_b@test.collagestory.internal',
      'comm_dtu_c@test.collagestory.internal',
      'comm_quota@test.collagestory.internal',
    ];

    await prisma.userBlock.deleteMany({
      where: {
        OR: [
          { blocker: { email: { in: testEmails } } },
          { blocked: { email: { in: testEmails } } },
        ],
      },
    }).catch(() => {});

    await prisma.postComment.deleteMany({
      where: { author: { email: { in: testEmails } } },
    }).catch(() => {});

    await prisma.postLike.deleteMany({
      where: { user: { email: { in: testEmails } } },
    }).catch(() => {});

    await prisma.savedPost.deleteMany({
      where: { user: { email: { in: testEmails } } },
    }).catch(() => {});

    await prisma.campusAnnouncement.deleteMany({
      where: { author: { email: { in: testEmails } } },
    }).catch(() => {});

    await prisma.campusEvent.deleteMany({
      where: { author: { email: { in: testEmails } } },
    }).catch(() => {});

    await prisma.report.deleteMany({
      where: {
        OR: [
          { reporter: { email: { in: testEmails } } },
          { reportedUser: { email: { in: testEmails } } },
        ],
      },
    }).catch(() => {});

    await prisma.userSession.deleteMany({
      where: { user: { email: { in: testEmails } } },
    }).catch(() => {});

    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    }).catch(() => {});

    // 2. Create Student A (DTU), Student B (IITB), Student C (DTU)
    studentA = await makeUser('comm_dtu_a@test.collagestory.internal', 'Aarav Sharma', collegeDTU, '+919876543101');
    studentB = await makeUser('comm_iitb_b@test.collagestory.internal', 'Rohan Mehta', collegeIITB, '+919876543102');
    studentC = await makeUser('comm_dtu_c@test.collagestory.internal', 'Priya Verma', collegeDTU, '+919876543103');

    // 3. Generate Student Tokens
    tokenA = jwt.sign(
      { sub: studentA.id, id: studentA.id, email: studentA.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
    );

    tokenB = jwt.sign(
      { sub: studentB.id, id: studentB.id, email: studentB.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
    );

    tokenC = jwt.sign(
      { sub: studentC.id, id: studentC.id, email: studentC.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
    );

    // 4. Create / Retrieve Admin User & Obtain Legitimate Admin Token
    const adminPasswordHash = await argon2.hash(testPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    superAdmin = await prisma.admin.findFirst({ where: { roleName: 'SUPER_ADMIN' } });
    if (!superAdmin) {
      superAdmin = await prisma.admin.create({
        data: {
          email: 'comm_superadmin@test.collagestory.internal',
          fullName: 'Campus Super Admin',
          roleName: 'SUPER_ADMIN',
          passwordHash: adminPasswordHash,
          isActive: true,
        },
      });
    } else {
      await prisma.admin.update({
        where: { id: superAdmin.id },
        data: { passwordHash: adminPasswordHash, isActive: true },
      });
    }

    const adminLoginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: superAdmin.email,
        password: testPassword,
      });

    tokenAdmin = adminLoginRes.body?.data?.token;
  });

  after(async () => {
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    if (socketC) socketC.disconnect();
    await closeSocketServer();
    if (testServer) await new Promise((resolve) => testServer.close(resolve));
  });

  let createdPostAId = null;
  let createdEventAId = null;

  // -------------------------------------------------------------
  // SECTION 1: POST CREATION & CATEGORIES
  // -------------------------------------------------------------
  describe('1. Post Creation & Support for Diverse Post Types', () => {
    it('allows Student A (DTU) to create a standard discussion post (POST)', async () => {
      const res = await request(app)
        .post('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'DTU Robotics Club Auditions',
          content: 'Join the robotics club for the upcoming Asia Pacific Tech Fest at DTU!',
          category: 'Campus Club',
          postType: 'POST',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      const post = res.body.data.post || res.body.data.announcement;
      assert.ok(post.id);
      assert.strictEqual(post.postType, 'POST');
      assert.strictEqual(post.collegeName, collegeDTU);
      assert.strictEqual(post.author.displayName, 'Aarav Sharma');
      assert.strictEqual(post.likesCount, 0);
      assert.strictEqual(post.commentsCount, 0);
      createdPostAId = post.id;
    });

    it('allows Student A to create a QUESTION post', async () => {
      const res = await request(app)
        .post('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Best electives for 5th semester IT/CSE?',
          content: 'Can seniors advise between Cloud Computing and Distributed Systems electives?',
          category: 'Academic Notice',
          postType: 'QUESTION',
        });

      assert.strictEqual(res.status, 201);
      const post = res.body.data.post || res.body.data.announcement;
      assert.strictEqual(post.postType, 'QUESTION');
    });

    it('allows Student A to create a STUDY GROUP post', async () => {
      const res = await request(app)
        .post('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'DSA Study Group for Summer Internships',
          content: 'Meeting daily at Central Library 3rd floor at 5 PM to solve LeetCode medium questions.',
          category: 'General',
          postType: 'STUDY',
        });

      assert.strictEqual(res.status, 201);
      const post = res.body.data.post || res.body.data.announcement;
      assert.strictEqual(post.postType, 'STUDY');
    });
  });

  // -------------------------------------------------------------
  // SECTION 2: STRICT COLLEGE ISOLATION
  // -------------------------------------------------------------
  describe('2. Strict College-Based Community Isolation', () => {
    it('DTU peer (Student C) sees DTU posts in their college feed', async () => {
      const res = await request(app)
        .get('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.collegeName, collegeDTU);
      const posts = res.body.data.posts || res.body.data.announcements;
      assert.ok(posts.length >= 3);
      assert.ok(posts.some((p) => p.id === createdPostAId));
    });

    it('IIT Bombay student (Student B) CANNOT see any DTU posts in their feed', async () => {
      const res = await request(app)
        .get('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenB}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.collegeName, collegeIITB);
      const posts = res.body.data.posts || res.body.data.announcements;
      const hasDTUPost = posts.some((p) => p.collegeName === collegeDTU || p.id === createdPostAId);
      assert.strictEqual(hasDTUPost, false);
    });

    it('IIT Bombay student attempting GET /campus/posts/:id on DTU post returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/campus/posts/${createdPostAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /own college only/i);
    });

    it('IIT Bombay student attempting to comment on DTU post returns 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/comments`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'Cross-college intruder comment' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    it('IIT Bombay student attempting to like DTU post returns 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/like`)
        .set('Authorization', `Bearer ${tokenB}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });
  });

  // -------------------------------------------------------------
  // SECTION 3: DAILY 5-ANNOUNCEMENT LIMIT RULES
  // -------------------------------------------------------------
  describe('3. Selective 5-per-day Limit Enforcement (Asia/Kolkata)', () => {
    it('discussion posts and questions do NOT consume the 5-announcement daily limit', async () => {
      for (let i = 1; i <= 6; i++) {
        const res = await request(app)
          .post('/api/v1/campus/posts')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            title: `Discussion topic ${i} about AI and Robotics`,
            content: `Detailed points regarding ethical AI development - discussion ${i}.`,
            category: 'General',
            postType: 'POST',
          });
        assert.strictEqual(res.status, 201, `Discussion ${i} should succeed without consuming announcement quota`);
      }
    });

    it('official announcements respect 5-per-day limit and block the 6th with 429', async () => {
      const quotaStudent = await makeUser('comm_quota@test.collagestory.internal', 'Quota Tester', collegeDTU, '+919876543109');
      const qToken = jwt.sign(
        { sub: quotaStudent.id, id: quotaStudent.id, email: quotaStudent.email, role: 'STUDENT', accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
        config.jwt.secret,
        { expiresIn: '2h', issuer: 'college-api', audience: 'college-mobile-web' }
      );

      // Post 5 announcements
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/v1/campus/announcements')
          .set('Authorization', `Bearer ${qToken}`)
          .send({
            title: `Official College Notice #${i}`,
            content: `Important announcement regarding semester registration phase ${i}.`,
            category: 'Academic Notice',
            postType: 'ANNOUNCEMENT',
            isUrgent: true,
          });

        assert.strictEqual(res.status, 201, `Announcement ${i} should succeed`);
      }

      // 6th announcement should fail with 429
      const sixthRes = await request(app)
        .post('/api/v1/campus/announcements')
        .set('Authorization', `Bearer ${qToken}`)
        .send({
          title: 'Official Notice #6 - Over Quota',
          content: 'This announcement should exceed today quota.',
          category: 'Academic Notice',
          postType: 'ANNOUNCEMENT',
        });

      assert.strictEqual(sixthRes.status, 429);
      assert.match(sixthRes.body.message, /daily announcement limit/i);

      // Cleanup quota test user
      await prisma.campusAnnouncement.deleteMany({ where: { authorId: quotaStudent.id } });
      await prisma.userSession.deleteMany({ where: { userId: quotaStudent.id } });
      await prisma.user.delete({ where: { id: quotaStudent.id } });
    });
  });

  // -------------------------------------------------------------
  // SECTION 4: LIKES & IDEMPOTENT DUPLICATE PREVENTION
  // -------------------------------------------------------------
  describe('4. Likes and Idempotent Toggle', () => {
    it('Student C likes Student A post -> like count increments to 1', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/like`)
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isLiked, true);
      assert.strictEqual(res.body.data.likesCount, 1);
    });

    it('Student C liking the same post again toggles unlike -> like count becomes 0', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/like`)
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isLiked, false);
      assert.strictEqual(res.body.data.likesCount, 0);
    });

    it('Student C likes again -> toggles back to 1', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/like`)
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isLiked, true);
      assert.strictEqual(res.body.data.likesCount, 1);
    });
  });

  // -------------------------------------------------------------
  // SECTION 5: COMMENTS LIFECYCLE
  // -------------------------------------------------------------
  describe('5. Comments: Create, List, Edit Own, Delete Own & Moderation', () => {
    let createdCommentId = null;

    it('Student C adds a comment on Student A post', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/comments`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({
          content: 'What time are the robotics auditions scheduled for on Friday?',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      const comment = res.body.data.comment;
      assert.ok(comment.id);
      assert.strictEqual(comment.content, 'What time are the robotics auditions scheduled for on Friday?');
      assert.strictEqual(comment.author.displayName, 'Priya Verma');
      createdCommentId = comment.id;
    });

    it('lists comments for the post in ascending order', async () => {
      const res = await request(app)
        .get(`/api/v1/campus/posts/${createdPostAId}/comments`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.comments.length, 1);
      assert.strictEqual(res.body.data.comments[0].id, createdCommentId);
    });

    it('Student C edits their own comment', async () => {
      const res = await request(app)
        .put(`/api/v1/campus/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({
          content: 'Updated: Found the timing! It is at 4:30 PM at the Mech Lab.',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.comment.content, 'Updated: Found the timing! It is at 4:30 PM at the Mech Lab.');
    });

    it('Student A attempting to edit Student C comment returns 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/v1/campus/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Malicious modification of someone else comment',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    it('Student C deletes their own comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/campus/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.success, true);

      // Verify comment list is now empty
      const listRes = await request(app)
        .get(`/api/v1/campus/posts/${createdPostAId}/comments`)
        .set('Authorization', `Bearer ${tokenA}`);
      assert.strictEqual(listRes.body.data.comments.length, 0);
    });
  });

  // -------------------------------------------------------------
  // SECTION 6: BOOKMARKS & SAVED POSTS
  // -------------------------------------------------------------
  describe('6. Bookmarks / Saved Posts', () => {
    it('Student C saves Student A post to bookmarks', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/save`)
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isSaved, true);
    });

    it('Student C retrieves bookmarked posts via GET /campus/saved-posts', async () => {
      const res = await request(app)
        .get('/api/v1/campus/saved-posts')
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.posts.length, 1);
      assert.strictEqual(res.body.data.posts[0].id, createdPostAId);
      assert.strictEqual(res.body.data.posts[0].isSaved, true);
    });

    it('Student C toggles save again to remove from bookmarks', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/save`)
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isSaved, false);

      const listRes = await request(app)
        .get('/api/v1/campus/saved-posts')
        .set('Authorization', `Bearer ${tokenC}`);
      assert.strictEqual(listRes.body.data.posts.length, 0);
    });
  });

  // -------------------------------------------------------------
  // SECTION 7: CAMPUS EVENTS & ACTIVITIES
  // -------------------------------------------------------------
  describe('7. Campus Events & Fest Activities', () => {
    it('Student A creates a campus event', async () => {
      const res = await request(app)
        .post('/api/v1/campus/events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'DTU Annual Tech Fest — Innovate 2026',
          description: 'Three-day technical fest featuring robotics, coding marathons, and drone racing.',
          category: 'Technical',
          eventDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          location: 'DTU Central Convention Hall',
          organizer: 'IEEE DTU Student Branch',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      const event = res.body.data.event;
      assert.ok(event.id);
      assert.strictEqual(event.title, 'DTU Annual Tech Fest — Innovate 2026');
      assert.strictEqual(event.category, 'Technical');
      createdEventAId = event.id;
    });

    it('Student C (same college) sees the event in upcoming events', async () => {
      const res = await request(app)
        .get('/api/v1/campus/events')
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.events.some((e) => e.id === createdEventAId));
    });

    it('Student B (IIT Bombay) does NOT see DTU event', async () => {
      const res = await request(app)
        .get('/api/v1/campus/events')
        .set('Authorization', `Bearer ${tokenB}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.events.some((e) => e.id === createdEventAId), false);
    });
  });

  // -------------------------------------------------------------
  // SECTION 8: TWO-WAY BLOCK FILTERING
  // -------------------------------------------------------------
  describe('8. Moderation & Two-Way Block Filtering', () => {
    it('when Student C blocks Student A, Student A posts are hidden from Student C', async () => {
      await prisma.userBlock.create({
        data: {
          blockerId: studentC.id,
          blockedId: studentA.id,
          reason: 'Test block isolation',
        },
      });

      const resC = await request(app)
        .get('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenC}`);

      assert.strictEqual(resC.status, 200);
      const postsC = resC.body.data.posts || resC.body.data.announcements;
      assert.strictEqual(postsC.some((p) => p.authorId === studentA.id), false);

      const resA = await request(app)
        .get('/api/v1/campus/posts')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(resA.status, 200);
      const postsA = resA.body.data.posts || resA.body.data.announcements;
      assert.strictEqual(postsA.some((p) => p.authorId === studentC.id), false);

      await prisma.userBlock.deleteMany({
        where: { blockerId: studentC.id, blockedId: studentA.id },
      });
    });
  });

  // -------------------------------------------------------------
  // SECTION 9: REPORTING & ADMIN MODERATION
  // -------------------------------------------------------------
  describe('9. Reporting & Administrative Moderation', () => {
    it('allows student to report a post for review', async () => {
      const res = await request(app)
        .post(`/api/v1/campus/posts/${createdPostAId}/report`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({
          category: 'INAPPROPRIATE',
          reason: 'Testing report submission mechanism.',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.reportId);
    });

    it('admin moderates post with soft-delete and records an audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/announcements/${createdPostAId}/moderate`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          action: 'DELETE',
          reason: 'Admin test content moderation',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      const post = await prisma.campusAnnouncement.findUnique({ where: { id: createdPostAId } });
      assert.strictEqual(post.category, 'DELETED');

      const log = await prisma.adminAuditLog.findFirst({
        where: { targetId: createdPostAId },
      });
      assert.ok(log);
      assert.match(log.action, /MODERATE_ANNOUNCEMENT_DELETE/);
    });
  });
});
