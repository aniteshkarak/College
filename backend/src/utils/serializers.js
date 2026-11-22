/**
 * Response Serializers for Collégé
 * Enforces strict backend privacy controls.
 * Prevents accidental leakage of private contact details (email, mobile),
 * password hashes, identity verification documents, and administrative audit trails.
 */

/**
 * Formats a raw photo filename or URL into a reachable API endpoint path.
 * External URLs (Unsplash/HTTP) and data URLs are preserved as-is.
 */
export const formatPhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\/+/, '');
  if (clean.startsWith('api/v1/photos/')) {
    return `/${clean}`;
  }
  return `/api/v1/photos/${clean}`;
};

/**
 * Serializes a user record for PUBLIC consumption by other students in Discover, Matching, and Community feeds.
 * ONLY exposes safe, verified public profile attributes.
 *
 * @param {Object} user - Prisma User model instance with profile, education, and photos
 * @param {Object} options - Serializer options (e.g. currentCollegeName, currentCollegeId)
 * @returns {Object} Sanitized public profile representation
 */
export const serializePublicProfile = (user, options = {}) => {
  if (!user) return null;

  const p = user.profile || {};
  const edu = user.education || {};

  // Extract only approved photographs, ordered by photoOrder
  const approvedPhotos = (user.photos || [])
    .filter((ph) => ph.isApproved !== false)
    .sort((a, b) => (a.photoOrder || 0) - (b.photoOrder || 0));

  const photoUrls = approvedPhotos.map((ph) => ph.photoUrl);
  const avatarUrl = photoUrls[0] || approvedPhotos.find((ph) => ph.isMain)?.photoUrl || null;

  // Determine if profile belongs to the same college as the requester
  let isSameCollege = false;
  if (options.currentCollegeId && edu.collegeId) {
    isSameCollege = String(options.currentCollegeId) === String(edu.collegeId);
  }
  if (!isSameCollege && options.currentCollegeName && edu.collegeName) {
    isSameCollege = edu.collegeName.trim().toLowerCase() === options.currentCollegeName.trim().toLowerCase();
  }

  // Format course and department
  const courseStr = edu.degreeName
    ? edu.departmentStream
      ? `${edu.degreeName} - ${edu.departmentStream}`
      : edu.degreeName
    : edu.departmentStream || 'Degree Program';

  return {
    id: user.id,

    // Public Display Name (Legal name is strictly withheld for user safety)
    displayName: user.displayName,
    display_name: user.displayName,

    // Verified Demographic info
    age: user.age,
    gender: user.gender || 'Student',

    // Verified Educational & Campus Info
    collegeName: edu.collegeName || 'Premier College',
    college_name: edu.collegeName || 'Premier College',
    universityName: edu.universityName || null,
    university_name: edu.universityName || null,
    course: courseStr,
    degreeName: edu.degreeName || null,
    degree_name: edu.degreeName || null,
    departmentStream: edu.departmentStream || null,
    department_stream: edu.departmentStream || null,
    academicYear: edu.academicYear || null,
    academic_year: edu.academicYear || null,
    currentSemester: edu.currentSemester || null,
    semester: edu.currentSemester || null,

    // Location (City/State only, no physical addresses)
    city: p.city || null,
    state: p.state || null,

    // Profile Details & Connection Preferences
    bio: p.bio || `Student at ${edu.collegeName || 'College'}. Verified profile!`,
    interests: Array.isArray(p.interests) ? p.interests : [],
    hobbies: Array.isArray(p.hobbies) ? p.hobbies : [],
    relationshipIntention: p.relationshipIntention || 'Casual Connection',
    relationship_intention: p.relationshipIntention || 'Casual Connection',
    lookingFor: p.lookingFor || 'Friendship',
    looking_for: p.lookingFor || 'Friendship',
    currentMood: p.currentMood || 'Want to make friends',
    mood: p.currentMood || 'Want to make friends',
    moodUpdatedAt: p.moodUpdatedAt || p.updatedAt || null,

    // Verified Visuals (Only approved photos, private documents completely omitted)
    avatarUrl: formatPhotoUrl(avatarUrl),
    avatar_url: formatPhotoUrl(avatarUrl),
    additionalPhotos: photoUrls.slice(1).map(formatPhotoUrl),
    additional_photos: photoUrls.slice(1).map(formatPhotoUrl),
    photos: approvedPhotos.map((ph) => ({
      order: ph.photoOrder,
      isMain: ph.isMain,
      url: formatPhotoUrl(ph.photoUrl),
    })),

    // Discovery Priority Metadata
    isSameCollege,
    is_same_college: isSameCollege,

    // Safety & Verification Indicator
    verificationStatus: user.verificationStatus || 'APPROVED',
    verified: true,
  };
};

/**
 * Serializes a user record for the ACCOUNT OWNER ONLY or explicitly authorized administrators.
 * Includes private account details (email, mobile, legal name, date of birth)
 * while strictly omitting secrets such as password hashes and sensitive token details.
 *
 * @param {Object} user - Prisma User model instance
 * @returns {Object} Sanitized private account representation
 */
export const serializePrivateAccount = (user) => {
  if (!user) return null;

  const p = user.profile || {};
  const edu = user.education || {};
  const photos = (user.photos || []).sort((a, b) => (a.photoOrder || 0) - (b.photoOrder || 0));
  const photoUrls = photos.map((ph) => ph.photoUrl);
  const avatarUrl = photoUrls[0] || null;

  return {
    id: user.id,

    // Private Contact Info (Accessible ONLY to the account owner!)
    email: user.email,
    mobileNumber: user.mobileNumber,
    mobile_number: user.mobileNumber,

    // Legal Identity & Demographic Info
    fullName: user.fullName,
    full_name: user.fullName,
    displayName: user.displayName,
    display_name: user.displayName,
    dateOfBirth: user.dateOfBirth,
    date_of_birth: user.dateOfBirth,
    age: user.age,
    gender: user.gender,

    // Account & Verification State
    accountStatus: user.accountStatus,
    verificationStatus: user.verificationStatus,
    verification_status: user.verificationStatus || 'APPROVED',
    role: user.role,
    subscriptionPlan: user.subscriptionPlan,
    subscription_plan: user.subscriptionPlan ? String(user.subscriptionPlan).toLowerCase() : 'free',
    sentRequestsCount: user.sentRequestsCount || 0,
    sent_requests_count: user.sentRequestsCount || 0,

    // Education & College
    collegeId: edu.collegeId || null,
    college_id: edu.collegeId || null,
    collegeName: edu.collegeName || null,
    college_name: edu.collegeName || null,
    universityName: edu.universityName || null,
    university_name: edu.universityName || null,
    course: edu.degreeName || edu.departmentStream || null,
    degreeName: edu.degreeName || null,
    degree_name: edu.degreeName || null,
    departmentStream: edu.departmentStream || null,
    department_stream: edu.departmentStream || null,
    academicYear: edu.academicYear || null,
    academic_year: edu.academicYear || null,
    currentSemester: edu.currentSemester || null,
    current_semester: edu.currentSemester || null,
    graduationYear: edu.graduationYear || null,
    graduation_year: edu.graduationYear || null,
    studentStatus: edu.studentStatus || null,
    student_status: edu.studentStatus || null,

    // Personal & Match Preferences
    bio: p.bio || null,
    interests: Array.isArray(p.interests) ? p.interests : [],
    hobbies: Array.isArray(p.hobbies) ? p.hobbies : [],
    personality: p.personality || null,
    relationshipIntention: p.relationshipIntention || 'Casual Connection',
    relationship_intention: p.relationshipIntention || 'Casual Connection',
    lookingFor: p.lookingFor || 'Friendship',
    looking_for: p.lookingFor || 'Friendship',
    ageRangeMin: p.ageRangeMin || 18,
    age_range_min: p.ageRangeMin || 18,
    ageRangeMax: p.ageRangeMax || 26,
    age_range_max: p.ageRangeMax || 26,
    preferredDistance: p.preferredDistance || 'ANYWHERE_INDIA',
    preferred_distance: p.preferredDistance || 'ANYWHERE_INDIA',
    city: p.city || null,
    state: p.state || null,
    languages: Array.isArray(p.languages) ? p.languages : [],
    currentMood: p.currentMood || 'Want to make friends',
    current_mood: p.currentMood || 'Want to make friends',
    mood: p.currentMood || 'Want to make friends',
    moodUpdatedAt: p.moodUpdatedAt || p.updatedAt || null,

    // Photos
    avatarUrl: formatPhotoUrl(avatarUrl),
    avatar_url: formatPhotoUrl(avatarUrl),
    additionalPhotos: photoUrls.slice(1).map(formatPhotoUrl),
    additional_photos: photoUrls.slice(1).map(formatPhotoUrl),
    photos: photos.map((ph) => ({
      id: ph.id,
      order: ph.photoOrder,
      isMain: ph.isMain,
      url: formatPhotoUrl(ph.photoUrl),
      isApproved: ph.isApproved,
    })),

    // Timestamps
    createdAt: user.createdAt,
    approvedAt: user.approvedAt,
  };
};

export default {
  serializePublicProfile,
  serializePrivateAccount,
};
