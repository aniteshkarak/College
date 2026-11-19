import prisma from '../config/prisma.js';

// Pre-seeded premier Indian colleges & universities
export const SEED_COLLEGES = [
  { name: 'Indian Institute of Technology Kharagpur', universityName: 'IIT Kharagpur', city: 'Kharagpur', state: 'West Bengal' },
  { name: "St. Xavier's College (Autonomous), Kolkata", universityName: 'University of Calcutta', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Jadavpur University', universityName: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Presidency University, Kolkata', universityName: 'Presidency University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Midnapore College (Autonomous)', universityName: 'Vidyasagar University', city: 'Midnapore', state: 'West Bengal' },
  { name: 'Indian Institute of Engineering Science and Technology, Shibpur', universityName: 'IIEST Shibpur', city: 'Howrah', state: 'West Bengal' },
  { name: 'Christ University', universityName: 'Christ (Deemed to be University)', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Indian Institute of Science', universityName: 'IISc Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  { name: "St. Stephen's College, Delhi", universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Lady Shri Ram College for Women', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Indian Institute of Technology Bombay', universityName: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'St. Xavier’s College, Mumbai', universityName: 'University of Mumbai', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Symbiosis International University', universityName: 'Symbiosis Pune', city: 'Pune', state: 'Maharashtra' },
  { name: 'Indian Institute of Technology Madras', universityName: 'IIT Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Loyola College, Chennai', universityName: 'University of Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Indian Institute of Technology Hyderabad', universityName: 'IIT Hyderabad', city: 'Hyderabad', state: 'Telangana' }
];

export const searchColleges = async (query = '') => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return SEED_COLLEGES.slice(0, 20);
  }

  const results = SEED_COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    (c.universityName && c.universityName.toLowerCase().includes(q)) ||
    c.city.toLowerCase().includes(q) ||
    c.state.toLowerCase().includes(q)
  );

  return results;
};

export const requestNewCollege = async (collegeData, userEmail) => {
  return {
    name: collegeData.name.trim(),
    universityName: collegeData.universityName?.trim() || null,
    city: collegeData.city.trim(),
    state: collegeData.state.trim(),
    isVerified: false,
    isUserRequested: true,
    requestedByEmail: userEmail,
    createdAt: new Date().toISOString()
  };
};

export default {
  SEED_COLLEGES,
  searchColleges,
  requestNewCollege,
};
