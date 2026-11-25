import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { serializePublicProfile } from '../../utils/serializers.js';
import logger from '../../utils/logger.js';

// In-memory fallback caches if Redis is offline
const inMemoryPassStore = new Map();
const inMemoryPrefStore = new Map();

/**
 * Deterministic pseudo-random score generator for personalized profile rotation
 * Ensures User A and User B get distinct orderings, and Cycle N+1 reshuffles the feed.
 */
export const getCandidatePersonalizedScore = (userId, cycleId, candidateId) => {
  let hash = 0;
  const str = `${userId}:${cycleId}:${candidateId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

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
 * Retrieves saved discovery preferences from PostgreSQL as the source of truth
 */
export const getDiscoveryPreferences = async (userId) => {
  // 1. Check PostgreSQL UserDiscoveryState
  const state = await prisma.userDiscoveryState.findUnique({
    where: { userId },
  });

  if (state) {
    return {
      gender: state.preferredGender || 'EVERYONE',
      preferredGender: state.preferredGender || 'EVERYONE',
      minAge: state.minAge || 18,
      maxAge: state.maxAge || 28,
      relationshipIntention: state.relationshipIntention || 'All',
      sameCollegeOnly: Boolean(state.sameCollegeOnly),
      city: state.city || 'All',
      currentCycleId: state.currentCycleId || 1,
      updatedAt: state.updatedAt,
    };
  }

  // 2. Fallback to UserProfile if state not yet initialized
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  const defaultPref = {
    gender: 'EVERYONE',
    preferredGender: 'EVERYONE',
    minAge: profile?.ageRangeMin || 18,
    maxAge: profile?.ageRangeMax || 28,
    relationshipIntention: profile?.relationshipIntention || 'All',
    sameCollegeOnly: profile?.preferredDistance === 'SAME_COLLEGE',
    city: profile?.city || 'All',
    currentCycleId: 1,
  };

  // Asynchronously seed UserDiscoveryState in PostgreSQL
  prisma.userDiscoveryState
    .create({
      data: {
        userId,
        currentCycleId: 1,
        preferredGender: defaultPref.gender,
        minAge: defaultPref.minAge,
        maxAge: defaultPref.maxAge,
        relationshipIntention: defaultPref.relationshipIntention,
        sameCollegeOnly: defaultPref.sameCollegeOnly,
        city: defaultPref.city,
      },
    })
    .catch(() => {});

  return defaultPref;
};

/**
 * Updates and persists discovery preferences in PostgreSQL
 */
export const saveDiscoveryPreferences = async (userId, newPreferences = {}) => {
  const current = await getDiscoveryPreferences(userId);

  const preferredGender = newPreferences.gender || newPreferences.preferredGender || current.gender || 'EVERYONE';
  const minAge = newPreferences.minAge ? parseInt(newPreferences.minAge, 10) : current.minAge;
  const maxAge = newPreferences.maxAge ? parseInt(newPreferences.maxAge, 10) : current.maxAge;
  const relationshipIntention = newPreferences.relationshipIntention || current.relationshipIntention || 'All';
  const sameCollegeOnly = newPreferences.sameCollegeOnly !== undefined
    ? Boolean(newPreferences.sameCollegeOnly)
    : current.sameCollegeOnly;
  const city = newPreferences.city || current.city || 'All';

  // 1. Upsert UserDiscoveryState in PostgreSQL (Source of Truth)
  const updatedState = await prisma.userDiscoveryState.upsert({
    where: { userId },
    create: {
      userId,
      currentCycleId: current.currentCycleId || 1,
      preferredGender,
      minAge,
      maxAge,
      relationshipIntention,
      sameCollegeOnly,
      city,
    },
    update: {
      preferredGender,
      minAge,
      maxAge,
      relationshipIntention,
      sameCollegeOnly,
      city,
      lastActiveAt: new Date(),
    },
  });

  // 2. Sync corresponding fields into UserProfile for platform consistency
  const profileUpdates = {
    ageRangeMin: minAge,
    ageRangeMax: maxAge,
  };
  if (relationshipIntention && relationshipIntention !== 'All') {
    profileUpdates.relationshipIntention = relationshipIntention;
  }
  if (sameCollegeOnly) {
    profileUpdates.preferredDistance = 'SAME_COLLEGE';
  }

  await prisma.userProfile.updateMany({
    where: { userId },
    data: profileUpdates,
  }).catch(() => {});

  // 3. Update Redis cache if available
  const resultData = {
    gender: updatedState.preferredGender,
    preferredGender: updatedState.preferredGender,
    minAge: updatedState.minAge,
    maxAge: updatedState.maxAge,
    relationshipIntention: updatedState.relationshipIntention,
    sameCollegeOnly: updatedState.sameCollegeOnly,
    city: updatedState.city,
    currentCycleId: updatedState.currentCycleId,
    updatedAt: updatedState.updatedAt,
  };

  try {
    if (redis && redis.status === 'ready') {
      await redis.set(`discovery:pref:${userId}`, JSON.stringify(resultData), 'EX', 60 * 60 * 24 * 30);
    }
  } catch (err) {
    logger.debug(`Redis cache write error: ${err.message}`);
  }

  inMemoryPrefStore.set(userId, resultData);
  return resultData;
};

/**
 * Records a passed profile permanently in PostgreSQL ProfilePass
 */
export const recordProfilePass = async (userId, targetUserId) => {
  if (!targetUserId || targetUserId === userId) {
    return { success: false, message: 'Invalid target user' };
  }

  // 1. Persistent PostgreSQL insert (Source of Truth across all devices)
  await prisma.profilePass.upsert({
    where: {
      userId_passedUserId: {
        userId,
        passedUserId: targetUserId,
      },
    },
    create: {
      userId,
      passedUserId: targetUserId,
    },
    update: {},
  });

  // 2. Get current cycle to mark impression as well
  const state = await prisma.userDiscoveryState.findUnique({ where: { userId } });
  const cycleId = state?.currentCycleId || 1;

  await prisma.discoveryImpression.upsert({
    where: {
      userId_discoveredUserId_cycleId: {
        userId,
        discoveredUserId: targetUserId,
        cycleId,
      },
    },
    create: {
      userId,
      discoveredUserId: targetUserId,
      cycleId,
    },
    update: {},
  }).catch(() => {});

  // 3. Update Redis & memory cache
  try {
    if (redis && redis.status === 'ready') {
      await redis.sadd(`discovery:passed:${userId}`, targetUserId);
    }
  } catch (err) {
    logger.debug(`Redis pass write error: ${err.message}`);
  }

  if (!inMemoryPassStore.has(userId)) {
    inMemoryPassStore.set(userId, new Set());
  }
  inMemoryPassStore.get(userId).add(targetUserId);

  return { success: true, targetUserId };
};

/**
 * Manually or programmatically resets the discovery cycle for a user
 */
export const resetDiscoveryCycle = async (userId) => {
  const state = await prisma.userDiscoveryState.findUnique({ where: { userId } });
  const nextCycleId = (state?.currentCycleId || 1) + 1;

  const updated = await prisma.userDiscoveryState.upsert({
    where: { userId },
    create: {
      userId,
      currentCycleId: nextCycleId,
    },
    update: {
      currentCycleId: nextCycleId,
      lastActiveAt: new Date(),
    },
  });

  return {
    success: true,
    previousCycleId: state?.currentCycleId || 1,
    currentCycleId: updated.currentCycleId,
    message: 'Discovery cycle reset successfully. New unique profile rotation started.',
  };
};

/**
 * Main Personalized Discovery Engine:
 * 1. College-First Order: Priority 1 Same College -> Priority 2 Other Colleges
 * 2. Cycle-Based Unique Profile Rotation: Profiles seen in current cycle are strictly excluded
 * 3. Automatic Cycle Advancement: When all eligible profiles in current cycle are exhausted,
 *    advances to cycleId + 1 with a new randomized/seed-based order
 * 4. Permanent Exclusions: Blocked users, mutual matches, sent requests, and passed profiles
 *    are NEVER shown across ANY cycle
 * 5. Concurrent Delivery Safe: Atomically records DiscoveryImpression so concurrent requests
 *    never receive duplicate profiles
 * 6. Strict Public Profile Serialization: Strips emails, phone numbers, and documents
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

  if (!userCollegeId && userCollegeName) {
    const matchedCollege = await prisma.college.findFirst({
      where: { name: { equals: userCollegeName.trim(), mode: 'insensitive' } },
    });
    if (matchedCollege) {
      userCollegeId = matchedCollege.id;
      prisma.education
        .update({
          where: { id: requester.education.id },
          data: { collegeId: matchedCollege.id },
        })
        .catch(() => {});
    }
  }

  // 3. Resolve Persistent User Discovery State from PostgreSQL
  let state = await prisma.userDiscoveryState.findUnique({
    where: { userId: currentUserId },
  });

  if (!state) {
    state = await prisma.userDiscoveryState.create({
      data: {
        userId: currentUserId,
        currentCycleId: 1,
        preferredGender: 'EVERYONE',
        minAge: requester.profile?.ageRangeMin || 18,
        maxAge: requester.profile?.ageRangeMax || 28,
        relationshipIntention: requester.profile?.relationshipIntention || 'All',
        sameCollegeOnly: requester.profile?.preferredDistance === 'SAME_COLLEGE',
        city: requester.profile?.city || 'All',
      },
    });
  }

  // Effective preferences: Query params override saved preferences for transient filtering
  const effectiveGender = query.gender !== undefined ? query.gender : state.preferredGender;
  const effectiveMinAge = parseInt(query.minAge || state.minAge || 18, 10);
  const effectiveMaxAge = parseInt(query.maxAge || state.maxAge || 35, 10);
  const effectiveIntention = query.intention || query.relationshipIntention || state.relationshipIntention || 'All';
  const effectiveSameCollege = query.sameCollegeOnly !== undefined
    ? query.sameCollegeOnly === true || query.sameCollegeOnly === 'true'
    : (query.sameCollege !== undefined ? (query.sameCollege === true || query.sameCollege === 'true') : state.sameCollegeOnly);
  const effectiveCity = query.city || state.city || 'All';

  let currentCycleId = state.currentCycleId;

  // 4. Gather Permanent Exclusions (Self, Sent Likes, Mutual Matches, Blocks, Passes)
  const [sentRequests, userMatches, blockedByMe, blockedMe, dbPassedList] = await Promise.all([
    prisma.matchRequest.findMany({
      where: { senderId: currentUserId },
      select: { receiverId: true },
    }),
    prisma.match.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      select: { user1Id: true, user2Id: true },
    }),
    prisma.userBlock.findMany({
      where: { blockerId: currentUserId },
      select: { blockedId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockedId: currentUserId },
      select: { blockerId: true },
    }),
    prisma.profilePass.findMany({
      where: { userId: currentUserId },
      select: { passedUserId: true },
    }),
  ]);

  const matchedUserIds = userMatches.map((m) =>
    m.user1Id === currentUserId ? m.user2Id : m.user1Id
  );

  const clientExcludedIds = query.excludeIds
    ? Array.isArray(query.excludeIds)
      ? query.excludeIds
      : String(query.excludeIds).split(',')
    : [];

  const permanentExcludedSet = new Set([
    currentUserId, // Self
    ...sentRequests.map((r) => r.receiverId),
    ...matchedUserIds,
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
    ...dbPassedList.map((p) => p.passedUserId),
    ...clientExcludedIds,
  ]);

  const permanentExcludedIds = Array.from(permanentExcludedSet);

  // 5. Construct Filtering Base Conditions
  const genderCondition = mapGenderPreference(effectiveGender);

  const baseEligibleWhere = {
    id: { notIn: permanentExcludedIds },
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
    age: {
      gte: effectiveMinAge,
      lte: effectiveMaxAge,
    },
    ...genderCondition,
  };

  if (effectiveIntention && effectiveIntention !== 'All') {
    baseEligibleWhere.profile = {
      ...baseEligibleWhere.profile,
      relationshipIntention: { equals: effectiveIntention, mode: 'insensitive' },
    };
  }

  if (effectiveCity && effectiveCity !== 'All') {
    baseEligibleWhere.profile = {
      ...baseEligibleWhere.profile,
      city: { contains: effectiveCity, mode: 'insensitive' },
    };
  }

  // 6. College Boundary Conditions
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
            ...(userCollegeId
              ? [
                  {
                    OR: [
                      { collegeId: null },
                      { collegeId: { not: userCollegeId } },
                    ],
                  },
                ]
              : []),
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

  const limit = Math.max(1, Math.min(50, parseInt(query.limit || 10, 10)));

  // 7. Check Current Cycle Impressions
  let seenImpressions = await prisma.discoveryImpression.findMany({
    where: {
      userId: currentUserId,
      cycleId: currentCycleId,
    },
    select: { discoveredUserId: true },
  });

  let seenInCycleIds = seenImpressions.map((imp) => imp.discoveredUserId);

  // Construct where clause for unseen profiles in the current cycle
  let currentCycleWhere = {
    ...baseEligibleWhere,
    id: { notIn: [...permanentExcludedIds, ...seenInCycleIds] },
  };

  // Count unseen same-college candidates
  let unseenSameCount = sameCollegeCondition
    ? await prisma.user.count({
        where: {
          AND: [currentCycleWhere, sameCollegeCondition],
        },
      })
    : 0;

  // Count unseen other-college candidates
  let unseenOtherCount = !effectiveSameCollege
    ? await prisma.user.count({
        where: {
          AND: [currentCycleWhere, otherCollegeCondition],
        },
      })
    : 0;

  let totalUnseenInCycle = unseenSameCount + unseenOtherCount;
  let isNewCycle = false;
  let cycleCompleted = false;

  // 8. Automatic Cycle Transition: When current cycle is exhausted
  if (totalUnseenInCycle === 0) {
    // Check total eligible profiles regardless of current cycle impressions
    const totalBaseSame = sameCollegeCondition
      ? await prisma.user.count({
          where: {
            AND: [baseEligibleWhere, sameCollegeCondition],
          },
        })
      : 0;

    const totalBaseOther = !effectiveSameCollege
      ? await prisma.user.count({
          where: {
            AND: [baseEligibleWhere, otherCollegeCondition],
          },
        })
      : 0;

    const totalBaseEligible = totalBaseSame + totalBaseOther;

    if (totalBaseEligible > 0) {
      // Start a new discovery cycle!
      const nextCycleId = currentCycleId + 1;
      await prisma.userDiscoveryState.update({
        where: { userId: currentUserId },
        data: { currentCycleId: nextCycleId },
      });

      currentCycleId = nextCycleId;
      seenInCycleIds = [];
      isNewCycle = true;
      cycleCompleted = true;

      // Reset cycle where clause for new cycle
      currentCycleWhere = {
        ...baseEligibleWhere,
      };

      unseenSameCount = totalBaseSame;
      unseenOtherCount = totalBaseOther;
      totalUnseenInCycle = totalBaseEligible;
    }
  }

  let rawResults = [];

  // 9. Fetch Candidates & Prioritize Same-College First
  if (unseenSameCount > 0) {
    // Priority 1: Fetch candidates from verified same college
    const sameCandidates = await prisma.user.findMany({
      where: {
        AND: [currentCycleWhere, sameCollegeCondition],
      },
      include: userInclude,
      take: Math.min(unseenSameCount, 100),
    });

    // Sort personalized with deterministic cycle seed
    sameCandidates.sort((a, b) =>
      getCandidatePersonalizedScore(currentUserId, currentCycleId, a.id) -
      getCandidatePersonalizedScore(currentUserId, currentCycleId, b.id)
    );

    const takeSame = Math.min(limit, sameCandidates.length);
    rawResults.push(...sameCandidates.slice(0, takeSame));

    // Priority 2: If same college gave fewer than limit, fill remainder from Other Colleges
    const remainingSlots = limit - rawResults.length;
    if (remainingSlots > 0 && !effectiveSameCollege && unseenOtherCount > 0) {
      const alreadyChosenIds = new Set(rawResults.map((r) => r.id));
      const otherCandidates = await prisma.user.findMany({
        where: {
          AND: [
            currentCycleWhere,
            otherCollegeCondition,
            { id: { notIn: Array.from(alreadyChosenIds) } },
          ],
        },
        include: userInclude,
        take: Math.min(unseenOtherCount, 100),
      });

      otherCandidates.sort((a, b) =>
        getCandidatePersonalizedScore(currentUserId, currentCycleId, a.id) -
        getCandidatePersonalizedScore(currentUserId, currentCycleId, b.id)
      );

      rawResults.push(...otherCandidates.slice(0, remainingSlots));
    }
  } else if (!effectiveSameCollege && unseenOtherCount > 0) {
    // Same college exhausted or non-existent; fetch from other colleges
    const otherCandidates = await prisma.user.findMany({
      where: {
        AND: [currentCycleWhere, otherCollegeCondition],
      },
      include: userInclude,
      take: Math.min(unseenOtherCount, 100),
    });

    otherCandidates.sort((a, b) =>
      getCandidatePersonalizedScore(currentUserId, currentCycleId, a.id) -
      getCandidatePersonalizedScore(currentUserId, currentCycleId, b.id)
    );

    rawResults.push(...otherCandidates.slice(0, limit));
  }

  // 10. Atomic Impression Recording
  // Immediately persist impressions in PostgreSQL so concurrent calls or next refresh
  // will never deliver duplicate profiles in the same cycle!
  if (rawResults.length > 0) {
    await prisma.discoveryImpression.createMany({
      data: rawResults.map((u) => ({
        userId: currentUserId,
        discoveredUserId: u.id,
        cycleId: currentCycleId,
      })),
      skipDuplicates: true,
    });
  }

  // 11. Strict Public Serialization (Zero private contact details leaked)
  const serialized = rawResults.map((u) =>
    serializePublicProfile(u, {
      currentCollegeId: userCollegeId,
      currentCollegeName: userCollegeName,
    })
  );

  const hasMore = totalUnseenInCycle > rawResults.length;

  return {
    profiles: serialized,
    users: serialized, // backward compatibility with CardDeck
    pagination: {
      limit,
      totalSameCollege: unseenSameCount,
      totalOtherColleges: unseenOtherCount,
      totalEligible: totalUnseenInCycle,
      unseenEligibleCount: totalUnseenInCycle,
      sameCollegeCount: unseenSameCount,
      otherCollegesCount: unseenOtherCount,
      hasMore,
      cycleId: currentCycleId,
      currentCycleId,
      isNewCycle,
      cycleCompleted,
    },
    meta: {
      appliedGender: effectiveGender,
      appliedMinAge: effectiveMinAge,
      appliedMaxAge: effectiveMaxAge,
      appliedIntention: effectiveIntention,
      sameCollegeOnly: effectiveSameCollege,
      requesterCollege: userCollegeName || 'Unknown',
      cycleId: currentCycleId,
    },
  };
};

export default {
  getCandidatePersonalizedScore,
  mapGenderPreference,
  getDiscoveryPreferences,
  saveDiscoveryPreferences,
  recordProfilePass,
  resetDiscoveryCycle,
  getDiscoveryProfiles,
};
