// Collage Story Platform Configuration & Static Options Service
// Clean production state: False/mock records deleted so all users, matches,
// conversations, announcements, and verifications are loaded dynamically from the PostgreSQL database.

export const INITIAL_USER = null;

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

// Profiles discovering feed (Populated strictly from backend PostgreSQL)
export const DISCOVER_PROFILES = [];

// Incoming likes awaiting response (Populated strictly from backend PostgreSQL)
export const INITIAL_INCOMING_LIKES = [];

// Active mutual friends / matches (Populated strictly from backend PostgreSQL)
export const INITIAL_MUTUAL_FRIENDS = [];

// Conversations threads (Populated strictly from backend PostgreSQL)
export const INITIAL_CONVERSATIONS = {};

// Campus Board announcements feed (Populated strictly from backend PostgreSQL)
export const INITIAL_CAMPUS_ANNOUNCEMENTS = [];

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
      'Never have I ever fallen asleep in an 8:00 AM lecture.',
      'Never have I ever pretended to be busy to avoid small talk on campus.'
    ]
  }
};

export const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy & Vibe', emoji: '✨' },
  { id: 'sad', label: 'Feeling Sad', emoji: '🥺' },
  { id: 'feeling_bad', label: 'Feeling Bad / Low', emoji: '🌧️' },
  { id: 'bored', label: 'Bored', emoji: '🥱' },
  { id: 'lonely', label: 'Feeling Lonely', emoji: '🫂' },
  { id: 'stressed', label: 'Stressed / Overwhelmed', emoji: '🤯' },
  { id: 'romantic', label: 'Feeling Romantic', emoji: '🌹' },
  { id: 'dating', label: 'Open to Dating', emoji: '💫' },
  { id: 'friends', label: 'Want to make friends', emoji: '🤝' },
  { id: 'chat', label: 'Looking for a conversation', emoji: '💬' },
  { id: 'chill', label: 'Chilling & Relaxed', emoji: '☕' },
  { id: 'excited', label: 'Excited & Hyped', emoji: '🎉' },
  { id: 'studying', label: 'In Study Mode', emoji: '📚' },
  { id: 'heartbroken', label: 'Heartbroken', emoji: '💔' },
  { id: 'playful', label: 'Playful & Fun', emoji: '😜' }
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
  total_users: 0,
  active_users: 0,
  new_registrations_today: 0,
  total_matches: 0,
  total_messages: 0,
  total_reports: 0,
  suspended_accounts: 0,
  pending_verifications: 0
};

export const ADMIN_REPORTS = [];

export const ADMIN_AUDIT_LOGS = [];

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

// PENDING STUDENT REGISTRATIONS AWAITING MANUAL ADMIN VERIFICATION (Populated strictly from backend PostgreSQL)
export const INITIAL_PENDING_VERIFICATIONS = [];
