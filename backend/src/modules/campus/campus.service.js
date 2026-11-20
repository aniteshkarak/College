import prisma from '../../config/prisma.js';
import imageService from '../../services/imageService.js';
import { serializePublicProfile } from '../../utils/serializers.js';

export const MAX_DAILY_ANNOUNCEMENTS = 5;

/**
 * Calculates start and end timestamps for the current calendar day
 * strictly in the 'Asia/Kolkata' timezone (UTC+05:30).
 */
export const getKolkataDayBounds = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const kolkataDateStr = formatter.format(date); // YYYY-MM-DD
  const startOfDay = new Date(`${kolkataDateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${kolkataDateStr}T23:59:59.999+05:30`);
  return { kolkataDateStr, startOfDay, endOfDay };
};

/**
 * Counts all announcements created by a student today in Asia/Kolkata time.
 * Crucial: Counts active AND deleted announcements so deleting a post
 * can NEVER be used to bypass the daily 5-announcement limit!
 */
export const getTodayAnnouncementCount = async (authorId, date = new Date(), tx = prisma) => {
  const { startOfDay, endOfDay } = getKolkataDayBounds(date);
  return tx.campusAnnouncement.count({
    where: {
      authorId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });
};

/**
 * Returns today's usage and remaining allowance.
 */
export const getDailyAllowance = async (authorId, date = new Date(), tx = prisma) => {
  const { kolkataDateStr } = getKolkataDayBounds(date);
  const usedToday = await getTodayAnnouncementCount(authorId, date, tx);
  const remainingAllowance = Math.max(0, MAX_DAILY_ANNOUNCEMENTS - usedToday);
  const isLimitReached = usedToday >= MAX_DAILY_ANNOUNCEMENTS;

  return {
    date: kolkataDateStr,
    timezone: 'Asia/Kolkata',
    usedToday,
    maxDailyLimit: MAX_DAILY_ANNOUNCEMENTS,
    remainingAllowance,
    isLimitReached,
    message: isLimitReached
      ? 'You have reached your daily announcement limit. You can post again tomorrow.'
      : `Announcements used today: ${usedToday}/${MAX_DAILY_ANNOUNCEMENTS}`,
  };
};

/**
 * Extracts optional image URL formatted inside content
 */
export const parseAnnouncementContent = (rawContent) => {
  if (!rawContent) return { content: '', imageUrl: null };
  const imgMatch = rawContent.match(/\[IMAGE:(.*?)\]/);
  if (imgMatch) {
    const imageUrl = imgMatch[1];
    const cleanContent = rawContent.replace(/\[IMAGE:(.*?)\]/, '').trim();
    return { content: cleanContent, imageUrl };
  }
  return { content: rawContent, imageUrl: null };
};

/**
 * Encodes optional image URL into content string
 */
export const formatAnnouncementContent = (textContent, imageUrl) => {
  const clean = textContent.trim();
  if (imageUrl) {
    return `${clean}\n\n[IMAGE:${imageUrl}]`;
  }
  return clean;
};

/**
 * Formats an announcement for public consumption, sanitizing author details
 */
export const formatAnnouncement = (ann, currentUserId = null) => {
  const { content, imageUrl } = parseAnnouncementContent(ann.content);

  let authorPublic = null;
  if (ann.author) {
    const pub = serializePublicProfile(ann.author);
    authorPublic = {
      id: ann.author.id,
      displayName: pub.displayName,
      display_name: pub.displayName,
      avatarUrl: pub.avatarUrl,
      avatar_url: pub.avatarUrl,
      course: pub.course,
      collegeName: pub.collegeName,
      college_name: pub.collegeName,
    };
  }

  return {
    id: ann.id,
    collegeName: ann.collegeName,
    college_name: ann.collegeName,
    title: ann.title,
    content,
    imageUrl,
    image_url: imageUrl,
    category: ann.category,
    isUrgent: ann.isUrgent,
    is_urgent: ann.isUrgent,
    upvotes: ann.upvotes,
    authorId: ann.authorId,
    author_id: ann.authorId,
    author: authorPublic,
    author_name: authorPublic?.displayName || 'Campus Student',
    author_role: authorPublic?.course || 'Student',
    createdAt: ann.createdAt,
    created_at: ann.createdAt,
    date: new Date(ann.createdAt).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    isOwner: Boolean(currentUserId && ann.authorId === currentUserId),
  };
};

export const campusService = {
  getKolkataDayBounds,
  getTodayAnnouncementCount,
  getDailyAllowance,
  parseAnnouncementContent,
  formatAnnouncementContent,
  formatAnnouncement,

  /**
   * Retrieves verified college board information for the student
   */
  getCollegeBoardInfo: async (user) => {
    const education = user.education;
    if (!education || !education.collegeName) {
      throw new Error('You must have a verified college to access the Campus Board.');
    }

    let collegeRecord = null;
    if (education.collegeId) {
      collegeRecord = await prisma.college.findUnique({
        where: { id: education.collegeId },
      });
    }

    if (!collegeRecord) {
      collegeRecord = await prisma.college.findFirst({
        where: { name: { equals: education.collegeName.trim(), mode: 'insensitive' } },
      });
    }

    // Count approved student members belonging to this college
    const memberCount = await prisma.education.count({
      where: {
        OR: [
          ...(education.collegeId ? [{ collegeId: education.collegeId }] : []),
          { collegeName: { equals: education.collegeName.trim(), mode: 'insensitive' } },
        ],
        user: { accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      },
    });

    const allowance = await getDailyAllowance(user.id);

    return {
      collegeId: collegeRecord?.id || education.collegeId || null,
      collegeName: collegeRecord?.name || education.collegeName,
      universityName: collegeRecord?.universityName || education.universityName || null,
      city: collegeRecord?.city || null,
      state: collegeRecord?.state || null,
      memberCount,
      allowance,
    };
  },

  /**
   * Fetches paginated announcements strictly for the user's verified college
   */
  listAnnouncements: async (user, query = {}) => {
    const education = user.education;
    if (!education || !education.collegeName) {
      throw new Error('You must have a verified college to view announcements.');
    }

    const collegeName = education.collegeName.trim();
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const where = {
      collegeName: { equals: collegeName, mode: 'insensitive' },
      category: { not: 'DELETED' },
    };

    if (query.category && query.category !== 'All') {
      where.category = query.category;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { content: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.campusAnnouncement.findMany({
        where,
        include: {
          author: {
            include: {
              profile: true,
              education: true,
              photos: { orderBy: { photoOrder: 'asc' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.campusAnnouncement.count({ where }),
    ]);

    const formatted = announcements.map((a) => formatAnnouncement(a, user.id));
    const allowance = await getDailyAllowance(user.id);

    return {
      collegeName,
      announcements: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + announcements.length < total,
      },
      allowance,
    };
  },

  /**
   * Publishes an announcement with strict 5-per-day limit and concurrency safety
   */
  createAnnouncement: async (user, data, imageFile = null) => {
    const education = user.education;
    if (!education || !education.collegeName) {
      throw new Error('You must have a verified college before posting an announcement.');
    }

    // Process optional image upload
    let storedImageUrl = null;
    if (imageFile && imageFile.buffer) {
      const processed = await imageService.processAndSaveAnnouncementImage(imageFile.buffer);
      storedImageUrl = `/api/v1/campus/announcements/media/${processed.fileName}`;
    }

    const fullContent = formatAnnouncementContent(data.content, storedImageUrl);
    const collegeName = education.collegeName.trim();

    // Transaction ensures concurrency safety across simultaneous requests
    const announcement = await prisma.$transaction(async (tx) => {
      // 1. Check daily posting count strictly in Asia/Kolkata
      const usedToday = await getTodayAnnouncementCount(user.id, new Date(), tx);
      if (usedToday >= MAX_DAILY_ANNOUNCEMENTS) {
        const err = new Error('You have reached your daily announcement limit. You can post again tomorrow.');
        err.statusCode = 429;
        err.code = 'DAILY_LIMIT_EXCEEDED';
        err.details = {
          usedToday,
          maxDailyLimit: MAX_DAILY_ANNOUNCEMENTS,
          remainingAllowance: 0,
        };
        throw err;
      }

      // 2. Create announcement
      const created = await tx.campusAnnouncement.create({
        data: {
          collegeName,
          title: data.title.trim(),
          content: fullContent,
          category: data.category || 'General',
          isUrgent: Boolean(data.isUrgent),
          authorId: user.id,
        },
        include: {
          author: {
            include: {
              profile: true,
              education: true,
              photos: { orderBy: { photoOrder: 'asc' } },
            },
          },
        },
      });

      return created;
    });

    const allowance = await getDailyAllowance(user.id);
    return {
      announcement: formatAnnouncement(announcement, user.id),
      allowance,
    };
  },

  /**
   * Updates an existing announcement (does NOT consume another posting allowance!)
   */
  updateAnnouncement: async (user, announcementId, data) => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.authorId !== user.id) {
      const err = new Error('Unauthorized: You can edit only your own announcements.');
      err.statusCode = 403;
      throw err;
    }

    if (existing.category === 'DELETED') {
      const err = new Error('Cannot edit a deleted announcement.');
      err.statusCode = 400;
      throw err;
    }

    const { imageUrl } = parseAnnouncementContent(existing.content);
    const newFullContent = formatAnnouncementContent(data.content || existing.content, imageUrl);

    const updated = await prisma.campusAnnouncement.update({
      where: { id: announcementId },
      data: {
        title: data.title ? data.title.trim() : existing.title,
        content: newFullContent,
        category: data.category || existing.category,
        isUrgent: typeof data.isUrgent === 'boolean' ? data.isUrgent : existing.isUrgent,
      },
      include: {
        author: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
      },
    });

    return formatAnnouncement(updated, user.id);
  },

  /**
   * Deletes an announcement (soft-delete retains posting record so daily allowance is NOT restored!)
   */
  deleteAnnouncement: async (user, announcementId) => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.authorId !== user.id) {
      const err = new Error('Unauthorized: You can delete only your own announcements.');
      err.statusCode = 403;
      throw err;
    }

    // Soft delete preserves the row and createdAt for daily limit integrity
    await prisma.campusAnnouncement.update({
      where: { id: announcementId },
      data: { category: 'DELETED' },
    });

    const allowance = await getDailyAllowance(user.id);
    return { success: true, allowance };
  },

  /**
   * Upvotes an announcement
   */
  upvoteAnnouncement: async (user, announcementId) => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing || existing.category === 'DELETED') {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.campusAnnouncement.update({
      where: { id: announcementId },
      data: { upvotes: { increment: 1 } },
      include: {
        author: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
      },
    });

    return formatAnnouncement(updated, user.id);
  },

  /**
   * Admin moderation of announcements
   */
  moderateAnnouncement: async (admin, announcementId, action = 'DELETE', reason = '') => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    const newCategory = action === 'RESTORE' ? 'General' : 'DELETED';

    const updated = await prisma.$transaction(async (tx) => {
      const a = await tx.campusAnnouncement.update({
        where: { id: announcementId },
        data: { category: newCategory },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: `MODERATE_ANNOUNCEMENT_${action}`,
          targetType: 'ANNOUNCEMENT',
          targetId: announcementId,
          details: JSON.stringify({
            previousCategory: existing.category,
            newCategory,
            action,
            reason: reason || 'Administrative content moderation',
          }),
        },
      });

      return a;
    });

    return updated;
  },
};

export default campusService;
