// Collégé Mock Data Service
// Updated per user requirements: Who liked you with Accept/Reject, Go button stage transitions,
// College-exclusive Campus Board announcement group, and ₹49/₹99 (28 days) Subscription System.

export const INITIAL_USER = {
  id: 'usr_me_001',
  full_name: 'Anirban Mukherjee',
  display_name: 'Anirban',
  date_of_birth: '2003-05-14',
  age: 23,
  gender: 'Male',
  interested_in: ['Female'],
  city: 'Kharagpur',
  state: 'West Bengal',
  college_name: 'IIT Kharagpur',
  course: 'Computer Science & Engg',
  relationship_intention: 'Dating Connection',
  avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  additional_photos: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
  ],
  bio: 'Final year techie at IIT KGP, amateur guitarist, chai enthusiast. Always down for good campus conversations!',
  interests: ['Coding', 'Music', 'Travelling', 'Gaming', 'Photography'],
  languages: ['English', 'Bengali', 'Hindi'],
  is_active: true,
  verification_status: 'Selfie Verified',
  mood: 'Open to dating',
  
  // Subscription & Limits System (PRD update)
  // Free: 5 mutual matches, 50 sent requests
  // ₹49 / 28 days: 20 mutual matches, 100 sent requests
  // ₹99 / 28 days: Unlimited
  subscription_plan: 'free', // 'free' | 'pro_49' | 'unlimited_99'
  plan_expires_at: null,
  sent_requests_count: 8,
  created_at: '2026-09-01T10:00:00.000Z'
};

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    period: 'Always Free',
    max_mutual_matches: 5,
    max_sent_requests: 50,
    features: [
      'Up to 5 Mutual Matches',
      'Send up to 50 Match Requests',
      'Access to exclusive College Campus Board',
      'Text chat & 60s voice notes with mutual friends',
      'All 6 Conversation Games'
    ]
  },
  pro_49: {
    id: 'pro_49',
    name: 'Campus Pro',
    price: 49,
    period: '28 Days',
    max_mutual_matches: 20,
    max_sent_requests: 100,
    features: [
      'Up to 20 Mutual Matches (4x more)',
      'Send up to 100 Match Requests',
      'See all pending incoming likes instantly',
      'Priority posting on your College Campus Board',
      'Exclusive Campus Pro profile badge'
    ]
  },
  unlimited_99: {
    id: 'unlimited_99',
    name: 'Campus Unlimited',
    price: 99,
    period: '28 Days',
    max_mutual_matches: 9999, // unlimited
    max_sent_requests: 9999,  // unlimited
    features: [
      'Unlimited Mutual Matches',
      'Unlimited Sent Match Requests',
      'Top priority spotlight in campus Discover',
      'Broadcast highlighted announcements on Campus Board',
      'VIP Gold profile badge & unlimited boosts'
    ]
  }
};

// Profiles discovering feed
export const DISCOVER_PROFILES = [
  {
    id: 'usr_003',
    display_name: 'Sneha Roy',
    full_name: 'Sneha Roy',
    date_of_birth: '2003-11-05',
    age: 23,
    gender: 'Female',
    interested_in: ['Male'],
    city: 'Midnapore',
    state: 'West Bengal',
    college_name: 'Midnapore College (Autonomous)',
    course: 'B.Sc Physics',
    relationship_intention: 'Casual Connection',
    avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    additional_photos: [],
    bio: 'Physics geek who loves dancing Kathak and binge-watching sci-fi series. Zero relationship drama, just happy vibes!',
    interests: ['Dancing', 'Movies', 'Reading', 'Coding'],
    languages: ['Bengali', 'English'],
    verification_status: 'Selfie Verified',
    distance_km: 24,
    active_now: false,
    mood: 'Looking for a conversation'
  },
  {
    id: 'usr_005',
    display_name: 'Priyanka Das',
    full_name: 'Priyanka Das',
    date_of_birth: '2002-09-17',
    age: 24,
    gender: 'Female',
    interested_in: ['Male'],
    city: 'Kolkata',
    state: 'West Bengal',
    college_name: 'Jadavpur University',
    course: 'International Relations',
    relationship_intention: 'Casual Connection',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    additional_photos: [],
    bio: 'Debater, cafe hopper, movie buff. Tell me your top 3 comfort movies!',
    interests: ['Movies', 'Food', 'Travelling'],
    languages: ['Bengali', 'English', 'Hindi'],
    verification_status: 'Phone Verified',
    distance_km: 72,
    active_now: false,
    mood: 'Bored'
  },
  {
    id: 'usr_006',
    display_name: 'Aditi Rao',
    full_name: 'Aditi Rao',
    date_of_birth: '2003-01-22',
    age: 23,
    gender: 'Female',
    interested_in: ['Male'],
    city: 'Bengaluru',
    state: 'Karnataka',
    college_name: 'Christ University',
    course: 'Media and Communications',
    relationship_intention: 'Dating Connection',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    additional_photos: [],
    bio: 'Filter coffee advocate, podcaster. Looking for genuine campus conversations and fun games.',
    interests: ['Music', 'Fitness', 'Food', 'Gaming'],
    languages: ['English', 'Kannada', 'Hindi'],
    verification_status: 'Selfie Verified',
    distance_km: 350,
    active_now: true,
    mood: 'Open to dating'
  }
];

// INCOMING LIKES ("Who liked you") with Accept / Reject (PRD Update)
export const INITIAL_INCOMING_LIKES = [
  {
    id: 'like_inc_001',
    user: {
      id: 'usr_003',
      display_name: 'Sneha Roy',
      full_name: 'Sneha Roy',
      date_of_birth: '2003-11-05',
      age: 23,
      gender: 'Female',
      city: 'Midnapore',
      state: 'West Bengal',
      college_name: 'Midnapore College (Autonomous)',
      course: 'B.Sc Physics',
      relationship_intention: 'Casual Connection',
      avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      bio: 'Physics geek who loves dancing Kathak and sci-fi series. Zero relationship drama, just happy vibes!',
      interests: ['Dancing', 'Movies', 'Reading', 'Coding'],
      verification_status: 'Selfie Verified',
      mood: { id: 'happy', label: 'Happy', emoji: '✨' }
    },
    liked_at: '2026-11-17T21:10:00.000Z'
  },
  {
    id: 'like_inc_002',
    user: {
      id: 'usr_005',
      display_name: 'Priyanka Das',
      full_name: 'Priyanka Das',
      date_of_birth: '2002-09-17',
      age: 24,
      gender: 'Female',
      city: 'Kolkata',
      state: 'West Bengal',
      college_name: 'Jadavpur University',
      course: 'International Relations',
      relationship_intention: 'Casual Connection',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      bio: 'Debater, cafe hopper, movie buff. Tell me your top 3 comfort movies!',
      interests: ['Movies', 'Food', 'Travelling'],
      verification_status: 'Phone Verified',
      mood: { id: 'chat', label: 'Looking for a conversation', emoji: '💬' }
    },
    liked_at: '2026-11-17T22:30:00.000Z'
  },
  {
    id: 'like_inc_003',
    user: {
      id: 'usr_006',
      display_name: 'Aditi Rao',
      full_name: 'Aditi Rao',
      date_of_birth: '2003-01-22',
      age: 23,
      gender: 'Female',
      city: 'Bengaluru',
      state: 'Karnataka',
      college_name: 'Christ University',
      course: 'Media and Communications',
      relationship_intention: 'Dating Connection',
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      bio: 'Filter coffee advocate, podcaster. Looking for genuine campus conversations and fun games.',
      interests: ['Music', 'Fitness', 'Food', 'Gaming'],
      verification_status: 'Selfie Verified',
      mood: { id: 'friends', label: 'Want to make friends', emoji: '🤝' }
    },
    liked_at: '2026-11-17T23:00:00.000Z'
  }
];

// Active MUTUAL FRIENDS / MATCHES (Once accepted, they can chat!)
export const INITIAL_MUTUAL_FRIENDS = [
  {
    id: 'match_001',
    user: {
      id: 'usr_002',
      display_name: 'Riya Sen',
      full_name: 'Riya Sen',
      age: 22,
      city: 'Kolkata',
      college_name: 'St. Xavier\'s College, Kolkata',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      mood: { id: 'chat', label: 'Looking for a conversation', emoji: '💬' }
    },
    matched_at: '2026-11-17T18:00:00.000Z',
    status: 'active',
    // Stages: 'Friend' (talking) -> 'Dating' (via Go button) -> 'Relationship'
    stage: 'Friend', 
    unread_count: 1,
    go_request: null,
    last_message: {
      content: 'Hey Anirban! Happy to connect as mutual friends 😊',
      created_at: '2026-11-17T20:15:00.000Z',
      sender_id: 'usr_002',
      message_type: 'text'
    }
  },
  {
    id: 'match_002',
    user: {
      id: 'usr_004',
      display_name: 'Tanvi Sharma',
      full_name: 'Tanvi Sharma',
      age: 22,
      city: 'Kharagpur',
      college_name: 'IIT Kharagpur',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      mood: { id: 'romantic', label: 'Feeling romantic', emoji: '🌹' }
    },
    matched_at: '2026-11-16T12:00:00.000Z',
    status: 'active',
    stage: 'Friend',
    unread_count: 0,
    go_request: null,
    last_message: {
      content: 'Audio Note (0:24)',
      created_at: '2026-11-17T21:40:00.000Z',
      sender_id: 'usr_004',
      message_type: 'voice',
      duration_seconds: 24
    }
  }
];

export const INITIAL_CONVERSATIONS = {
  match_001: [
    {
      id: 'sys_100',
      sender_id: 'system',
      message_type: 'system',
      content: 'You and Riya accepted each other and are now Mutual Friends! You can now start talking freely as friends.',
      created_at: '2026-11-17T18:00:00.000Z'
    },
    {
      id: 'msg_101',
      sender_id: 'usr_002',
      message_type: 'text',
      content: 'Hey Anirban! Happy to connect as mutual friends 😊 Saw you like acoustic guitar. What hall are you in?',
      created_at: '2026-11-17T20:15:00.000Z',
      reactions: [{ user_id: 'usr_me_001', reaction: '❤️' }]
    }
  ],
  match_002: [
    {
      id: 'sys_200',
      sender_id: 'system',
      message_type: 'system',
      content: 'You and Tanvi accepted each other and became Mutual Friends! Starting in the Friend (Talking) stage.',
      created_at: '2026-11-16T12:00:00.000Z'
    },
    {
      id: 'msg_201',
      sender_id: 'usr_004',
      message_type: 'text',
      content: 'Hey Anirban! It’s cool seeing another IIT KGP student here 😄 How is your architecture/tech thesis going?',
      created_at: '2026-11-16T12:05:00.000Z',
      reactions: []
    },
    {
      id: 'msg_202',
      sender_id: 'usr_me_001',
      message_type: 'text',
      content: 'Hey Tanvi! Just finished our lab evaluation today, finally taking a breather! Have you checked out the Spring Fest band notice on our Campus Board?',
      created_at: '2026-11-16T12:10:00.000Z',
      reactions: [{ user_id: 'usr_004', reaction: '👏' }]
    },
    {
      id: 'msg_203',
      sender_id: 'usr_004',
      message_type: 'voice',
      content: 'Audio Note',
      duration_seconds: 24,
      audio_url: 'mock_audio.mp3',
      created_at: '2026-11-17T21:40:00.000Z',
      reactions: [{ user_id: 'usr_me_001', reaction: '❤️' }]
    }
  ]
};

// CAMPUS BOARD: College-exclusive announcement feed (PRD Update)
// No one from other colleges can add or view. No chat spam — strictly announcements.
export const INITIAL_CAMPUS_ANNOUNCEMENTS = [
  {
    id: 'ann_01',
    college_name: 'IIT Kharagpur',
    author_name: 'Gymkhana Cultural Council',
    author_role: 'Student Body',
    title: 'Spring Fest 2026: Eastern Acoustic Band Auditions This Friday',
    category: 'Cultural Fest',
    badge_color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    content: 'Open auditions for unplugged fusion acoustic bands for Spring Fest arena stage. Bring your own instruments to Kalidas Auditorium at 6:00 PM.',
    date: '17 Nov 2026',
    upvotes: 142,
    pinned: true
  },
  {
    id: 'ann_02',
    college_name: 'IIT Kharagpur',
    author_name: 'Debating & Literary Society',
    author_role: 'Campus Club',
    title: 'Inter-Hall Parliamentary Debate Tournament Registrations Open',
    category: 'Debate & Lit',
    badge_color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    content: 'Form 3-member teams representing your Hall of Residence. Motions will cover tech ethics, digital privacy, and global economics.',
    date: '17 Nov 2026',
    upvotes: 89,
    pinned: false
  },
  {
    id: 'ann_03',
    college_name: 'IIT Kharagpur',
    author_name: 'Rahul V. (RK Hall)',
    author_role: 'Student',
    title: 'Lost TI-84 Plus Graphing Calculator at Nalanda Complex Room 204',
    category: 'Lost & Found',
    badge_color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    content: 'Left my black graphing calculator with blue stickers on the front desk after afternoon lecture. If found, please return to RK Hall Guard Room.',
    date: '17 Nov 2026',
    upvotes: 38,
    pinned: false
  },
  {
    id: 'ann_04',
    college_name: 'IIT Kharagpur',
    author_name: 'Campus Photography Club',
    author_role: 'Campus Club',
    title: 'Golden Hour Photo-Walk Around Old Building Clock Tower',
    category: 'Social Event',
    badge_color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    content: 'Meet at 4:30 PM near the Heritage Clock Tower. Both DSLR and mobile phone photographers welcome! Chai at Tikka tapri afterwards.',
    date: '16 Nov 2026',
    upvotes: 76,
    pinned: false
  }
];

// 6 Conversation Games Data
export const CONVERSATION_GAMES = {
  truth_or_dare: {
    id: 'game_tod',
    title: 'Truth or Dare',
    description: 'College-safe questions and fun lighthearted dares.',
    truths: [
      'What is your biggest personal dream after college?',
      'What is your ideal chill weekend with friends?',
      'What makes you genuinely happy on a stressful exam week?',
      'What is the funniest campus moment you had?'
    ],
    dares: [
      'Send a voice note humming the chorus of your current favorite song.',
      'Describe yourself in exactly three words without using adjectives.',
      'Share your favorite college canteen memory in 20 seconds.'
    ]
  },
  would_you_rather: {
    id: 'game_wyr',
    title: 'Would You Rather?',
    description: 'Compare quirky lifestyle and dating choices.',
    questions: [
      { id: 'wyr_1', optionA: 'Beach sunrise with quiet chai', optionB: 'Mountain trek under misty clouds' },
      { id: 'wyr_2', optionA: 'Filter coffee in a cozy book cafe', optionB: 'Kulhad chai at 2 AM campus tapri' }
    ]
  },
  this_or_that: {
    id: 'game_tot',
    title: 'This or That',
    description: 'Rapid-fire binary picks to find shared tastes.',
    pairs: [
      { itemA: 'Coding', itemB: 'Designing' },
      { itemA: 'Early Bird', itemB: 'Night Owl' },
      { itemA: 'Group Hangouts', itemB: 'One-on-One Walks' }
    ]
  },
  twenty_questions: {
    id: 'game_20q',
    title: '20 Questions',
    description: 'Deduce what your campus friend is thinking of!'
  },
  compatibility_quiz: {
    id: 'game_quiz',
    title: 'Compatibility Quiz',
    description: 'Answer 5 lifestyle questions to calculate entertainment compatibility percentage.',
    questions: [
      {
        id: 'q1',
        prompt: 'On a free Sunday evening, where are we most likely to find you?',
        choices: ['Binge-watching shows under blankets', 'Exploring street food and cafes', 'Jamming to music or reading', 'Working on personal projects/gym']
      },
      {
        id: 'q2',
        prompt: 'What matters most to you in a college connection?',
        choices: ['Good humor and banter', 'Emotional depth and mutual respect', 'Shared passions and hobbies', 'Spontaneous fun without pressure']
      }
    ]
  },
  never_have_i_ever: {
    id: 'game_nhie',
    title: 'Never Have I Ever',
    description: 'Casual, college-friendly statements to break the ice.',
    prompts: [
      'Never have I ever fallen asleep in a 8:00 AM lecture.',
      'Never have I ever pretended to be busy to avoid small talk on campus.'
    ]
  }
};

export const MOOD_OPTIONS = [
  { id: 'bored', label: 'Bored', emoji: '🥱' },
  { id: 'happy', label: 'Happy', emoji: '✨' },
  { id: 'romantic', label: 'Feeling romantic', emoji: '🌹' },
  { id: 'friends', label: 'Want to make friends', emoji: '🤝' },
  { id: 'chat', label: 'Looking for a conversation', emoji: '💬' },
  { id: 'dating', label: 'Open to dating', emoji: '💫' }
];

export const ALL_INTERESTS = [
  'Coding', 'Music', 'Travelling', 'Movies', 'Gaming', 'Photography',
  'Sports', 'Reading', 'Dancing', 'Food', 'Fitness', 'Poetry', 'Design'
];

export const ALL_LANGUAGES = ['English', 'Bengali', 'Hindi', 'Tamil', 'Telugu', 'Marathi'];

export const ALL_INTENTIONS = [
  {
    id: 'Casual Connection',
    title: 'Casual Connection',
    description: 'Simply want to talk, enjoy conversations, share interests and pass free time.'
  },
  {
    id: 'Dating Connection',
    title: 'Dating Connection',
    description: 'Interested in exploring romantic connections naturally without immediately committing.'
  },
  {
    id: 'Serious Relationship',
    title: 'Serious Relationship',
    description: 'Looking for a committed relationship built on mutual understanding, trust and care.'
  }
];

export const ADMIN_METRICS = {
  total_users: 14820,
  active_users: 8940,
  new_registrations_today: 142,
  total_matches: 6240,
  total_messages: 94200,
  total_reports: 28,
  suspended_accounts: 14,
  pending_verifications: 19
};

export const ADMIN_REPORTS = [
  {
    id: 'rep_001',
    reporter: 'usr_002 (Riya Sen)',
    reported_user: 'usr_anon_92 (Rahul K.)',
    category: 'Abusive messages',
    description: 'User sent rude unprompted comments when declined a game request.',
    evidence: 'Reported chat snippet attached.',
    status: 'Pending',
    created_at: '2026-11-17T19:30:00.000Z'
  }
];

export const ADMIN_AUDIT_LOGS = [
  {
    id: 'log_01',
    admin: 'SuperAdmin (Anirban)',
    action: 'Banned account usr_spam_04',
    reason: 'Commercial spam violation',
    timestamp: '2026-11-17T12:00:00.000Z'
  }
];

// SEARCHABLE COLLEGES DIRECTORY
export const PREMIER_COLLEGES = [
  { id: 'col_01', name: 'Indian Institute of Technology Kharagpur', university: 'IIT Kharagpur', city: 'Kharagpur', state: 'West Bengal' },
  { id: 'col_02', name: 'St. Xavier\'s College (Autonomous), Kolkata', university: 'University of Calcutta', city: 'Kolkata', state: 'West Bengal' },
  { id: 'col_03', name: 'Jadavpur University', university: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal' },
  { id: 'col_04', name: 'Presidency University, Kolkata', university: 'Presidency University', city: 'Kolkata', state: 'West Bengal' },
  { id: 'col_05', name: 'Midnapore College (Autonomous)', university: 'Vidyasagar University', city: 'Midnapore', state: 'West Bengal' },
  { id: 'col_06', name: 'IIEST Shibpur', university: 'IIEST Shibpur', city: 'Howrah', state: 'West Bengal' },
  { id: 'col_07', name: 'Christ University, Bengaluru', university: 'Christ University', city: 'Bengaluru', state: 'Karnataka' },
  { id: 'col_08', name: 'St. Stephen\'s College, Delhi', university: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { id: 'col_09', name: 'Lady Shri Ram College for Women', university: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { id: 'col_10', name: 'Indian Institute of Technology Bombay', university: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
  { id: 'col_11', name: 'Symbiosis International University', university: 'Symbiosis Pune', city: 'Pune', state: 'Maharashtra' },
  { id: 'col_12', name: 'Loyola College, Chennai', university: 'University of Madras', city: 'Chennai', state: 'Tamil Nadu' }
];

// PENDING STUDENT REGISTRATIONS AWAITING MANUAL ADMIN VERIFICATION
export const INITIAL_PENDING_VERIFICATIONS = [
  {
    id: 'app_001',
    application_id: 'COL-2026-X82J91',
    status: 'PENDING_REVIEW', // PENDING_REVIEW | UNDER_REVIEW | NEEDS_CORRECTION | RESUBMITTED | APPROVED | REJECTED
    // Section A: Personal Information
    legal_name: 'Sourav Ganguly',
    display_name: 'Sourav',
    date_of_birth: '2004-03-12',
    age: 22,
    gender: 'Male',
    email: 'sourav.ganguly@gmail.com',
    mobile: '9830123456',
    city: 'Kolkata',
    state: 'West Bengal',
    languages_spoken: ['Bengali', 'English', 'Hindi'],
    // Section B: Education Information
    college_name: 'St. Xavier\'s College (Autonomous), Kolkata',
    university_name: 'University of Calcutta',
    college_location: 'Park Street, Kolkata',
    college_state: 'West Bengal',
    degree_name: 'Bachelor of Commerce (Honours)',
    department_stream: 'Finance & Accountancy',
    academic_year: '3rd Year',
    current_semester: 'Semester 6',
    graduation_year: 2026,
    student_status: 'CURRENTLY_STUDYING',
    // Section C: Identity Verification Document
    verification_id_type: 'College Student ID',
    verification_id_url: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80',
    verification_notes: 'Physical student smart card with photo and college seal.',
    // Section D: Exactly THREE Photographs
    photo_1: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    photo_2: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    photo_3: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    // Section E: About & Connection Preferences
    bio: 'Finance enthusiast, casual guitarist, football fan. Looking forward to genuine campus discussions and weekend chai!',
    interests: ['Finance', 'Football', 'Acoustic Guitar', 'Travelling'],
    hobbies: ['Reading economic journals', 'Weekend cycling'],
    personality: 'Ambivert & curious',
    looking_for: 'Friendship',
    age_range_min: 19,
    age_range_max: 25,
    preferred_distance: 'SAME_CITY',
    // Section F: 72-Hour Verification Deadline & Audit
    submitted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    review_deadline: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(), // 60h remaining
    assigned_admin: null,
    correction_fields: [],
    correction_message: null,
    rejection_reason: null
  },
  {
    id: 'app_002',
    application_id: 'COL-2026-M44P28',
    status: 'NEEDS_CORRECTION',
    legal_name: 'Debolina Bose',
    display_name: 'Debolina',
    date_of_birth: '2003-08-25',
    age: 23,
    gender: 'Female',
    email: 'debolina.bose@gmail.com',
    mobile: '9831987654',
    city: 'Kolkata',
    state: 'West Bengal',
    languages_spoken: ['English', 'Bengali'],
    college_name: 'Jadavpur University',
    university_name: 'Jadavpur University',
    college_location: 'Jadavpur, Kolkata',
    college_state: 'West Bengal',
    degree_name: 'Master of Arts (Literature)',
    department_stream: 'English Department',
    academic_year: '1st Year Master',
    current_semester: 'Semester 2',
    graduation_year: 2026,
    student_status: 'CURRENTLY_STUDYING',
    verification_id_type: 'College Student ID',
    verification_id_url: 'https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?auto=format&fit=crop&w=800&q=80',
    verification_notes: 'ID card uploaded had corner glare.',
    photo_1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    photo_2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    photo_3: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    bio: 'Postgrad lit researcher. Coffee, poetry recitals, and midnight deep talks.',
    interests: ['Literature', 'Poetry', 'Cafe hopping', 'Theatre'],
    hobbies: ['Creative writing', 'Independent films'],
    personality: 'Introvert with close circle',
    looking_for: 'Dating',
    age_range_min: 21,
    age_range_max: 27,
    preferred_distance: 'ANYWHERE_INDIA',
    submitted_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    review_deadline: new Date(Date.now() + 44 * 60 * 60 * 1000).toISOString(),
    assigned_admin: 'Admin Sarah',
    correction_fields: ['verification_id_url'],
    correction_message: 'Your College ID scan is partially blurred by camera glare. Please upload a clear photo of your student ID card.',
    rejection_reason: null
  },
  {
    id: 'app_003',
    application_id: 'COL-2026-K19T77',
    status: 'PENDING_REVIEW', // Overdue test (>72h)
    legal_name: 'Rohan Banerjee',
    display_name: 'Rohan',
    date_of_birth: '2002-11-14',
    age: 24,
    gender: 'Male',
    email: 'rohan.banerjee@gmail.com',
    mobile: '9832112233',
    city: 'Midnapore',
    state: 'West Bengal',
    languages_spoken: ['Bengali', 'Hindi', 'English'],
    college_name: 'Midnapore College (Autonomous)',
    university_name: 'Vidyasagar University',
    college_location: 'Midnapore Town',
    college_state: 'West Bengal',
    degree_name: 'B.Sc Computer Science',
    department_stream: 'Computer Science & Applications',
    academic_year: 'Final Year',
    current_semester: 'Semester 6',
    graduation_year: 2026,
    student_status: 'CURRENTLY_STUDYING',
    verification_id_type: 'Govt Voter ID',
    verification_id_url: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80',
    verification_notes: 'Government issued voter identity card.',
    photo_1: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    photo_2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    photo_3: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    bio: 'Final year CS geek. Built a campus hackathon bot. Always up for filter coffee and chess.',
    interests: ['Coding', 'Chess', 'Indie Games', 'Podcasts'],
    hobbies: ['Speed typing', 'Open source development'],
    personality: 'Tech optimist',
    looking_for: 'Casual chatting',
    age_range_min: 20,
    age_range_max: 26,
    preferred_distance: 'SAME_COLLEGE',
    // Submitted 75 hours ago -> OVERDUE (past 72 hours!)
    submitted_at: new Date(Date.now() - 75 * 60 * 60 * 1000).toISOString(),
    review_deadline: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    assigned_admin: null,
    correction_fields: [],
    correction_message: null,
    rejection_reason: null
  }
];
