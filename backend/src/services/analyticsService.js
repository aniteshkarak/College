import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

export const EVENT_TYPES = {
  REGISTRATION_COMPLETED: 'REGISTRATION_COMPLETED',
  APPLICATION_APPROVED: 'APPLICATION_APPROVED',
  LOGIN_SUCCESSFUL: 'LOGIN_SUCCESSFUL',
  PROFILE_COMPLETED: 'PROFILE_COMPLETED',
  DISCOVERY_OPENED: 'DISCOVERY_OPENED',
  LIKE_SENT: 'LIKE_SENT',
  MATCH_ACCEPTED: 'MATCH_ACCEPTED',
  CONVERSATION_STARTED: 'CONVERSATION_STARTED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  VOICE_MESSAGE_SENT: 'VOICE_MESSAGE_SENT',
  POST_CREATED: 'POST_CREATED',
};

/**
 * Get start and end of a specific date in Asia/Kolkata timezone
 */
export const getKolkataDateBounds = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(date); // YYYY-MM-DD
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { dateStr, startOfDay, endOfDay };
};

/**
 * Strips sensitive keys recursively from metadata before persistence
 */
const sanitizeMetadata = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const sensitiveKeys = [
    'password', 'passwordHash', 'token', 'refreshToken', 'secret',
    'content', 'body', 'message', 'voiceDuration', 'audioUrl',
    'document', 'documentNumber', 'identityDocument', 'smtp'
  ];

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const analyticsService = {
  EVENT_TYPES,
  getKolkataDateBounds,

  /**
   * Tracks an event asynchronously. Never throws or halts parent request execution.
   */
  trackEvent: async ({ eventType, userId = null, collegeName = null, metadata = null }) => {
    try {
      const cleanMetadata = sanitizeMetadata(metadata);
      return await prisma.analyticsEvent.create({
        data: {
          eventType,
          userId,
          collegeName,
          metadata: cleanMetadata || undefined,
        },
      });
    } catch (err) {
      logger.warn(`[ANALYTICS] Non-critical tracking error: ${err.message}`);
      return null;
    }
  },

  /**
   * Calculates real-time database overview statistics
   */
  getOverviewStats: async () => {
    const now = new Date();
    const { startOfDay, endOfDay } = getKolkataDateBounds(now);

    const sevenDaysAgo = new Date(startOfDay.getTime() - 6 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(startOfDay.getTime() - 29 * 24 * 60 * 60 * 1000);

    const [
      totalRegistered,
      totalApproved,
      pendingApplications,
      todayRegistrations,
      todayApprovals,
      todayMatches,
      todayMessages,
      todayPosts,
      totalMatches,
      totalConversations,
      totalMessages,
      totalCampusPosts,
      unresolvedReports,
      dauSessions,
      wauSessions,
      mauSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.pendingRegistration.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.user.count({ where: { approvedAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.match.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.message.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.campusAnnouncement.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          category: { not: 'DELETED' },
        },
      }),
      prisma.match.count({ where: { status: 'ACTIVE' } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.campusAnnouncement.count({ where: { category: { not: 'DELETED' } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),

      // DAU: Unique users active today
      prisma.userSession.findMany({
        where: { lastActivityAt: { gte: startOfDay, lte: endOfDay } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      // WAU: Unique users active last 7 days
      prisma.userSession.findMany({
        where: { lastActivityAt: { gte: sevenDaysAgo, lte: endOfDay } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      // MAU: Unique users active last 30 days
      prisma.userSession.findMany({
        where: { lastActivityAt: { gte: thirtyDaysAgo, lte: endOfDay } },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    const dau = Math.max(dauSessions.length, todayRegistrations);
    const wau = Math.max(wauSessions.length, dau);
    const mau = Math.max(mauSessions.length, wau);

    return {
      timezone: 'Asia/Kolkata',
      asOf: now.toISOString(),
      overview: {
        totalRegistered,
        totalApproved,
        pendingApplications,
        dau,
        wau,
        mau,
        successfulMatches: totalMatches,
        totalConversations,
        messagesSent: totalMessages,
        voiceMessagesSent: todayMessages,
        campusPosts: totalCampusPosts,
        unresolvedReports,
      },
      students: {
        totalRegistered,
        totalApproved,
        pendingApplications,
        newRegistrationsToday: todayRegistrations,
        approvalsToday: todayApprovals,
      },
      engagement: {
        dau,
        wau,
        mau,
        stickinessDauMauRatio: mau > 0 ? `${((dau / mau) * 100).toFixed(1)}%` : '0.0%',
      },
      social: {
        totalMatches,
        totalConversations,
        totalMessages,
        totalCampusPosts,
        unresolvedReports,
        todayMatches,
        todayMessages,
        todayPosts,
      },
    };
  },

  /**
   * Generates time-series product trend charts with date filters (7d, 30d, 90d, custom)
   */
  getProductTrends: async ({ range = '7d', startDate = null, endDate = null } = {}) => {
    let start;
    let end;
    const now = new Date();

    if (range === 'custom' && startDate && endDate) {
      start = new Date(`${startDate}T00:00:00+05:30`);
      end = new Date(`${endDate}T23:59:59.999+05:30`);
    } else {
      const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
      const { startOfDay, endOfDay } = getKolkataDateBounds(now);
      end = endOfDay;
      start = new Date(startOfDay.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    }

    // Generate continuous date keys in Asia/Kolkata
    const dateBuckets = {};
    const cursor = new Date(start.getTime());
    while (cursor <= end) {
      const { dateStr } = getKolkataDateBounds(cursor);
      dateBuckets[dateStr] = {
        date: dateStr,
        registrations: 0,
        approvals: 0,
        matches: 0,
        messages: 0,
        posts: 0,
        activeUsers: 0,
      };
      cursor.setDate(cursor.getDate() + 1);
    }

    // Parallel aggregate queries within the range
    const [
      users,
      approvals,
      matches,
      messages,
      posts,
      sessions,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { approvedAt: { gte: start, lte: end } },
        select: { approvedAt: true },
      }),
      prisma.match.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.message.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.campusAnnouncement.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          category: { not: 'DELETED' },
        },
        select: { createdAt: true },
      }),
      prisma.userSession.findMany({
        where: { lastActivityAt: { gte: start, lte: end } },
        select: { lastActivityAt: true, userId: true },
      }),
    ]);

    // Populate daily buckets
    for (const u of users) {
      const { dateStr } = getKolkataDateBounds(u.createdAt);
      if (dateBuckets[dateStr]) dateBuckets[dateStr].registrations++;
    }

    for (const a of approvals) {
      if (a.approvedAt) {
        const { dateStr } = getKolkataDateBounds(a.approvedAt);
        if (dateBuckets[dateStr]) dateBuckets[dateStr].approvals++;
      }
    }

    for (const m of matches) {
      const { dateStr } = getKolkataDateBounds(m.createdAt);
      if (dateBuckets[dateStr]) dateBuckets[dateStr].matches++;
    }

    for (const msg of messages) {
      const { dateStr } = getKolkataDateBounds(msg.createdAt);
      if (dateBuckets[dateStr]) dateBuckets[dateStr].messages++;
    }

    for (const p of posts) {
      const { dateStr } = getKolkataDateBounds(p.createdAt);
      if (dateBuckets[dateStr]) dateBuckets[dateStr].posts++;
    }

    // Map unique active users per day
    const dailyActiveSet = {};
    for (const s of sessions) {
      const { dateStr } = getKolkataDateBounds(s.lastActivityAt);
      if (!dailyActiveSet[dateStr]) dailyActiveSet[dateStr] = new Set();
      dailyActiveSet[dateStr].add(s.userId);
    }
    for (const [dateStr, userSet] of Object.entries(dailyActiveSet)) {
      if (dateBuckets[dateStr]) dateBuckets[dateStr].activeUsers = userSet.size;
    }

    const timeSeries = Object.values(dateBuckets);

    // Fetch event distribution for analytics events
    const rawEvents = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
    }).catch(() => []);

    const eventDistribution = {};
    let totalEventsCount = 0;
    for (const item of rawEvents) {
      eventDistribution[item.eventType] = item._count.id;
      totalEventsCount += item._count.id;
    }

    const timeline = timeSeries.map((t) => ({
      date: t.date,
      dau: t.activeUsers || 0,
      totalEvents: (t.registrations || 0) + (t.approvals || 0) + (t.matches || 0) + (t.messages || 0) + (t.posts || 0),
      ...t,
    }));

    return {
      range,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      timeZone: 'Asia/Kolkata',
      totalDays: timeSeries.length,
      timeSeries,
      timeline,
      eventDistribution,
      totalEventsCount,
    };
  },
};

export default analyticsService;
