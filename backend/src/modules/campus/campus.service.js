import prisma from '../../config/prisma.js';
import imageService from '../../services/imageService.js';
import { serializePublicProfile } from '../../utils/serializers.js';
import notificationService, { NOTIFICATION_TYPES } from '../../services/notificationService.js';
import {
  broadcastCampusPost,
  broadcastPostComment,
  broadcastPostLike,
  broadcastCampusEvent,
} from '../../services/socketService.js';

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
      // Only count quota-restricted posts: ANNOUNCEMENT, isUrgent, or Academic Notice
      OR: [
        { postType: 'ANNOUNCEMENT' },
        { isUrgent: true },
        { category: 'Academic Notice' },
      ],
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
 * Helper to get bidirectional blocked user IDs
 */
export const getBlockedUserIds = async (userId) => {
  if (!userId) return [];
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });
  return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
};

/**
 * Helper to get verified college name for a user
 */
export const getVerifiedCollegeName = (user) => {
  const education = user.education || (user.collegeName ? { collegeName: user.collegeName, collegeId: user.collegeId } : null);
  if (!education || !education.collegeName) {
    const err = new Error('You must have a verified college to access the Campus Board.');
    err.statusCode = 403;
    throw err;
  }
  return education.collegeName.trim();
};

/**
 * Extracts optional image URL formatted inside content or directly
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
  const clean = (textContent || '').trim();
  if (imageUrl) {
    return `${clean}\n\n[IMAGE:${imageUrl}]`;
  }
  return clean;
};

/**
 * Formats a comment
 */
export const formatComment = (comment, currentUserId = null) => {
  let authorPublic = null;
  if (comment.author) {
    const pub = serializePublicProfile(comment.author);
    authorPublic = {
      id: comment.author.id,
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
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: authorPublic,
    isOwner: Boolean(currentUserId && comment.authorId === currentUserId),
  };
};

/**
 * Formats a campus event
 */
export const formatEvent = (evt, currentUserId = null) => {
  let authorPublic = null;
  if (evt.author) {
    const pub = serializePublicProfile(evt.author);
    authorPublic = {
      id: evt.author.id,
      displayName: pub.displayName,
      avatarUrl: pub.avatarUrl,
      course: pub.course,
      collegeName: pub.collegeName,
    };
  }

  return {
    id: evt.id,
    collegeName: evt.collegeName,
    college_name: evt.collegeName,
    title: evt.title,
    description: evt.description,
    category: evt.category,
    eventDate: evt.eventDate,
    location: evt.location,
    organizer: evt.organizer,
    posterUrl: evt.posterUrl,
    poster_url: evt.posterUrl,
    isOfficial: Boolean(evt.isOfficial),
    is_official: Boolean(evt.isOfficial),
    authorId: evt.authorId,
    author: authorPublic,
    createdAt: evt.createdAt,
    updatedAt: evt.updatedAt,
    isOwner: Boolean(currentUserId && evt.authorId === currentUserId),
  };
};

/**
 * Formats an announcement/post for public consumption
 */
export const formatAnnouncement = (ann, currentUserId = null) => {
  const parsed = parseAnnouncementContent(ann.content);
  const cleanContent = parsed.content;
  const resolvedImageUrl = ann.imageUrl || parsed.imageUrl;

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

  const likesCount = ann._count?.likes ?? (Array.isArray(ann.likes) ? ann.likes.length : ann.upvotes || 0);
  const commentsCount = ann._count?.comments ?? (Array.isArray(ann.comments) ? ann.comments.length : 0);
  const isLiked = Boolean(
    currentUserId &&
      (ann.isLiked || (Array.isArray(ann.likes) && ann.likes.some((l) => l.userId === currentUserId || l.id)))
  );
  const isSaved = Boolean(
    currentUserId &&
      (ann.isSaved || (Array.isArray(ann.savedBy) && ann.savedBy.some((s) => s.userId === currentUserId || s.id)))
  );

  return {
    id: ann.id,
    collegeName: ann.collegeName,
    college_name: ann.collegeName,
    title: ann.title,
    content: cleanContent,
    postType: ann.postType || 'POST',
    post_type: ann.postType || 'POST',
    imageUrl: resolvedImageUrl,
    image_url: resolvedImageUrl,
    category: ann.category,
    isUrgent: ann.isUrgent,
    is_urgent: ann.isUrgent,
    isOfficial: Boolean(ann.isOfficial),
    is_official: Boolean(ann.isOfficial),
    upvotes: likesCount,
    likesCount,
    likes_count: likesCount,
    commentsCount,
    comments_count: commentsCount,
    isLiked,
    is_liked: isLiked,
    isSaved,
    is_saved: isSaved,
    authorId: ann.authorId,
    author_id: ann.authorId,
    author: authorPublic,
    author_name: authorPublic?.displayName || 'Campus Student',
    author_role: authorPublic?.course || 'Student',
    createdAt: ann.createdAt,
    created_at: ann.createdAt,
    updatedAt: ann.updatedAt,
    date: new Date(ann.createdAt).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    isOwner: Boolean(currentUserId && ann.authorId === currentUserId),
    comments: Array.isArray(ann.comments)
      ? ann.comments.map((c) => formatComment(c, currentUserId))
      : undefined,
  };
};

export const campusService = {
  getKolkataDayBounds,
  getTodayAnnouncementCount,
  getDailyAllowance,
  getBlockedUserIds,
  getVerifiedCollegeName,
  parseAnnouncementContent,
  formatAnnouncementContent,
  formatAnnouncement,
  formatComment,
  formatEvent,

  /**
   * Retrieves verified college board overview
   */
  getCollegeBoardInfo: async (user) => {
    const collegeName = getVerifiedCollegeName(user);
    const education = user.education || {};

    let collegeRecord = null;
    if (education.collegeId) {
      collegeRecord = await prisma.college.findUnique({
        where: { id: education.collegeId },
      });
    }

    if (!collegeRecord) {
      collegeRecord = await prisma.college.findFirst({
        where: { name: { equals: collegeName, mode: 'insensitive' } },
      });
    }

    const memberCount = await prisma.education.count({
      where: {
        OR: [
          ...(education.collegeId ? [{ collegeId: education.collegeId }] : []),
          { collegeName: { equals: collegeName, mode: 'insensitive' } },
        ],
        user: { accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
      },
    });

    const allowance = await getDailyAllowance(user.id);

    return {
      collegeId: collegeRecord?.id || education.collegeId || null,
      collegeName: collegeRecord?.name || collegeName,
      universityName: collegeRecord?.universityName || education.universityName || null,
      city: collegeRecord?.city || null,
      state: collegeRecord?.state || null,
      memberCount,
      allowance,
    };
  },

  /**
   * Fetches paginated announcements/posts strictly for the user's verified college
   */
  listAnnouncements: async (user, query = {}) => {
    const collegeName = getVerifiedCollegeName(user);
    const blockedUserIds = await getBlockedUserIds(user.id);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const where = {
      collegeName: { equals: collegeName, mode: 'insensitive' },
      category: { not: 'DELETED' },
      ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
    };

    if (query.category && query.category !== 'All') {
      where.category = query.category;
    }

    if (query.postType && query.postType !== 'ALL') {
      where.postType = query.postType;
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
          likes: {
            where: { userId: user.id },
            select: { id: true, userId: true },
          },
          savedBy: {
            where: { userId: user.id },
            select: { id: true, userId: true },
          },
          _count: {
            select: { likes: true, comments: true },
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
      posts: formatted,
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
   * Retrieves a single post with comments
   */
  getSinglePost: async (user, postId) => {
    const collegeName = getVerifiedCollegeName(user);
    const blockedUserIds = await getBlockedUserIds(user.id);

    const post = await prisma.campusAnnouncement.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
        likes: {
          where: { userId: user.id },
          select: { id: true, userId: true },
        },
        savedBy: {
          where: { userId: user.id },
          select: { id: true, userId: true },
        },
        comments: {
          where: {
            ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
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
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!post || post.category === 'DELETED') {
      const err = new Error('Post not found or has been deleted.');
      err.statusCode = 404;
      throw err;
    }

    if (post.collegeName.trim().toLowerCase() !== collegeName.toLowerCase()) {
      const err = new Error('Unauthorized: You can view posts from your own college only.');
      err.statusCode = 403;
      throw err;
    }

    if (blockedUserIds.includes(post.authorId)) {
      const err = new Error('Post not available.');
      err.statusCode = 404;
      throw err;
    }

    return formatAnnouncement(post, user.id);
  },

  /**
   * Creates a post or announcement.
   * Daily 5-limit is strictly applied ONLY to announcements/notices.
   */
  createAnnouncement: async (user, data, imageFile = null) => {
    const collegeName = getVerifiedCollegeName(user);

    // Process image file or URL
    let storedImageUrl = data.imageUrl || null;
    if (imageFile && imageFile.buffer) {
      const processed = await imageService.processAndSaveAnnouncementImage(imageFile.buffer);
      storedImageUrl = `/api/v1/campus/announcements/media/${processed.fileName}`;
    }

    const postType = (data.postType || 'POST').toUpperCase();
    const isUrgent = Boolean(data.isUrgent);
    const category = data.category || 'General';
    const isOfficial = Boolean(
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && data.isOfficial !== false
    );

    // Determine if this post is subject to the daily 5-announcement limit
    const isQuotaRestricted =
      postType === 'ANNOUNCEMENT' || isUrgent || category === 'Academic Notice';

    const fullContent = formatAnnouncementContent(data.content, storedImageUrl);

    const announcement = await prisma.$transaction(async (tx) => {
      if (isQuotaRestricted) {
        const usedToday = await getTodayAnnouncementCount(user.id, new Date(), tx);
        if (usedToday >= MAX_DAILY_ANNOUNCEMENTS) {
          const err = new Error(
            'You have reached your daily announcement limit. You can post again tomorrow.'
          );
          err.statusCode = 429;
          err.code = 'DAILY_LIMIT_EXCEEDED';
          err.details = {
            usedToday,
            maxDailyLimit: MAX_DAILY_ANNOUNCEMENTS,
            remainingAllowance: 0,
          };
          throw err;
        }
      }

      return tx.campusAnnouncement.create({
        data: {
          collegeName,
          title: data.title.trim(),
          content: fullContent,
          category,
          postType,
          isUrgent,
          isOfficial,
          imageUrl: storedImageUrl,
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
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });
    });

    const formatted = formatAnnouncement(announcement, user.id);

    // Broadcast new post in real-time to college channel
    try {
      broadcastCampusPost(collegeName, formatted);
    } catch (e) {}

    // Send notifications to peers if official announcement or urgent
    if (isQuotaRestricted) {
      (async () => {
        try {
          const peers = await prisma.education.findMany({
            where: {
              collegeName: { equals: collegeName, mode: 'insensitive' },
              userId: { not: user.id },
              user: { accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
            },
            select: { userId: true },
            take: 200,
          });

          const CHUNK_SIZE = 25;
          for (let i = 0; i < peers.length; i += CHUNK_SIZE) {
            const chunk = peers.slice(i, i + CHUNK_SIZE);
            await Promise.all(
              chunk.map((peer) =>
                notificationService
                  .createNotification({
                    recipientId: peer.userId,
                    actorId: user.id,
                    type: NOTIFICATION_TYPES.CAMPUS_ANNOUNCEMENT,
                    title: `New notice in ${collegeName}`,
                    message: data.title?.trim() || 'A new announcement has been posted.',
                    relatedEntityId: announcement.id,
                    data: { announcementId: announcement.id, collegeName },
                  })
                  .catch(() => {})
              )
            );
          }
        } catch (err) {}
      })();
    }

    const allowance = await getDailyAllowance(user.id);
    return {
      announcement: formatted,
      post: formatted,
      allowance,
    };
  },

  /**
   * Updates an existing post
   */
  updateAnnouncement: async (user, announcementId, data) => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.authorId !== user.id) {
      const err = new Error('Unauthorized: You can edit only your own posts.');
      err.statusCode = 403;
      throw err;
    }

    if (existing.category === 'DELETED') {
      const err = new Error('Cannot edit a deleted post.');
      err.statusCode = 400;
      throw err;
    }

    const { imageUrl } = parseAnnouncementContent(existing.content);
    const resolvedImageUrl = data.imageUrl !== undefined ? data.imageUrl : (existing.imageUrl || imageUrl);
    const newFullContent = formatAnnouncementContent(data.content || existing.content, resolvedImageUrl);

    const updated = await prisma.campusAnnouncement.update({
      where: { id: announcementId },
      data: {
        title: data.title ? data.title.trim() : existing.title,
        content: newFullContent,
        category: data.category || existing.category,
        postType: data.postType ? data.postType.toUpperCase() : existing.postType,
        isUrgent: typeof data.isUrgent === 'boolean' ? data.isUrgent : existing.isUrgent,
        imageUrl: resolvedImageUrl,
      },
      include: {
        author: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    return formatAnnouncement(updated, user.id);
  },

  /**
   * Soft-deletes a post
   */
  deleteAnnouncement: async (user, announcementId) => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.authorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const err = new Error('Unauthorized: You can delete only your own posts.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.campusAnnouncement.update({
      where: { id: announcementId },
      data: { category: 'DELETED' },
    });

    const allowance = await getDailyAllowance(user.id);
    return { success: true, allowance };
  },

  /**
   * Likes or unlikes a post (idempotent duplicate prevention)
   */
  toggleLike: async (user, postId) => {
    const collegeName = getVerifiedCollegeName(user);

    const post = await prisma.campusAnnouncement.findUnique({
      where: { id: postId },
    });

    if (!post || post.category === 'DELETED') {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    if (post.collegeName.trim().toLowerCase() !== collegeName.toLowerCase()) {
      const err = new Error('Unauthorized: You can like posts from your own college only.');
      err.statusCode = 403;
      throw err;
    }

    const blockedUserIds = await getBlockedUserIds(user.id);
    if (blockedUserIds.includes(post.authorId)) {
      const err = new Error('Action not permitted.');
      err.statusCode = 403;
      throw err;
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    let isLiked = false;
    let likesCount = 0;

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existingLike.id } }),
        prisma.campusAnnouncement.update({
          where: { id: postId },
          data: { upvotes: { decrement: 1 } },
        }),
      ]);
      isLiked = false;
    } else {
      // Like
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            postId,
            userId: user.id,
          },
        }),
        prisma.campusAnnouncement.update({
          where: { id: postId },
          data: { upvotes: { increment: 1 } },
        }),
      ]);
      isLiked = true;
    }

    likesCount = await prisma.postLike.count({ where: { postId } });

    // Broadcast live like update
    try {
      broadcastPostLike(collegeName, postId, {
        likesCount,
        isLiked,
        userId: user.id,
      });
    } catch (e) {}

    return {
      postId,
      isLiked,
      likesCount,
    };
  },

  /**
   * Legacy upvote endpoint wrapper
   */
  upvoteAnnouncement: async (user, announcementId) => {
    const res = await campusService.toggleLike(user, announcementId);
    return campusService.getSinglePost(user, announcementId);
  },

  /**
   * Comments: List comments for a post
   */
  listComments: async (user, postId, query = {}) => {
    const collegeName = getVerifiedCollegeName(user);
    const post = await prisma.campusAnnouncement.findUnique({
      where: { id: postId },
    });

    if (!post || post.category === 'DELETED') {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    if (post.collegeName.trim().toLowerCase() !== collegeName.toLowerCase()) {
      const err = new Error('Unauthorized: Cross-college access blocked.');
      err.statusCode = 403;
      throw err;
    }

    const blockedUserIds = await getBlockedUserIds(user.id);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const where = {
      postId,
      ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
    };

    const [comments, total] = await Promise.all([
      prisma.postComment.findMany({
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
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.postComment.count({ where }),
    ]);

    return {
      postId,
      comments: comments.map((c) => formatComment(c, user.id)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + comments.length < total,
      },
    };
  },

  /**
   * Comments: Add a new comment
   */
  createComment: async (user, postId, content) => {
    const collegeName = getVerifiedCollegeName(user);
    const cleanContent = (content || '').trim();

    if (!cleanContent || cleanContent.length < 1 || cleanContent.length > 1000) {
      const err = new Error('Comment must be between 1 and 1000 characters.');
      err.statusCode = 400;
      throw err;
    }

    const post = await prisma.campusAnnouncement.findUnique({
      where: { id: postId },
    });

    if (!post || post.category === 'DELETED') {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    if (post.collegeName.trim().toLowerCase() !== collegeName.toLowerCase()) {
      const err = new Error('Unauthorized: You can comment on posts from your own college only.');
      err.statusCode = 403;
      throw err;
    }

    const blockedUserIds = await getBlockedUserIds(user.id);
    if (blockedUserIds.includes(post.authorId)) {
      const err = new Error('Action not permitted.');
      err.statusCode = 403;
      throw err;
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        content: cleanContent,
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

    const formatted = formatComment(comment, user.id);

    // Real-time broadcast
    try {
      broadcastPostComment(collegeName, postId, formatted);
    } catch (e) {}

    // Notify post author if not self
    if (post.authorId !== user.id) {
      notificationService
        .createNotification({
          recipientId: post.authorId,
          actorId: user.id,
          type: 'CAMPUS_ANNOUNCEMENT',
          title: 'New comment on your post',
          message: `${user.displayName || 'A student'} commented: "${cleanContent.slice(0, 60)}"`,
          relatedEntityId: postId,
          data: { postId, commentId: comment.id },
        })
        .catch(() => {});
    }

    return formatted;
  },

  /**
   * Comments: Edit own comment
   */
  updateComment: async (user, commentId, content) => {
    const cleanContent = (content || '').trim();
    if (!cleanContent || cleanContent.length < 1 || cleanContent.length > 1000) {
      const err = new Error('Comment must be between 1 and 1000 characters.');
      err.statusCode = 400;
      throw err;
    }

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      const err = new Error('Comment not found.');
      err.statusCode = 404;
      throw err;
    }

    if (comment.authorId !== user.id) {
      const err = new Error('Unauthorized: You can edit only your own comments.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await prisma.postComment.update({
      where: { id: commentId },
      data: { content: cleanContent },
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

    return formatComment(updated, user.id);
  },

  /**
   * Comments: Delete own comment or admin delete
   */
  deleteComment: async (user, commentId) => {
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      const err = new Error('Comment not found.');
      err.statusCode = 404;
      throw err;
    }

    if (comment.authorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const err = new Error('Unauthorized: You can delete only your own comments.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.postComment.delete({
      where: { id: commentId },
    });

    return { success: true, commentId, postId: comment.postId };
  },

  /**
   * Saved / Bookmarked Posts
   */
  toggleSavedPost: async (user, postId) => {
    const collegeName = getVerifiedCollegeName(user);
    const post = await prisma.campusAnnouncement.findUnique({
      where: { id: postId },
    });

    if (!post || post.category === 'DELETED') {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    if (post.collegeName.trim().toLowerCase() !== collegeName.toLowerCase()) {
      const err = new Error('Unauthorized: You can save posts from your own college only.');
      err.statusCode = 403;
      throw err;
    }

    const existing = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    let isSaved = false;
    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      isSaved = false;
    } else {
      await prisma.savedPost.create({
        data: {
          postId,
          userId: user.id,
        },
      });
      isSaved = true;
    }

    return { postId, isSaved };
  },

  /**
   * List saved/bookmarked posts for user
   */
  listSavedPosts: async (user, query = {}) => {
    const collegeName = getVerifiedCollegeName(user);
    const blockedUserIds = await getBlockedUserIds(user.id);

    const saved = await prisma.savedPost.findMany({
      where: {
        userId: user.id,
        post: {
          collegeName: { equals: collegeName, mode: 'insensitive' },
          category: { not: 'DELETED' },
          ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
        },
      },
      include: {
        post: {
          include: {
            author: {
              include: {
                profile: true,
                education: true,
                photos: { orderBy: { photoOrder: 'asc' } },
              },
            },
            likes: {
              where: { userId: user.id },
              select: { id: true, userId: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const posts = saved.map((s) => ({
      ...formatAnnouncement(s.post, user.id),
      isSaved: true,
      savedAt: s.createdAt,
    }));

    return {
      collegeName,
      posts,
      total: posts.length,
    };
  },

  /**
   * Campus Events: List events
   */
  listEvents: async (user, query = {}) => {
    const collegeName = getVerifiedCollegeName(user);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const where = {
      collegeName: { equals: collegeName, mode: 'insensitive' },
    };

    if (query.category && query.category !== 'All') {
      where.category = query.category;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { organizer: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.campusEvent.findMany({
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
        orderBy: { eventDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.campusEvent.count({ where }),
    ]);

    return {
      collegeName,
      events: events.map((e) => formatEvent(e, user.id)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + events.length < total,
      },
    };
  },

  /**
   * Campus Events: Create an event
   */
  createEvent: async (user, data, posterFile = null) => {
    const collegeName = getVerifiedCollegeName(user);

    let storedPosterUrl = data.posterUrl || null;
    if (posterFile && posterFile.buffer) {
      const processed = await imageService.processAndSaveAnnouncementImage(posterFile.buffer);
      storedPosterUrl = `/api/v1/campus/announcements/media/${processed.fileName}`;
    }

    const isOfficial = Boolean(
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && data.isOfficial !== false
    );

    const eventDate = data.eventDate ? new Date(data.eventDate) : new Date(Date.now() + 7 * 86400000);

    const event = await prisma.campusEvent.create({
      data: {
        collegeName,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category || 'Cultural Fest',
        eventDate,
        location: (data.location || 'Campus Auditorium').trim(),
        organizer: (data.organizer || user.displayName || 'Campus Student Community').trim(),
        posterUrl: storedPosterUrl,
        isOfficial,
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

    const formatted = formatEvent(event, user.id);

    try {
      broadcastCampusEvent(collegeName, formatted);
    } catch (e) {}

    return formatted;
  },

  /**
   * Campus Events: Delete an event
   */
  deleteEvent: async (user, eventId) => {
    const event = await prisma.campusEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      const err = new Error('Event not found.');
      err.statusCode = 404;
      throw err;
    }

    if (event.authorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const err = new Error('Unauthorized: You can delete only your own events.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.campusEvent.delete({ where: { id: eventId } });
    return { success: true, eventId };
  },

  /**
   * Moderation & Safety: Report a Post
   */
  reportPost: async (user, postId, category = 'INAPPROPRIATE', reason = '') => {
    const post = await prisma.campusAnnouncement.findUnique({
      where: { id: postId },
    });

    if (!post) {
      const err = new Error('Post not found.');
      err.statusCode = 404;
      throw err;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: post.authorId,
        category: category || 'HARASSMENT',
        reason: `[CAMPUS_POST:${postId}] ${reason || 'Reported for community guideline violation.'}`,
        status: 'PENDING',
      },
    });

    return { success: true, reportId: report.id };
  },

  /**
   * Moderation & Safety: Report a Comment
   */
  reportComment: async (user, commentId, category = 'INAPPROPRIATE', reason = '') => {
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      const err = new Error('Comment not found.');
      err.statusCode = 404;
      throw err;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: comment.authorId,
        category: category || 'HARASSMENT',
        reason: `[CAMPUS_COMMENT:${commentId}] ${reason || 'Reported comment for review.'}`,
        status: 'PENDING',
      },
    });

    return { success: true, reportId: report.id };
  },

  /**
   * Admin moderation of announcements/posts
   */
  moderateAnnouncement: async (admin, announcementId, action = 'DELETE', reason = '') => {
    const existing = await prisma.campusAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      const err = new Error('Post not found.');
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
          action: `MODERATE_POST_${action}`,
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

  /**
   * Admin moderation of comments
   */
  moderateComment: async (admin, commentId, reason = '') => {
    const existing = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!existing) {
      const err = new Error('Comment not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.$transaction(async (tx) => {
      await tx.postComment.delete({
        where: { id: commentId },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'MODERATE_DELETE_COMMENT',
          targetType: 'COMMENT',
          targetId: commentId,
          details: JSON.stringify({
            authorId: existing.authorId,
            postId: existing.postId,
            content: existing.content,
            reason: reason || 'Administrative comment removal',
          }),
        },
      });
    });

    return { success: true, commentId };
  },
};

export default campusService;
