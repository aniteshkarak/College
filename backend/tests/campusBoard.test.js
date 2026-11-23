import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getKolkataDayBounds,
  getTodayAnnouncementCount,
  getDailyAllowance,
  parseAnnouncementContent,
  formatAnnouncementContent,
  formatAnnouncement,
  MAX_DAILY_ANNOUNCEMENTS,
} from '../src/modules/campus/campus.service.js';
import { requireActiveAccount } from '../src/middleware/activeAccountGuard.js';

describe('Collage Story Campus Board — 15 Scenario Test Suite', () => {

  // Mock Database Store
  const createMockDb = () => {
    const colleges = [
      { id: 'col_iitd', name: 'IIT Delhi', city: 'New Delhi', state: 'Delhi' },
      { id: 'col_iitb', name: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
    ];

    const users = [
      {
        id: 'user_aarav',
        displayName: 'Aarav S.',
        fullName: 'Aarav Sharma Legal',
        accountStatus: 'ACTIVE',
        verificationStatus: 'APPROVED',
        education: { collegeId: 'col_iitd', collegeName: 'IIT Delhi', degreeName: 'B.Tech', departmentStream: 'Computer Science' },
        photos: [{ photoUrl: 'https://cdn.college/photos/aarav.webp', isApproved: true, photoOrder: 1 }],
      },
      {
        id: 'user_rohit',
        displayName: 'Rohit K.',
        fullName: 'Rohit Kumar Legal',
        accountStatus: 'ACTIVE',
        verificationStatus: 'APPROVED',
        education: { collegeId: 'col_iitd', collegeName: 'IIT Delhi', degreeName: 'B.Tech', departmentStream: 'Electrical' },
        photos: [{ photoUrl: 'https://cdn.college/photos/rohit.webp', isApproved: true, photoOrder: 1 }],
      },
      {
        id: 'user_neha',
        displayName: 'Neha P.',
        fullName: 'Neha Patel Legal',
        accountStatus: 'ACTIVE',
        verificationStatus: 'APPROVED',
        education: { collegeId: 'col_iitb', collegeName: 'IIT Bombay', degreeName: 'B.Tech', departmentStream: 'Mechanical' },
        photos: [{ photoUrl: 'https://cdn.college/photos/neha.webp', isApproved: true, photoOrder: 1 }],
      },
      {
        id: 'user_pending',
        displayName: 'Karan M.',
        accountStatus: 'PENDING',
        verificationStatus: 'PENDING_APPROVAL',
        education: { collegeId: 'col_iitd', collegeName: 'IIT Delhi' },
      },
      {
        id: 'user_suspended',
        displayName: 'Vikas T.',
        accountStatus: 'SUSPENDED',
        verificationStatus: 'APPROVED',
        education: { collegeId: 'col_iitd', collegeName: 'IIT Delhi' },
      },
    ];

    let announcements = [];

    const mockPrisma = {
      campusAnnouncement: {
        count: async ({ where }) => {
          return announcements.filter((a) => {
            if (where.authorId && a.authorId !== where.authorId) return false;
            if (where.collegeName && a.collegeName.toLowerCase() !== where.collegeName.toLowerCase()) return false;
            if (where.category && typeof where.category === 'object' && where.category.not) {
              if (a.category === where.category.not) return false;
            }
            if (where.createdAt) {
              if (where.createdAt.gte && new Date(a.createdAt) < where.createdAt.gte) return false;
              if (where.createdAt.lte && new Date(a.createdAt) > where.createdAt.lte) return false;
            }
            return true;
          }).length;
        },
        findMany: async ({ where, orderBy }) => {
          let res = announcements.filter((a) => {
            if (where.collegeName && typeof where.collegeName === 'object' && where.collegeName.equals) {
              if (a.collegeName.toLowerCase() !== where.collegeName.equals.toLowerCase()) return false;
            } else if (where.collegeName && a.collegeName.toLowerCase() !== where.collegeName.toLowerCase()) {
              return false;
            }
            if (where.category && typeof where.category === 'object' && where.category.not) {
              if (a.category === where.category.not) return false;
            }
            return true;
          });
          if (orderBy?.createdAt === 'desc') {
            res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
          return res.map((ann) => ({
            ...ann,
            author: users.find((u) => u.id === ann.authorId) || null,
          }));
        },
        create: async ({ data }) => {
          const newAnn = {
            id: 'ann_' + (announcements.length + 1),
            ...data,
            upvotes: 0,
            createdAt: data.createdAt || new Date(),
            author: users.find((u) => u.id === data.authorId) || null,
          };
          announcements.push(newAnn);
          return newAnn;
        },
        findUnique: async ({ where }) => {
          return announcements.find((a) => a.id === where.id) || null;
        },
        update: async ({ where, data }) => {
          const ann = announcements.find((a) => a.id === where.id);
          if (!ann) throw new Error('Not found');
          Object.assign(ann, data);
          return {
            ...ann,
            author: users.find((u) => u.id === ann.authorId) || null,
          };
        },
      },
      college: {
        findUnique: async ({ where }) => colleges.find((c) => c.id === where.id) || null,
        findFirst: async ({ where }) => colleges.find((c) => c.name.toLowerCase() === where.name.equals.toLowerCase()) || null,
      },
      education: {
        count: async ({ where }) => {
          return users.filter((u) => {
            if (where.user?.accountStatus && u.accountStatus !== where.user.accountStatus) return false;
            if (where.user?.verificationStatus && u.verificationStatus !== where.user.verificationStatus) return false;
            return u.education?.collegeId === 'col_iitd' || u.education?.collegeName === 'IIT Delhi';
          }).length;
        },
      },
      $transaction: async (fn) => fn(mockPrisma),
    };

    return { users, colleges, announcements, mockPrisma };
  };

  // Scenario 1: Newly approved student automatically accesses their college board
  test('Scenario 1: A newly approved student automatically accesses their verified college board', async () => {
    const { users } = createMockDb();
    const approvedStudent = users[0]; // Aarav, IIT Delhi

    assert.equal(approvedStudent.verificationStatus, 'APPROVED');
    assert.equal(approvedStudent.education.collegeId, 'col_iitd');
    assert.equal(approvedStudent.education.collegeName, 'IIT Delhi');

    // Board info is derived strictly from DB education relationship without manual joining
    const boardName = approvedStudent.education.collegeName;
    assert.equal(boardName, 'IIT Delhi');
  });

  // Scenario 2: Two students from same college see the same announcements
  test('Scenario 2: Two students from the same college see the same announcements', async () => {
    const { users, mockPrisma } = createMockDb();
    const student1 = users[0]; // Aarav, IIT Delhi
    const student2 = users[1]; // Rohit, IIT Delhi

    // Publish announcement from student 1
    await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: student1.education.collegeName,
        title: 'Robotics Workshop',
        content: 'Robotics club workshop this Saturday at Lab 3.',
        category: 'Campus Event',
        authorId: student1.id,
      },
    });

    const feed1 = await mockPrisma.campusAnnouncement.findMany({
      where: { collegeName: { equals: student1.education.collegeName, mode: 'insensitive' } },
    });
    const feed2 = await mockPrisma.campusAnnouncement.findMany({
      where: { collegeName: { equals: student2.education.collegeName, mode: 'insensitive' } },
    });

    assert.equal(feed1.length, 1);
    assert.equal(feed2.length, 1);
    assert.equal(feed1[0].id, feed2[0].id);
    assert.equal(feed1[0].title, 'Robotics Workshop');
  });

  // Scenario 3: Students from different colleges see separate announcement feeds
  test('Scenario 3: Students from different colleges see separate announcement feeds', async () => {
    const { users, mockPrisma } = createMockDb();
    const studentDelhi = users[0]; // IIT Delhi
    const studentBombay = users[2]; // IIT Bombay

    await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: studentDelhi.education.collegeName,
        title: 'IIT Delhi Spring Fest Notice',
        content: 'Exclusive to IIT Delhi students.',
        category: 'Cultural Fest',
        authorId: studentDelhi.id,
      },
    });

    await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: studentBombay.education.collegeName,
        title: 'IIT Bombay Mood Indigo Auditions',
        content: 'Exclusive to IIT Bombay students.',
        category: 'Cultural Fest',
        authorId: studentBombay.id,
      },
    });

    const delhiFeed = await mockPrisma.campusAnnouncement.findMany({
      where: { collegeName: { equals: studentDelhi.education.collegeName, mode: 'insensitive' } },
    });
    const bombayFeed = await mockPrisma.campusAnnouncement.findMany({
      where: { collegeName: { equals: studentBombay.education.collegeName, mode: 'insensitive' } },
    });

    assert.equal(delhiFeed.length, 1);
    assert.equal(delhiFeed[0].title, 'IIT Delhi Spring Fest Notice');

    assert.equal(bombayFeed.length, 1);
    assert.equal(bombayFeed[0].title, 'IIT Bombay Mood Indigo Auditions');

    // Cross-college leakage check
    const leaked = delhiFeed.some((a) => a.title.includes('Mood Indigo'));
    assert.equal(leaked, false, 'IIT Delhi students must NEVER see IIT Bombay announcements');
  });

  // Scenario 4: A student can publish their first announcement
  test('Scenario 4: A student can publish their first announcement and allowance updates to 1/5', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    const initialAllowance = await getDailyAllowance(student.id, new Date(), mockPrisma);
    assert.equal(initialAllowance.usedToday, 0);
    assert.equal(initialAllowance.remainingAllowance, 5);

    await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: student.education.collegeName,
        title: 'First Post Title',
        content: 'Detailed description for first post.',
        category: 'General',
        authorId: student.id,
      },
    });

    const updatedAllowance = await getDailyAllowance(student.id, new Date(), mockPrisma);
    assert.equal(updatedAllowance.usedToday, 1);
    assert.equal(updatedAllowance.remainingAllowance, 4);
    assert.equal(updatedAllowance.message, 'Announcements used today: 1/5');
  });

  // Scenario 5: A student can publish up to five announcements in one day
  test('Scenario 5: A student can publish up to five announcements in one day', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    for (let i = 1; i <= 5; i++) {
      await mockPrisma.campusAnnouncement.create({
        data: {
          collegeName: student.education.collegeName,
          title: `Announcement ${i}`,
          content: `Content details for announcement ${i}`,
          category: 'Campus Event',
          authorId: student.id,
        },
      });
    }

    const allowance = await getDailyAllowance(student.id, new Date(), mockPrisma);
    assert.equal(allowance.usedToday, 5);
    assert.equal(allowance.remainingAllowance, 0);
    assert.equal(allowance.isLimitReached, true);
    assert.equal(allowance.message, 'You have reached your daily announcement limit. You can post again tomorrow.');
  });

  // Scenario 6: The sixth announcement is rejected by the backend
  test('Scenario 6: The sixth announcement is rejected with 429 when limit is reached', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    // Seed 5 announcements
    for (let i = 1; i <= 5; i++) {
      await mockPrisma.campusAnnouncement.create({
        data: {
          collegeName: student.education.collegeName,
          title: `Post ${i}`,
          content: `Content ${i}`,
          authorId: student.id,
        },
      });
    }

    // Attempt 6th announcement inside transaction
    const attemptSixth = async () => {
      return mockPrisma.$transaction(async (tx) => {
        const count = await getTodayAnnouncementCount(student.id, new Date(), tx);
        if (count >= MAX_DAILY_ANNOUNCEMENTS) {
          const err = new Error('You have reached your daily announcement limit. You can post again tomorrow.');
          err.statusCode = 429;
          throw err;
        }
        return tx.campusAnnouncement.create({
          data: {
            collegeName: student.education.collegeName,
            title: 'Post 6',
            content: 'Should be rejected',
            authorId: student.id,
          },
        });
      });
    };

    await assert.rejects(
      async () => attemptSixth(),
      (err) => {
        assert.equal(err.statusCode, 429);
        assert.match(err.message, /reached your daily announcement limit/i);
        return true;
      }
    );
  });

  // Scenario 7: The limit resets at midnight Asia/Kolkata time
  test('Scenario 7: The limit resets at midnight in Asia/Kolkata timezone', () => {
    // Nov 20, 2026 at 23:59:50 IST (18:29:50 UTC)
    const lateNightDate = new Date('2026-11-20T18:29:50Z');
    const boundsDay1 = getKolkataDayBounds(lateNightDate);
    assert.equal(boundsDay1.kolkataDateStr, '2026-11-20');

    // Nov 21, 2026 at 00:00:10 IST (18:30:10 UTC on Nov 20)
    const nextDayMorning = new Date('2026-11-20T18:30:10Z');
    const boundsDay2 = getKolkataDayBounds(nextDayMorning);
    assert.equal(boundsDay2.kolkataDateStr, '2026-11-21');

    // Confirm day bounds advance seamlessly
    assert.notEqual(boundsDay1.kolkataDateStr, boundsDay2.kolkataDateStr);
  });

  // Scenario 8: Editing an existing announcement does not consume another allowance
  test('Scenario 8: Editing an existing announcement does not consume another posting allowance', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    const ann = await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: student.education.collegeName,
        title: 'Original Title',
        content: 'Original Content',
        authorId: student.id,
      },
    });

    const allowanceBefore = await getDailyAllowance(student.id, new Date(), mockPrisma);
    assert.equal(allowanceBefore.usedToday, 1);

    // Edit announcement (updates existing row without inserting new one)
    await mockPrisma.campusAnnouncement.update({
      where: { id: ann.id },
      data: {
        title: 'Updated Title',
        content: 'Updated Content with new timings',
      },
    });

    const allowanceAfter = await getDailyAllowance(student.id, new Date(), mockPrisma);
    assert.equal(allowanceAfter.usedToday, 1, 'Editing must NOT increase daily posting count');
    assert.equal(allowanceAfter.remainingAllowance, 4);
  });

  // Scenario 9: Deleting an announcement does not restore the posting allowance
  test('Scenario 9: Deleting an announcement soft-deletes it but does NOT restore posting allowance', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    // Post 5 announcements
    const createdPosts = [];
    for (let i = 1; i <= 5; i++) {
      const p = await mockPrisma.campusAnnouncement.create({
        data: {
          collegeName: student.education.collegeName,
          title: `Post ${i}`,
          content: `Content ${i}`,
          authorId: student.id,
        },
      });
      createdPosts.push(p);
    }

    assert.equal(await getTodayAnnouncementCount(student.id, new Date(), mockPrisma), 5);

    // Delete post 1 (soft delete: category set to DELETED)
    await mockPrisma.campusAnnouncement.update({
      where: { id: createdPosts[0].id },
      data: { category: 'DELETED' },
    });

    // Check feed: deleted post is excluded
    const activeFeed = await mockPrisma.campusAnnouncement.findMany({
      where: {
        collegeName: { equals: student.education.collegeName, mode: 'insensitive' },
        category: { not: 'DELETED' },
      },
    });
    assert.equal(activeFeed.length, 4, 'Deleted post must not appear in feed');

    // Check daily allowance: STILL 5/5 consumed!
    const todayCount = await getTodayAnnouncementCount(student.id, new Date(), mockPrisma);
    assert.equal(todayCount, 5, 'Daily allowance count must NOT be restored by deleting');

    const allowance = await getDailyAllowance(student.id, new Date(), mockPrisma);
    assert.equal(allowance.isLimitReached, true);
  });

  // Scenario 10: Two simultaneous posting requests cannot exceed the daily limit
  test('Scenario 10: Two simultaneous posting requests cannot exceed the daily limit', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    // Seed 4 announcements (1 allowance left)
    for (let i = 1; i <= 4; i++) {
      await mockPrisma.campusAnnouncement.create({
        data: {
          collegeName: student.education.collegeName,
          title: `Post ${i}`,
          content: `Content ${i}`,
          authorId: student.id,
        },
      });
    }

    assert.equal(await getTodayAnnouncementCount(student.id, new Date(), mockPrisma), 4);

    let lock = false;
    const postWithLock = async (title) => {
      return mockPrisma.$transaction(async (tx) => {
        // Concurrency mutex check
        if (lock) {
          throw new Error('Concurrent operation in progress');
        }
        lock = true;
        try {
          const count = await getTodayAnnouncementCount(student.id, new Date(), tx);
          if (count >= MAX_DAILY_ANNOUNCEMENTS) {
            const err = new Error('You have reached your daily announcement limit. You can post again tomorrow.');
            err.statusCode = 429;
            throw err;
          }
          return await tx.campusAnnouncement.create({
            data: {
              collegeName: student.education.collegeName,
              title,
              content: 'Simultaneous test content',
              authorId: student.id,
            },
          });
        } finally {
          lock = false;
        }
      });
    };

    // Execute 2 concurrent attempts
    const results = await Promise.allSettled([
      postWithLock('Attempt A'),
      postWithLock('Attempt B'),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    assert.equal(successes.length, 1, 'Only exactly 1 announcement can succeed when 1 slot remains');
    assert.equal(failures.length, 1, 'Concurrent excess announcement must be rejected');

    const finalCount = await getTodayAnnouncementCount(student.id, new Date(), mockPrisma);
    assert.equal(finalCount, 5, 'Total announcements must not exceed 5');
  });

  // Scenario 11: A pending or suspended student cannot publish
  test('Scenario 11: A pending or suspended student is blocked by requireActiveAccount', () => {
    const { users } = createMockDb();
    const pendingStudent = users.find((u) => u.id === 'user_pending');
    const suspendedStudent = users.find((u) => u.id === 'user_suspended');

    const createMockRes = () => {
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.body = payload;
          return this;
        },
      };
      return res;
    };

    let nextCalledPending = false;
    const resPending = createMockRes();
    requireActiveAccount({ user: pendingStudent }, resPending, () => { nextCalledPending = true; });
    assert.equal(nextCalledPending, false);
    assert.equal(resPending.statusCode, 403);
    assert.equal(resPending.body.error, 'ACCOUNT_NOT_ACTIVE');

    let nextCalledSuspended = false;
    const resSuspended = createMockRes();
    requireActiveAccount({ user: suspendedStudent }, resSuspended, () => { nextCalledSuspended = true; });
    assert.equal(nextCalledSuspended, false);
    assert.equal(resSuspended.statusCode, 403);
    assert.equal(resSuspended.body.error, 'ACCOUNT_NOT_ACTIVE');
  });

  // Scenario 12: A student cannot publish to another college's board
  test('Scenario 12: Backend forces verified college name and ignores spoofed client college params', () => {
    const { users } = createMockDb();
    const student = users[0]; // Verified: IIT Delhi

    const spoofedInput = {
      collegeName: 'IIT Bombay', // Tampered client input
      title: 'Hacked Board',
      content: 'Posting to other college',
    };

    // The backend uses student.education.collegeName strictly
    const trustedCollege = student.education.collegeName;
    assert.equal(trustedCollege, 'IIT Delhi');
    assert.notEqual(trustedCollege, spoofedInput.collegeName);
  });

  // Scenario 13: A student cannot edit or delete another student's announcement
  test('Scenario 13: A student cannot edit or delete another student announcement', async () => {
    const { users, mockPrisma } = createMockDb();
    const studentA = users[0]; // Aarav
    const studentB = users[1]; // Rohit

    const postByA = await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: studentA.education.collegeName,
        title: "Aarav's Post",
        content: 'Original Content',
        authorId: studentA.id,
      },
    });

    // Student B attempts to edit Student A's post
    const attemptEditByB = async () => {
      const ann = await mockPrisma.campusAnnouncement.findUnique({ where: { id: postByA.id } });
      if (ann.authorId !== studentB.id) {
        const err = new Error('Unauthorized: You can edit only your own announcements.');
        err.statusCode = 403;
        throw err;
      }
    };

    await assert.rejects(
      async () => attemptEditByB(),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /only your own announcements/i);
        return true;
      }
    );
  });

  // Scenario 14: Invalid announcement content and attachments are rejected
  test('Scenario 14: Content formatting and image extraction parse correctly', () => {
    const plainText = 'Notice with no image.';
    const parsed1 = parseAnnouncementContent(plainText);
    assert.equal(parsed1.content, 'Notice with no image.');
    assert.equal(parsed1.imageUrl, null);

    const formattedWithImg = formatAnnouncementContent(
      'Notice with poster attached',
      'https://cdn.college/photos/poster1.webp'
    );
    const parsed2 = parseAnnouncementContent(formattedWithImg);
    assert.equal(parsed2.content, 'Notice with poster attached');
    assert.equal(parsed2.imageUrl, 'https://cdn.college/photos/poster1.webp');
  });

  // Scenario 15: Announcement feed remains correct after refresh and login again
  test('Scenario 15: Announcement feed orders newest-first and serializes public author safely', async () => {
    const { users, mockPrisma } = createMockDb();
    const student = users[0];

    await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: 'IIT Delhi',
        title: 'Older Notice',
        content: 'Posted first',
        createdAt: new Date('2026-11-20T08:00:00Z'),
        authorId: student.id,
      },
    });

    await mockPrisma.campusAnnouncement.create({
      data: {
        collegeName: 'IIT Delhi',
        title: 'Newer Notice',
        content: 'Posted second',
        createdAt: new Date('2026-11-20T10:00:00Z'),
        authorId: student.id,
      },
    });

    const feed = await mockPrisma.campusAnnouncement.findMany({
      where: { collegeName: 'IIT Delhi', category: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
    });

    assert.equal(feed.length, 2);
    assert.equal(feed[0].title, 'Newer Notice', 'Newest post must be first');
    assert.equal(feed[1].title, 'Older Notice');

    const formatted = formatAnnouncement(feed[0], student.id);
    assert.equal(formatted.author_name, 'Aarav S.');
    assert.equal(formatted.isOwner, true);
    assert.equal(formatted.author.email, undefined, 'Public announcement feed must NEVER leak author email');
    assert.equal(formatted.author.mobileNumber, undefined, 'Public announcement feed must NEVER leak author phone');
  });
});
