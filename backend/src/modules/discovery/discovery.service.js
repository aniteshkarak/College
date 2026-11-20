import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { serializePublicProfile } from '../../utils/serializers.js';
import logger from '../../utils/logger.js';

// Fallback in-memory store for session passes and preferences if Redis is offline
const inMemoryPassStore = new Map();
const inMemoryPrefStore = new Map();

/**
 * Standardizes gender preference values into Prisma query filters
 */
export const mapGenderPreference = (gender) => {
  if (!gender) return {};

  const clean = String(gender).trim().toUpperCase();

  if (['FEMALE', 'WOMEN', 'WOMAN', 'F'].includes(clean)) {
    return {
      gender: { in: ['Female', 'female', 'FEMALE', 'Woman', 'Women'] },
    };
  }

  if (['MALE', 'MEN', 'MAN', 'M'].includes(clean)) {
    return {
      gender: { in: ['Male', 'male', 'MALE', 'Man', 'Men'] },
    };
  }

  // EVERYONE / ALL / ANY
  return {};
};

/**
 * Retrieves saved discovery preferences for a user
 */
export const getDiscoveryPreferences = async (userId) => {
  try {
    if (redis && redis.status === 'ready') {
      const cached = await redis.get(`discovery:pref:${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    logger.debug(`Redis read error for preferences: ${err.message}`);
  }

  // Fallback to in-memory store
  if (inMemoryPrefStore.has(userId)) {
    return inMemoryPrefStore.get(userId);
  }

  // Default to UserProfile preferences
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  return {
    gender: 'EVERYONE',
    minAge: profile?.ageRangeMin || 18,
    maxAge: profile?.ageRangeMax || 28,
    relationshipIntention: profile?.relationshipIntention || 'All',
    city: profile?.city || 'All',
    maxDistance: profile?.preferredDistance === 'SAME_COLLEGE' ? 10 : 100,
  };
};

/**
 * Updates and persists discovery preferences for a user
 */
export const saveDiscoveryPreferences = async (userId, newPreferences = {}) => {
  const current = await getDiscoveryPreferences(userId);
  const updated = {
    ...current,
    ...newPreferences,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (redis && redis.status === 'ready') {
      await redis.set(`discovery:pref:${userId}`, JSON.stringify(updated), 'EX', 60 * 60 * 24 * 30); // 30 days
    }
  } catch (err) {
    logger.debug(`Redis write error for preferences: ${err.message}`);
  }

  inMemoryPrefStore.set(userId, updated);

  // Sync back to UserProfile if relevant fields are present
  const profileUpdates = {};
  if (newPreferences.minAge) profileUpdates.ageRangeMin = parseInt(newPreferences.minAge, 10);
  if (newPreferences.maxAge) profileUpdates.ageRangeMax = parseInt(newPreferences.maxAge, 10);
  if (newPreferences.relationshipIntention && newPreferences.relationshipIntention !== 'All') {
    profileUpdates.relationshipIntention = newPreferences.relationshipIntention;
  }

  if (Object.keys(profileUpdates).length > 0) {
    await prisma.userProfile.updateMany({
      where: { userId },
      data: profileUpdates,
    }).catch(() => {});
  }

  return updated;
};

/**
 * Records a passed profile for a user so it is excluded from future discovery
 */
export const recordProfilePass = async (userId, targetUserId) => {
  if (!targetUserId || targetUserId === userId) return;

  try {
    if (redis && redis.status === 'ready') {
      await redis.sadd(`discovery:passed:${userId}`, targetUserId);
    }
  } catch (err) {
    logger.debug(`Redis write error for pass: ${err.message}`);
  }

  // In-memory fallback
  if (!inMemoryPassStore.has(userId)) {
    inMemoryPassStore.set(userId, new Set());
  }
  inMemoryPassStore.get(userId).add(targetUserId);

  return { success: true, targetUserId };
};

/**
 * Main Discovery Engine:
 * 1. College-First Order: Priority 1 Same College -> Priority 2 Other Colleges
 * 2. Robust Exhaustion Check: Exhausts all same-college profiles before other colleges
 * 3. Gender, Age & Intention Filtering applied strictly on backend
 * 4. Comprehensive Exclusion Rules (self, likes, mutual matches, blocks, passes)
 * 5. Strict Public Profile Serialization (No private contact details)
 */
export const getDiscoveryProfiles = async (currentUserId, query = {}) => {
  // 1. Fetch current requester's full verified record
  const requester = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: {
      education: { include: { college: true } },
      profile: true,
    },
  });

  if (!requester) {
    throw new Error('Authenticated user account not found');
  }

  if (requester.accountStatus !== 'ACTIVE') {
    const err = new Error('Your account is not active. Access to Discovery is restricted.');
    err.statusCode = 403;
    err.code = 'ACCOUNT_NOT_ACTIVE';
    throw err;
  }

  if (requester.verificationStatus !== 'APPROVED') {
    const err = new Error('Your account is pending manual administrator verification.');
    err.statusCode = 403;
    err.code = 'VERIFICATION_NOT_APPROVED';
    throw err;
  }

  // 2. Identify Requester's College
  let userCollegeId = requester.education?.collegeId || requester.education?.college?.id || null;
  const userCollegeName = requester.education?.collegeName || requester.education?.college?.name || null;

  // Stable college ID resolution if not already linked
  if (!userCollegeId && userCollegeName) {
    const matchedCollege = await prisma.college.findFirst({
      where: { name: { equals: userCollegeName.trim(), mode: 'insensitive' } },
    });
    if (matchedCollege) {
      userCollegeId = matchedCollege.id;
      // Persist association asynchronously
      prisma.education.update({
        where: { id: requester.education.id },
        data: { collegeId: matchedCollege.id },
      }).catch(() => {});
    }
  }

  // 3. Resolve Active Preferences (Query params override saved preferences)
  const savedPref = await getDiscoveryPreferences(currentUserId);
  const effectiveGender = query.gender !== undefined ? query.gender : savedPref.gender;
  const effectiveMinAge = parseInt(query.minAge || savedPref.minAge || 18, 10);
  const effectiveMaxAge = parseInt(query.maxAge || savedPref.maxAge || 35, 10);
  const effectiveIntention = query.intention || query.relationshipIntention || savedPref.relationshipIntention || 'All';
  const effectiveCity = query.city || savedPref.city || 'All';

  // 4. Gather Excluded User IDs
  const [sentRequests, userMatches, blockedByMe, blockedMe] = await Promise.all([
    // Sent likes / requests
    prisma.matchRequest.findMany({
      where: { senderId: currentUserId },
      select: { receiverId: true },
    }),
    // Mutual matches (active, blocked, unmatched)
    prisma.match.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      select: { user1Id: true, user2Id: true },
    }),
    // Users blocked by requester
    prisma.userBlock.findMany({
      where: { blockerId: currentUserId },
      select: { blockedId: true },
    }),
    // Users who blocked requester
    prisma.userBlock.findMany({
      where: { blockedId: currentUserId },
      select: { blockerId: true },
    }),
  ]);

  const matchedUserIds = userMatches.map((m) =>
    m.user1Id === currentUserId ? m.user2Id : m.user1Id
  );

  // Retrieve passed profiles from Redis & In-Memory fallback
  let passedFromRedis = [];
  try {
    if (redis && redis.status === 'ready') {
      passedFromRedis = await redis.smembers(`discovery:passed:${currentUserId}`);
    }
  } catch (err) {
    logger.debug(`Redis smembers passed: ${err.message}`);
  }

  const memoryPassed = inMemoryPassStore.get(currentUserId)
    ? Array.from(inMemoryPassStore.get(currentUserId))
    : [];

  const clientExcludedIds = query.excludeIds
    ? Array.isArray(query.excludeIds)
      ? query.excludeIds
      : String(query.excludeIds).split(',')
    : [];

  const clientPassedIds = query.passedIds
    ? Array.isArray(query.passedIds)
      ? query.passedIds
      : String(query.passedIds).split(',')
    : [];

  const excludedSet = new Set([
    currentUserId, // Never show own profile
    ...sentRequests.map((r) => r.receiverId),
    ...matchedUserIds,
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
    ...passedFromRedis,
    ...memoryPassed,
    ...clientExcludedIds,
    ...clientPassedIds,
  ]);

  const excludedIds = Array.from(excludedSet);

  // 5. Construct Filtering Conditions
  const genderCondition = mapGenderPreference(effectiveGender);

  const baseWhere = {
    id: { notIn: excludedIds },
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
    age: {
      gte: effectiveMinAge,
      lte: effectiveMaxAge,
    },
    ...genderCondition,
  };

  if (effectiveIntention && effectiveIntention !== 'All') {
    baseWhere.profile = {
      ...baseWhere.profile,
      relationshipIntention: { equals: effectiveIntention, mode: 'insensitive' },
    };
  }

  if (effectiveCity && effectiveCity !== 'All') {
    baseWhere.profile = {
      ...baseWhere.profile,
      city: { contains: effectiveCity, mode: 'insensitive' },
    };
  }

  // 6. Build Mutually Exclusive Same-College vs Other-Colleges Queries
  const sameCollegeSubqueries = [];
  if (userCollegeId) {
    sameCollegeSubqueries.push({ education: { collegeId: userCollegeId } });
  }
  if (userCollegeName) {
    sameCollegeSubqueries.push({
      education: { collegeName: { equals: userCollegeName.trim(), mode: 'insensitive' } },
    });
  }

  const hasCollegeInfo = sameCollegeSubqueries.length > 0;
  const sameCollegeCondition = hasCollegeInfo ? { OR: sameCollegeSubqueries } : null;

  const otherCollegeCondition = hasCollegeInfo
    ? {
        education: {
          AND: [
            ...(userCollegeId ? [{ NOT: { collegeId: userCollegeId } }] : []),
            ...(userCollegeName
              ? [{ NOT: { collegeName: { equals: userCollegeName.trim(), mode: 'insensitive' } } }]
              : []),
          ],
        },
      }
    : {};

  // Standard user include with approved photos and education
  const userInclude = {
    profile: true,
    education: { include: { college: true } },
    photos: {
      where: { isApproved: true },
      orderBy: { photoOrder: 'asc' },
    },
  };

  // 7. Robust Exhaustion Check & Continuous Pagination
  const page = Math.max(1, parseInt(query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || 20, 10)));
  const offset = (page - 1) * limit;

  // Count total eligible same-college profiles
  const totalSameCollege = sameCollegeCondition
    ? await prisma.user.count({
        where: {
          AND: [baseWhere, sameCollegeCondition],
        },
      })
    : 0;

  // Count total eligible other-college profiles
  const totalOtherColleges = await prisma.user.count({
    where: {
      AND: [baseWhere, otherCollegeCondition],
    },
  });

  const totalEligible = totalSameCollege + totalOtherColleges;

  let rawResults = [];

  if (offset < totalSameCollege) {
    // Priority 1: Same College has eligible profiles for this page
    const takeSame = Math.min(limit, totalSameCollege - offset);

    const sameProfiles = await prisma.user.findMany({
      where: {
        AND: [baseWhere, sameCollegeCondition],
      },
      include: userInclude,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: takeSame,
    });

    rawResults.push(...sameProfiles);

    // If same college was exhausted within this page, fill remaining slots with Other Colleges
    const remainingSlots = limit - takeSame;
    if (remainingSlots > 0) {
      const otherProfiles = await prisma.user.findMany({
        where: {
          AND: [baseWhere, otherCollegeCondition],
        },
        include: userInclude,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: remainingSlots,
      });

      rawResults.push(...otherProfiles);
    }
  } else {
    // Priority 2: Same College is completely exhausted! Fetch strictly from Other Colleges
    const skipOther = offset - totalSameCollege;

    const otherProfiles = await prisma.user.findMany({
      where: {
        AND: [baseWhere, otherCollegeCondition],
      },
      include: userInclude,
      orderBy: { createdAt: 'desc' },
      skip: skipOther,
      take: limit,
    });

    rawResults.push(...otherProfiles);
  }

  // 8. Strict Public Serialization
  const serialized = rawResults.map((u) =>
    serializePublicProfile(u, {
      currentCollegeId: userCollegeId,
      currentCollegeName: userCollegeName,
    })
  );

  const isSameCollegeExhausted = offset + rawResults.length >= totalSameCollege;
  const hasMore = offset + rawResults.length < totalEligible;

  return {
    profiles: serialized,
    users: serialized, // backward compatibility with existing components
    pagination: {
      page,
      limit,
      totalSameCollege,
      totalOtherColleges,
      totalEligible,
      isSameCollegeExhausted,
      hasMore,
    },
    meta: {
      appliedGender: effectiveGender,
      appliedMinAge: effectiveMinAge,
      appliedMaxAge: effectiveMaxAge,
      appliedIntention: effectiveIntention,
      requesterCollege: userCollegeName || 'Unknown',
    },
  };
};

export default {
  mapGenderPreference,
  getDiscoveryPreferences,
  saveDiscoveryPreferences,
  recordProfilePass,
  getDiscoveryProfiles,
};
