import argon2 from 'argon2';
import dotenv from 'dotenv';
import prisma from '../src/config/prisma.js';

dotenv.config();

// 30 Premier Indian Colleges & Universities
export const REAL_COLLEGES = [
  { name: 'Indian Institute of Technology Kharagpur', universityName: 'IIT Kharagpur', city: 'Kharagpur', state: 'West Bengal' },
  { name: 'Indian Institute of Technology Bombay', universityName: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Indian Institute of Technology Delhi', universityName: 'IIT Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Indian Institute of Technology Madras', universityName: 'IIT Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Indian Institute of Technology Kanpur', universityName: 'IIT Kanpur', city: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Indian Institute of Technology Roorkee', universityName: 'IIT Roorkee', city: 'Roorkee', state: 'Uttarakhand' },
  { name: 'Indian Institute of Technology Guwahati', universityName: 'IIT Guwahati', city: 'Guwahati', state: 'Assam' },
  { name: 'Indian Institute of Technology Hyderabad', universityName: 'IIT Hyderabad', city: 'Hyderabad', state: 'Telangana' },
  { name: "St. Xavier's College (Autonomous), Kolkata", universityName: 'University of Calcutta', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Jadavpur University', universityName: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Presidency University, Kolkata', universityName: 'Presidency University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Midnapore College (Autonomous)', universityName: 'Vidyasagar University', city: 'Midnapore', state: 'West Bengal' },
  { name: 'Indian Institute of Engineering Science and Technology, Shibpur', universityName: 'IIEST Shibpur', city: 'Howrah', state: 'West Bengal' },
  { name: "St. Stephen's College, Delhi", universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Lady Shri Ram College for Women', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Hindu College, University of Delhi', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Miranda House, University of Delhi', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: 'Shri Ram College of Commerce (SRCC)', universityName: 'University of Delhi', city: 'New Delhi', state: 'Delhi' },
  { name: "St. Xavier's College, Mumbai", universityName: 'University of Mumbai', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Symbiosis International University', universityName: 'Symbiosis Pune', city: 'Pune', state: 'Maharashtra' },
  { name: 'Fergusson College (Autonomous), Pune', universityName: 'Savitribai Phule Pune University', city: 'Pune', state: 'Maharashtra' },
  { name: 'Christ University', universityName: 'Christ (Deemed to be University)', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Indian Institute of Science (IISc)', universityName: 'IISc Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Loyola College, Chennai', universityName: 'University of Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Madras Christian College (MCC)', universityName: 'University of Madras', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Birla Institute of Technology and Science (BITS), Pilani', universityName: 'BITS Pilani', city: 'Pilani', state: 'Rajasthan' },
  { name: 'National Institute of Technology, Tiruchirappalli', universityName: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { name: 'National Institute of Technology, Rourkela', universityName: 'NIT Rourkela', city: 'Rourkela', state: 'Odisha' },
  { name: 'National Institute of Technology, Durgapur', universityName: 'NIT Durgapur', city: 'Durgapur', state: 'West Bengal' },
  { name: 'Delhi Technological University (DTU)', universityName: 'Delhi Technological University', city: 'New Delhi', state: 'Delhi' },
];

async function main() {
  console.log('=== Collage Story Database Sanitization & Population ===');

  // 1. Delete false / duplicate automated test data (timestamped test accounts)
  console.log('1. Cleaning false timestamped test records...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.matchRequest.deleteMany();
  await prisma.match.deleteMany();
  await prisma.userBlock.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.report.deleteMany();
  await prisma.campusAnnouncement.deleteMany();

  // Delete timestamped test pending registrations & users
  const deletePendingResult = await prisma.pendingRegistration.deleteMany({
    where: {
      email: { contains: '17951' }
    }
  });
  console.log(`Deleted ${deletePendingResult.count} false test pending registrations.`);

  const deleteUsersResult = await prisma.user.deleteMany({
    where: {
      email: { contains: '17951' }
    }
  });
  console.log(`Deleted ${deleteUsersResult.count} false test user accounts.`);

  // 2. Populate PostgreSQL `College` table with 30 premier institutions
  console.log('\n2. Populating PostgreSQL College table...');
  for (const c of REAL_COLLEGES) {
    await prisma.college.upsert({
      where: { name: c.name },
      update: {
        universityName: c.universityName,
        city: c.city,
        state: c.state,
        isVerified: true,
      },
      create: {
        name: c.name,
        universityName: c.universityName,
        city: c.city,
        state: c.state,
        isVerified: true,
      },
    });
  }
  const collegeCount = await prisma.college.count();
  console.log(`PostgreSQL College table now has ${collegeCount} verified institutions.`);

  // 3. Ensure Administrators exist in PostgreSQL Admin table
  console.log('\n3. Verifying Administrator accounts in PostgreSQL...');
  const superPassword = process.env.ADMIN_SUPER_PASSWORD;
  const platformPassword = process.env.ADMIN_REVIEWER_PASSWORD;
  if (!superPassword || !platformPassword) {
    throw new Error('ADMIN_SUPER_PASSWORD and ADMIN_REVIEWER_PASSWORD must be defined in environment.');
  }
  const userPassHash = await argon2.hash(superPassword);
  const leadReviewerHash = await argon2.hash(platformPassword);

  await prisma.admin.upsert({
    where: { email: 'aniteeshkarak@gmail.com' },
    update: {
      passwordHash: userPassHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'aniteeshkarak@gmail.com',
      passwordHash: userPassHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  await prisma.admin.upsert({
    where: { email: 'aniteshkarak@gmail.com' },
    update: {
      passwordHash: userPassHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'aniteshkarak@gmail.com',
      passwordHash: userPassHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  await prisma.admin.upsert({
    where: { email: 'admin@college.internal' },
    update: {
      passwordHash: leadReviewerHash,
      fullName: 'Collage Story Lead Reviewer',
      roleName: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@college.internal',
      passwordHash: leadReviewerHash,
      fullName: 'Collage Story Lead Reviewer',
      roleName: 'ADMIN',
      isActive: true,
    },
  });

  const adminCount = await prisma.admin.count();
  console.log(`PostgreSQL Admin table now has ${adminCount} administrator accounts.`);

  // 4. Create 3 clean, authentic verified sample students for real discovery & campus board
  console.log('\n4. Creating verified campus student accounts for Discovery & Campus Board...');
  const studentPasswordHash = await argon2.hash('Student@2026Pass');

  const jadavpurCollege = await prisma.college.findFirst({ where: { name: { contains: 'Jadavpur', mode: 'insensitive' } } });
  const iitkgpCollege = await prisma.college.findFirst({ where: { name: { contains: 'Kharagpur', mode: 'insensitive' } } });
  const sxccalCollege = await prisma.college.findFirst({ where: { name: { contains: 'Xavier', mode: 'insensitive' } } });

  // Student 1: Debolina Bose (Jadavpur University)
  const student1 = await prisma.user.upsert({
    where: { email: 'debolina.bose@jadavpuruniversity.in' },
    update: {
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      profile: {
        update: {
          relationshipIntention: 'Casual Connection',
        },
      },
      education: {
        update: {
          collegeId: jadavpurCollege?.id || null,
        },
      },
    },
    create: {
      email: 'debolina.bose@jadavpuruniversity.in',
      mobileNumber: '+919830112233',
      passwordHash: studentPasswordHash,
      fullName: 'Debolina Bose',
      displayName: 'Debolina',
      age: 21,
      gender: 'Female',
      dateOfBirth: new Date('2003-08-25'),
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      profile: {
        create: {
          bio: 'Literature scholar, avid reader, coffee enthusiast. Excited to connect with campus peers across India!',
          interests: ['Reading', 'Debating', 'Music', 'Poetry', 'Coffee'],
          lookingFor: 'Friendship',
          relationshipIntention: 'Casual Connection',
          languages: ['English', 'Bengali', 'Hindi'],
          hobbies: ['Poetry', 'Cafe hopping'],
          currentMood: 'Want to make friends',
          city: 'Kolkata',
          state: 'West Bengal',
        },
      },
      education: {
        create: {
          collegeId: jadavpurCollege?.id || null,
          collegeName: 'Jadavpur University',
          universityName: 'Jadavpur University',
          degreeName: 'M.A. English Literature',
          departmentStream: 'Arts & Humanities',
          academicYear: '1st Year Master',
          currentSemester: 'Semester 1',
          graduationYear: 2026,
          studentStatus: 'CURRENTLY_STUDYING',
        },
      },
      photos: {
        create: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
            photoOrder: 1,
            isApproved: true,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
            photoOrder: 2,
            isApproved: true,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
            photoOrder: 3,
            isApproved: true,
          },
        ],
      },
    },
  });

  // Student 2: Rohan Sen (IIT Kharagpur)
  const student2 = await prisma.user.upsert({
    where: { email: 'rohan.sen@iitkgp.ac.in' },
    update: {
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      profile: {
        update: {
          relationshipIntention: 'Casual Connection',
        },
      },
      education: {
        update: {
          collegeId: iitkgpCollege?.id || null,
        },
      },
    },
    create: {
      email: 'rohan.sen@iitkgp.ac.in',
      mobileNumber: '+919876543210',
      passwordHash: studentPasswordHash,
      fullName: 'Rohan Sen',
      displayName: 'Rohan',
      age: 22,
      gender: 'Male',
      dateOfBirth: new Date('2002-11-14'),
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      profile: {
        create: {
          bio: 'AI researcher, hackathon enthusiast, tech builder. Looking for deep conversations and campus collaborators.',
          interests: ['Coding', 'Gaming', 'Travelling', 'Robotics', 'Fitness'],
          lookingFor: 'Casual Connection',
          relationshipIntention: 'Casual Connection',
          languages: ['English', 'Hindi', 'Bengali'],
          hobbies: ['Gym', 'Gaming'],
          currentMood: 'Looking for a conversation',
          city: 'Kharagpur',
          state: 'West Bengal',
        },
      },
      education: {
        create: {
          collegeId: iitkgpCollege?.id || null,
          collegeName: 'Indian Institute of Technology Kharagpur',
          universityName: 'IIT Kharagpur',
          degreeName: 'B.Tech Computer Science',
          departmentStream: 'Computer Science & Engineering',
          academicYear: '4th Year',
          currentSemester: 'Semester 7',
          graduationYear: 2026,
          studentStatus: 'CURRENTLY_STUDYING',
        },
      },
      photos: {
        create: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
            photoOrder: 1,
            isApproved: true,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
            photoOrder: 2,
            isApproved: true,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
            photoOrder: 3,
            isApproved: true,
          },
        ],
      },
    },
  });

  // Student 3: Ananya Roy (St. Xavier's College Kolkata)
  const student3 = await prisma.user.upsert({
    where: { email: 'ananya.roy@sxccal.edu' },
    update: {
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      profile: {
        update: {
          relationshipIntention: 'Casual Connection',
        },
      },
      education: {
        update: {
          collegeId: sxccalCollege?.id || null,
        },
      },
    },
    create: {
      email: 'ananya.roy@sxccal.edu',
      mobileNumber: '+919830554433',
      passwordHash: studentPasswordHash,
      fullName: 'Ananya Roy',
      displayName: 'Ananya',
      age: 20,
      gender: 'Female',
      dateOfBirth: new Date('2004-04-12'),
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      profile: {
        create: {
          bio: 'Economics undergrad, cafe explorer, vinyl collector. Let us chat about market quirks and indie music.',
          interests: ['Music', 'Economics', 'Photography', 'Design', 'Cafe hopping'],
          lookingFor: 'Dating Connection',
          relationshipIntention: 'Casual Connection',
          languages: ['English', 'Bengali', 'Hindi'],
          hobbies: ['Vinyl collecting', 'Cafe hopping'],
          currentMood: 'Open to dating',
          city: 'Kolkata',
          state: 'West Bengal',
        },
      },
      education: {
        create: {
          collegeId: sxccalCollege?.id || null,
          collegeName: "St. Xavier's College (Autonomous), Kolkata",
          universityName: 'University of Calcutta',
          degreeName: 'B.Sc Economics Honours',
          departmentStream: 'Economics',
          academicYear: '2nd Year',
          currentSemester: 'Semester 3',
          graduationYear: 2027,
          studentStatus: 'CURRENTLY_STUDYING',
        },
      },
      photos: {
        create: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
            photoOrder: 1,
            isApproved: true,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
            photoOrder: 2,
            isApproved: true,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
            photoOrder: 3,
            isApproved: true,
          },
        ],
      },
    },
  });

  // 5. Seed Real Campus Announcements in PostgreSQL
  console.log('\n5. Seeding real campus board announcements...');
  await prisma.campusAnnouncement.createMany({
    data: [
      {
        collegeName: 'Indian Institute of Technology Kharagpur',
        title: 'Spring Fest 2026 Campus Hackathon Registration Open!',
        content: 'Registration is now live for all IIT Kharagpur departments. Teams of 2 to 4 students can register at the Student Activity Centre. Exciting cash prizes and incubation opportunities!',
        category: 'Events',
        isUrgent: false,
        upvotes: 42,
        authorId: student2.id,
      },
      {
        collegeName: 'Indian Institute of Technology Kharagpur',
        title: 'Lost Calculator: Casio FX-991CW at Central Library 2nd Floor',
        content: 'Left my black scientific calculator at table 14 near the journals section yesterday evening. If found, please drop it at the library reception or DM me!',
        category: 'Lost & Found',
        isUrgent: true,
        upvotes: 18,
        authorId: student2.id,
      },
      {
        collegeName: 'Jadavpur University',
        title: 'Sanskriti 2026 Inter-College Debate and Drama Trials',
        content: 'Open auditions for the annual campus play and parliamentary debate team start this Thursday at OAT. All streams welcome to audition!',
        category: 'Events',
        isUrgent: false,
        upvotes: 35,
        authorId: student1.id,
      },
      {
        collegeName: "St. Xavier's College (Autonomous), Kolkata",
        title: 'Xavotsav 2026 Committee Volunteers Needed',
        content: 'Interested in managing PR, stage logistics, or artist hospitality for Eastern India’s biggest college festival? Applications are open until Friday.',
        category: 'General',
        isUrgent: false,
        upvotes: 56,
        authorId: student3.id,
      },
    ],
  });

  // 6. Seed real pending registration for Admin Dashboard review
  console.log('\n6. Seeding fresh pending applicant in PostgreSQL for Admin Review...');
  await prisma.pendingRegistration.upsert({
    where: { email: 'aarav.sharma.applicant@iitkgp.ac.in' },
    update: {
      status: 'PENDING_REVIEW',
    },
    create: {
      applicationId: 'COL-2026-LIVE01',
      legalName: 'Aarav Sharma',
      displayName: 'Aarav',
      dateOfBirth: new Date('2004-03-10'),
      age: 20,
      gender: 'Male',
      email: 'aarav.sharma.applicant@iitkgp.ac.in',
      mobileNumber: '+919811223344',
      city: 'Kharagpur',
      state: 'West Bengal',
      languagesSpoken: ['English', 'Hindi'],
      passwordHash: studentPasswordHash,
      collegeName: 'Indian Institute of Technology Kharagpur',
      universityName: 'IIT Kharagpur',
      collegeLocation: 'Kharagpur',
      collegeState: 'West Bengal',
      degreeName: 'B.Tech Electrical Engineering',
      departmentStream: 'Electrical Engineering',
      academicYear: '2nd Year',
      currentSemester: 'Semester 3',
      graduationYear: 2027,
      studentStatus: 'CURRENTLY_STUDYING',
      bio: 'Second-year electrical engineering student. Passionate about robotics and electric vehicles.',
      interests: ['Coding', 'Robotics', 'Fitness'],
      hobbies: ['Gym', 'Guitar'],
      lookingFor: 'Friendship',
      preferredDistance: 'ANYWHERE_INDIA',
      status: 'PENDING_REVIEW',
      reviewDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      photographs: {
        create: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
            photoOrder: 1,
            isApproved: false,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
            photoOrder: 2,
            isApproved: false,
          },
          {
            photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80',
            photoOrder: 3,
            isApproved: false,
          },
        ],
      },
      identityDocument: {
        create: {
          documentType: 'COLLEGE_ID',
          fileName: 'aarav_college_id.jpg',
          filePath: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=800&auto=format&fit=crop&q=80',
          mimeType: 'image/jpeg',
          fileSize: 245000,
        },
      },
    },
  });

  const finalCounts = {
    colleges: await prisma.college.count(),
    admins: await prisma.admin.count(),
    activeStudents: await prisma.user.count(),
    pendingRegistrations: await prisma.pendingRegistration.count(),
    campusAnnouncements: await prisma.campusAnnouncement.count(),
  };

  console.log('\n=== Final Clean Database Summary ===');
  console.log(JSON.stringify(finalCounts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
