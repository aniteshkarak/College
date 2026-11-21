import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

// Fallback premier Indian colleges & universities
export const SEED_COLLEGES = [
  { name: 'Indian Institute of Technology Kharagpur', universityName: 'IIT Kharagpur', city: 'Kharagpur', state: 'West Bengal' },
  { name: "St. Xavier's College (Autonomous), Kolkata", universityName: 'University of Calcutta', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Jadavpur University', universityName: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Presidency University, Kolkata', universityName: 'Presidency University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Midnapore College (Autonomous)', universityName: 'Vidyasagar University', city: 'Midnapore', state: 'West Bengal' },
  { name: 'Indian Institute of Engineering Science and Technology, Shibpur', universityName: 'IIEST Shibpur', city: 'Howrah', state: 'West Bengal' },
  { name: 'Christ University', universityName: 'Christ (Deemed to be University)', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Indian Institute of Science (IISc)', universityName: 'IISc Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  { name: "St. Stephen's College, Delhi", universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Lady Shri Ram College for Women', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Hindu College, University of Delhi', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Miranda House, University of Delhi', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Shri Ram College of Commerce (SRCC)', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Indian Institute of Technology Bombay', universityName: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
  { name: "St. Xavier's College, Mumbai", universityName: 'University of Mumbai', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Symbiosis International University', universityName: 'Symbiosis Pune', city: 'Pune', state: 'Maharashtra' },
  { name: 'Fergusson College (Autonomous), Pune', universityName: 'Savitribai Phule Pune University', city: 'Pune', state: 'Maharashtra' },
  { name: 'Indian Institute of Technology Madras', universityName: 'IIT Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Loyola College, Chennai', universityName: 'University of Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Madras Christian College (MCC)', universityName: 'University of Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Indian Institute of Technology Hyderabad', universityName: 'IIT Hyderabad', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Birla Institute of Technology and Science (BITS), Pilani', universityName: 'BITS Pilani', city: 'Pilani', state: 'Rajasthan' },
  { name: 'National Institute of Technology, Tiruchirappalli', universityName: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { name: 'National Institute of Technology, Rourkela', universityName: 'NIT Rourkela', city: 'Rourkela', state: 'Odisha' },
  { name: 'National Institute of Technology, Durgapur', universityName: 'NIT Durgapur', city: 'Durgapur', state: 'West Bengal' },
  { name: 'Delhi Technological University (DTU)', universityName: 'Delhi Technological University', city: 'New Delhi', state: 'Delhi' },
];

export const searchColleges = async (query = '') => {
  const q = query.trim();

  try {
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { universityName: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { state: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const dbColleges = await prisma.college.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
      select: {
        id: true,
        name: true,
        universityName: true,
        city: true,
        state: true,
        isVerified: true,
      },
    });

    if (dbColleges && dbColleges.length > 0) {
      return dbColleges;
    }
  } catch (err) {
    logger.warn(`PostgreSQL college query notice: ${err.message}`);
  }

  // Resilient fallback to memory list if database is initializing
  if (!q) {
    return SEED_COLLEGES.slice(0, 30);
  }

  const lowerQ = q.toLowerCase();
  return SEED_COLLEGES.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQ) ||
      (c.universityName && c.universityName.toLowerCase().includes(lowerQ)) ||
      c.city.toLowerCase().includes(lowerQ) ||
      c.state.toLowerCase().includes(lowerQ)
  );
};

export const requestNewCollege = async (collegeData, userEmail) => {
  try {
    const created = await prisma.college.create({
      data: {
        name: collegeData.name.trim(),
        universityName: collegeData.universityName?.trim() || null,
        city: collegeData.city.trim(),
        state: collegeData.state.trim(),
        isVerified: false,
        isUserRequested: true,
        requestedByEmail: userEmail,
      },
    });
    return created;
  } catch (err) {
    // If the college was already inserted, return existing
    const existing = await prisma.college.findUnique({
      where: { name: collegeData.name.trim() },
    });
    if (existing) {
      return existing;
    }
    throw err;
  }
};

export default {
  SEED_COLLEGES,
  searchColleges,
  requestNewCollege,
};
