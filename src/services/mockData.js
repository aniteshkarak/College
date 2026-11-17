// Collégé Mock Data Service
// Built according to Collégé PRD v1.0 specifications

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
  relationship_intention: 'Dating Connection', // 'Casual Connection' | 'Dating Connection' | 'Serious Relationship'
  avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  additional_photos: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
  ],
  bio: 'Final year techie, amateur guitarist, chai lover, and weekend badminton enthusiast. Here to meet authentic people and see where good conversations lead ☕🎸',
  interests: ['Coding', 'Music', 'Travelling', 'Gaming', 'Photography'],
  languages: ['English', 'Bengali', 'Hindi'],
  is_active: true,
  verification_status: 'Selfie Verified', // 'Unverified' | 'Phone Verified' | 'Selfie Verified'
  mood: 'Open to dating',
  mood_expires_at: '2026-11-18T04:00:00.000Z',
  is_premium: false,
  daily_likes_remaining: 15,
  created_at: '2026-09-01T10:00:00.000Z'
};

export const DISCOVER_PROFILES = [
  {
    id: 'usr_002',
    display_name: 'Riya Sen',
    full_name: 'Riya Sen',
    date_of_birth: '2004-08-20',
    age: 22,
    gender: 'Female',
    interested_in: ['Male'],
    city: 'Kolkata',
    state: 'West Bengal',
    college_name: 'St. Xavier\'s College, Kolkata',
    course: 'English Literature',
    relationship_intention: 'Dating Connection',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    additional_photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ],
    bio: 'Poetry in cafes, vinyl records, street photography on Park Street, and deep late-night philosophy discussions. Looking for genuine sparks.',
    interests: ['Reading', 'Photography', 'Music', 'Travelling', 'Food'],
    languages: ['Bengali', 'English', 'Hindi'],
    verification_status: 'Selfie Verified',
    distance_km: 18,
    active_now: true,
    mood: 'Want to make friends'
  },
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
    additional_photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
    ],
    bio: 'Physics geek who loves dancing Kathak and binge-watching sci-fi series. Zero relationship drama, just happy vibes and intellectual banters!',
    interests: ['Dancing', 'Movies', 'Reading', 'Coding', 'Fitness'],
    languages: ['Bengali', 'English'],
    verification_status: 'Selfie Verified',
    distance_km: 24,
    active_now: false,
    mood: 'Looking for a conversation'
  },
  {
    id: 'usr_004',
    display_name: 'Tanvi Sharma',
    full_name: 'Tanvi Sharma',
    date_of_birth: '2004-03-12',
    age: 22,
    gender: 'Female',
    interested_in: ['Male'],
    city: 'Kharagpur',
    state: 'West Bengal',
    college_name: 'IIT Kharagpur',
    course: 'Architecture & Regional Planning',
    relationship_intention: 'Serious Relationship',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    additional_photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    bio: 'Sketching old heritage corners, designing eco-spaces. Believer in old-school romance, long walks, and understanding someone deeply before taking steps forward.',
    interests: ['Travelling', 'Music', 'Photography', 'Reading', 'Fitness'],
    languages: ['Hindi', 'English'],
    verification_status: 'Selfie Verified',
    distance_km: 2,
    active_now: true,
    mood: 'Feeling romantic'
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
    bio: 'Debater, cafe hopper, movie buff. Tell me your top 3 comfort movies and let\'s see if we agree!',
    interests: ['Movies', 'Food', 'Travelling', 'Sports'],
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
    bio: 'Filter coffee advocate, podcaster, indie pop enthusiast. Looking for someone with great banter and genuine kindness.',
    interests: ['Music', 'Fitness', 'Food', 'Gaming'],
    languages: ['English', 'Kannada', 'Hindi'],
    verification_status: 'Selfie Verified',
    distance_km: 350,
    active_now: true,
    mood: 'Open to dating'
  }
];

export const INITIAL_MATCHES = [
  {
    id: 'match_001',
    user: DISCOVER_PROFILES[0], // Riya Sen
    matched_at: '2026-11-15T18:20:00.000Z',
    status: 'active',
    relationship_stage: 'Talking', // 'Matched' | 'Talking' | 'Dating' | 'Relationship'
    unread_count: 1,
    last_message: {
      content: 'Have you played Truth or Dare on here yet? We should try it!',
      created_at: '2026-11-17T20:15:00.000Z',
      sender_id: 'usr_002',
      message_type: 'text'
    }
  },
  {
    id: 'match_002',
    user: DISCOVER_PROFILES[2], // Tanvi Sharma
    matched_at: '2026-11-12T14:10:00.000Z',
    status: 'active',
    relationship_stage: 'Dating',
    unread_count: 0,
    last_message: {
      content: 'Audio Note (0:24)',
      created_at: '2026-11-17T17:40:00.000Z',
      sender_id: 'usr_004',
      message_type: 'voice',
      duration_seconds: 24
    }
  }
];

export const INITIAL_CONVERSATIONS = {
  match_001: [
    {
      id: 'msg_101',
      sender_id: 'usr_me_001',
      message_type: 'text',
      content: 'Hey Riya! Saw you like Park Street photography. Do you prefer morning light or golden hour shoots?',
      created_at: '2026-11-16T11:00:00.000Z',
      reactions: [{ user_id: 'usr_002', reaction: '❤️' }]
    },
    {
      id: 'msg_102',
      sender_id: 'usr_002',
      message_type: 'text',
      content: 'Golden hour at Flurrys always has unbeatable vibes! But nothing beats winter morning misty shots around Victoria Memorial.',
      created_at: '2026-11-16T11:05:00.000Z',
      reactions: [{ user_id: 'usr_me_001', reaction: '🔥' }]
    },
    {
      id: 'msg_103',
      sender_id: 'usr_002',
      message_type: 'text',
      content: 'Have you played Truth or Dare on here yet? We should try it!',
      created_at: '2026-11-17T20:15:00.000Z',
      reactions: []
    }
  ],
  match_002: [
    {
      id: 'msg_201',
      sender_id: 'usr_004',
      message_type: 'text',
      content: 'Hey Anirban! It’s cool seeing another IIT KGP student here 😄 What hall are you in?',
      created_at: '2026-11-14T09:30:00.000Z',
      reactions: []
    },
    {
      id: 'msg_202',
      sender_id: 'usr_me_001',
      message_type: 'text',
      content: 'Hey Tanvi! In RK Hall! Are you working on your thesis project right now?',
      created_at: '2026-11-14T09:35:00.000Z',
      reactions: [{ user_id: 'usr_004', reaction: '👏' }]
    },
    {
      id: 'msg_203',
      sender_id: 'usr_004',
      message_type: 'voice',
      content: 'Audio Note',
      duration_seconds: 24,
      audio_url: 'mock_audio_sample.mp3',
      created_at: '2026-11-17T17:40:00.000Z',
      reactions: [{ user_id: 'usr_me_001', reaction: '❤️' }]
    }
  ]
};

// 6 Signature Conversation Games
export const CONVERSATION_GAMES = {
  truth_or_dare: {
    id: 'game_tod',
    title: 'Truth or Dare',
    description: 'College-safe questions and fun lighthearted dares. No humiliating or NSFW prompts.',
    truths: [
      'What is your biggest personal dream after college?',
      'What is your ideal chill weekend date?',
      'What makes you genuinely happy on a stressful exam week?',
      'What is the funniest or most embarrassing campus moment you had?',
      'If you could swap majors for a week, what would you study?'
    ],
    dares: [
      'Send a voice note humming the chorus of your current favorite song.',
      'Describe yourself in exactly three words without using adjectives.',
      'Share a funny college canteen memory in 20 seconds.',
      'Recommend your absolute top comfort food and explain why in one sentence.'
    ]
  },
  would_you_rather: {
    id: 'game_wyr',
    title: 'Would You Rather?',
    description: 'Compare quirky lifestyle and dating choices with your match.',
    questions: [
      { id: 'wyr_1', optionA: 'Beach sunrise with quiet chai', optionB: 'Mountain trek under misty clouds' },
      { id: 'wyr_2', optionA: 'Filter coffee in a cozy book cafe', optionB: 'Kulhad chai at 2 AM campus tapri' },
      { id: 'wyr_3', optionA: 'Spontaneous late-night road trip', optionB: 'Cozy weekend binge of 90s nostalgia films' },
      { id: 'wyr_4', optionA: 'Modern love story found online', optionB: 'Classic Bollywood style chance encounter' }
    ]
  },
  this_or_that: {
    id: 'game_tot',
    title: 'This or That',
    description: 'Rapid-fire binary picks to find shared tastes.',
    pairs: [
      { itemA: 'Coding', itemB: 'Designing' },
      { itemA: 'Early Bird', itemB: 'Night Owl' },
      { itemA: 'Street Food', itemB: 'Fine Dine' },
      { itemA: 'Texting all day', itemB: 'One meaningful voice note' },
      { itemA: 'Group Hangouts', itemB: 'One-on-One Walks' }
    ]
  },
  twenty_questions: {
    id: 'game_20q',
    title: '20 Questions',
    description: 'Think of an object, hobby, or place. The other person has 20 questions to guess it!',
    starter_hints: [
      'Think of your favorite place on campus.',
      'Think of an Indian street food delicacy.',
      'Think of a musical artist you secretly love.'
    ]
  },
  compatibility_quiz: {
    id: 'game_quiz',
    title: 'Compatibility Quiz',
    description: 'Both answer 5 lifestyle questions to calculate entertainment compatibility percentage.',
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
      },
      {
        id: 'q3',
        prompt: 'How do you prefer handling miscommunications?',
        choices: ['Talk it out promptly in private', 'Give space for an hour, then discuss calmly', 'Send a thoughtful voice note', 'Laugh it off if minor']
      },
      {
        id: 'q4',
        prompt: 'What is your communication style?',
        choices: ['Thoughtful long paragraphs', 'Quick instant banter & memes', 'Occasional meaningful voice notes', 'Quiet companionship']
      },
      {
        id: 'q5',
        prompt: 'Your relationship philosophy:',
        choices: ['Let friendships bloom naturally first', 'Know intentions clearly from day one', 'Go with the flow and enjoy the journey', 'Focus on serious mutual long-term compatibility']
      }
    ]
  },
  never_have_i_ever: {
    id: 'game_nhie',
    title: 'Never Have I Ever',
    description: 'Casual, college-friendly "Never Have I Ever" statements to break the ice.',
    prompts: [
      'Never have I ever fallen asleep in a 8:00 AM lecture.',
      'Never have I ever pretended to be busy to avoid small talk on campus.',
      'Never have I ever binged an entire season of a show in a single night before an exam.',
      'Never have I ever rehearsed a conversation in the mirror before sending a text.',
      'Never have I ever ordered midnight Maggi or biryani during exam week.'
    ]
  }
};

export const DAILY_QUESTIONS = [
  {
    id: 'dq_today',
    question: 'What is your biggest personal goal outside of academics right now?',
    category: 'Aspirations',
    total_answers: 428,
    sample_answers: [
      { user: 'Riya (Kolkata)', text: 'Publishing my first illustrated poetry zine before graduating!' },
      { user: 'Arjun (Kharagpur)', text: 'Learning classical acoustic fingerstyle guitar without quitting halfway.' },
      { user: 'Megha (Pune)', text: 'Solo travelling across Himachal Pradesh this winter.' }
    ]
  },
  {
    id: 'dq_prev1',
    question: 'What is your ultimate comfort meal when you are homesick at hostel?',
    category: 'College Life',
    total_answers: 612
  },
  {
    id: 'dq_prev2',
    question: 'What does genuine friendship mean to you in the digital era?',
    category: 'Values',
    total_answers: 519
  }
];

export const MOOD_OPTIONS = [
  { id: 'bored', label: 'Bored', emoji: '🥱', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'happy', label: 'Happy', emoji: '✨', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'romantic', label: 'Feeling romantic', emoji: '🌹', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'friends', label: 'Want to make friends', emoji: '🤝', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'chat', label: 'Looking for a conversation', emoji: '💬', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'dating', label: 'Open to dating', emoji: '💫', color: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export const ALL_INTERESTS = [
  'Coding', 'Music', 'Travelling', 'Movies', 'Gaming', 'Photography',
  'Sports', 'Reading', 'Dancing', 'Food', 'Fitness', 'Poetry', 'Design',
  'Anime', 'Debating', 'Cafe Hopping', 'Art & Sketching'
];

export const ALL_LANGUAGES = [
  'English', 'Bengali', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Gujarati', 'Malayalam', 'Punjabi'
];

export const ALL_INTENTIONS = [
  {
    id: 'Casual Connection',
    title: 'Casual Connection',
    description: 'Simply want to talk, enjoy conversations, share interests and pass free time without pressure.'
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

// Admin Metrics & Reports Mock Data
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
    evidence: 'Reported chat snippet attached (flagged language detected).',
    status: 'Pending',
    created_at: '2026-11-17T19:30:00.000Z'
  },
  {
    id: 'rep_002',
    reporter: 'usr_004 (Tanvi Sharma)',
    reported_user: 'usr_fake_11 (ModelPics)',
    category: 'Fake profile',
    description: 'Profile using commercial catalog photos found online.',
    evidence: 'Reverse image match indicated commercial stock photography.',
    status: 'Under review',
    created_at: '2026-11-17T16:10:00.000Z'
  },
  {
    id: 'rep_003',
    reporter: 'usr_003 (Sneha Roy)',
    reported_user: 'usr_spam_04 (CryptoGuy)',
    category: 'Spam',
    description: 'Sending unsolicited telegram investment group invitations.',
    evidence: 'External link detected in introductory chat message.',
    status: 'Action taken',
    created_at: '2026-11-17T11:00:00.000Z'
  }
];

export const ADMIN_AUDIT_LOGS = [
  {
    id: 'log_01',
    admin: 'SuperAdmin (Anirban)',
    action: 'Banned account usr_spam_04',
    reason: 'Commercial spam violation (Rule 4.2)',
    timestamp: '2026-11-17T12:00:00.000Z'
  },
  {
    id: 'log_02',
    admin: 'ContentMod (Pooja M.)',
    action: 'Verified Selfie ID for usr_006',
    reason: 'Live liveness check passed successfully',
    timestamp: '2026-11-17T10:15:00.000Z'
  }
];
