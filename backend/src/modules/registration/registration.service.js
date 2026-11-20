import * as argon2 from 'argon2';
import prisma from '../../config/prisma.js';
import imageService from '../../services/imageService.js';
import emailService from '../../services/emailService.js';
import { generateApplicationId, calculateReviewDeadline, getReviewTimelineMetrics } from '../../utils/applicationUtils.js';
import logger from '../../utils/logger.js';

export const submitRegistrationApplication = async (data, files = {}) => {
  const emailClean = (data.email || '').toLowerCase().trim();
  const mobileClean = (data.mobileNumber || data.mobile || '').trim();

  // 1. Prevent duplicate email / mobile in active users OR pending applications
  const [existingUser, existingPending] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [
          { email: emailClean },
          { mobileNumber: mobileClean },
        ],
      },
    }),
    prisma.pendingRegistration.findFirst({
      where: {
        OR: [
          { email: emailClean },
          { mobileNumber: mobileClean },
        ],
        status: { in: ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED'] },
      },
    }),
  ]);

  if (existingUser) {
    if (existingUser.email.toLowerCase() === emailClean) {
      throw new Error('An account with this email address already exists.');
    }
    throw new Error('An account with this mobile number already exists.');
  }

  if (existingPending) {
    throw new Error(`An application (${existingPending.applicationId}) with this email or mobile is already in review.`);
  }

  // 2. Strict Server-Side 18+ Verification
  const birthDate = new Date(data.dateOfBirth);
  const today = new Date();
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }

  if (calculatedAge < 18) {
    throw new Error('Applicant does not satisfy the 18+ eligibility requirement.');
  }

  // 3. Extract and Validate Exactly 3 Photographs
  const rawPhoto1 = files?.photo_1?.[0]?.buffer || files?.photo1?.[0]?.buffer || data.photo1 || data.photo_1;
  const rawPhoto2 = files?.photo_2?.[0]?.buffer || files?.photo2?.[0]?.buffer || data.photo2 || data.photo_2;
  const rawPhoto3 = files?.photo_3?.[0]?.buffer || files?.photo3?.[0]?.buffer || data.photo3 || data.photo_3;

  if (!rawPhoto1 || !rawPhoto2 || !rawPhoto3) {
    throw new Error('Exactly THREE photographs (Photo 1, Photo 2, Photo 3) are mandatory for campus safety verification.');
  }

  // 4. Extract and Validate Identity Verification Document
  const rawDoc = files?.identity_document?.[0]?.buffer || files?.document?.[0]?.buffer || data.documentUrl || data.verification_id_url;
  const docOriginalName = files?.identity_document?.[0]?.originalname || files?.document?.[0]?.originalname || 'college_id.jpg';
  const docMime = files?.identity_document?.[0]?.mimetype || files?.document?.[0]?.mimetype || 'image/jpeg';

  if (!rawDoc) {
    throw new Error('College identity verification document (College ID or Govt ID) is required.');
  }

  // 5. Process Images with Sharp (strip EXIF/GPS, WebP conversion, thumbnails)
  const [photo1Result, photo2Result, photo3Result, docResult] = await Promise.all([
    imageService.processAndSavePhoto(rawPhoto1, 1),
    imageService.processAndSavePhoto(rawPhoto2, 2),
    imageService.processAndSavePhoto(rawPhoto3, 3),
    imageService.processAndSaveDocument(rawDoc, docOriginalName, docMime),
  ]);

  // 6. Password Hashing using Argon2id
  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  // 7. Identify college from existing verified College database table
  let verifiedCollegeId = data.collegeId || null;
  let verifiedCollegeName = data.collegeName ? data.collegeName.trim() : '';

  if (verifiedCollegeId) {
    const col = await prisma.college.findUnique({ where: { id: verifiedCollegeId } });
    if (col) verifiedCollegeName = col.name;
  } else if (verifiedCollegeName) {
    const col = await prisma.college.findFirst({
      where: { name: { equals: verifiedCollegeName, mode: 'insensitive' } },
    });
    if (col) {
      verifiedCollegeId = col.id;
      verifiedCollegeName = col.name;
    }
  }

  // 8. Generate Application ID and 72-Hour Review Deadline
  const applicationId = generateApplicationId();
  const submittedAt = new Date();
  const reviewDeadline = calculateReviewDeadline(submittedAt);

  // 9. Transaction: Create PendingRegistration + IdentityDocument + 3 Photos + VerificationHistory
  const result = await prisma.$transaction(async (tx) => {
    const app = await tx.pendingRegistration.create({
      data: {
        applicationId,
        status: 'PENDING_REVIEW',
        legalName: data.legalName.trim(),
        displayName: data.displayName.trim(),
        dateOfBirth: birthDate,
        age: calculatedAge,
        gender: data.gender || 'Not specified',
        city: data.city.trim(),
        state: data.state.trim(),
        languagesSpoken: data.languagesSpoken || ['English', 'Hindi'],
        email: emailClean,
        mobileNumber: mobileClean,
        passwordHash,

        // Step 2 Education
        collegeId: verifiedCollegeId,
        collegeName: verifiedCollegeName,
        universityName: data.universityName?.trim() || 'Affiliated / Autonomous',
        collegeLocation: data.collegeLocation?.trim() || data.city.trim(),
        collegeState: data.collegeState?.trim() || data.state.trim(),
        degreeName: data.degreeName.trim(),
        departmentStream: data.departmentStream?.trim() || 'General Stream',
        academicYear: data.academicYear || '1st Year',
        currentSemester: data.currentSemester || 'Semester 1',
        graduationYear: parseInt(data.graduationYear, 10) || 2026,
        studentStatus: data.studentStatus || 'CURRENTLY_STUDYING',

        // Step 5 About & Preferences
        bio: data.bio?.trim() || `Student at ${data.collegeName}. Verified campus profile!`,
        interests: data.interests || ['Music', 'Travelling'],
        hobbies: data.hobbies || ['Reading'],
        personality: data.personality || null,
        lookingFor: data.lookingFor || 'Friendship',
        ageRangeMin: parseInt(data.ageRangeMin, 10) || 18,
        ageRangeMax: parseInt(data.ageRangeMax, 10) || 26,
        preferredDistance: data.preferredDistance || 'ANYWHERE_INDIA',

        // Step 6 Consents
        termsAccepted: true,
        privacyAccepted: true,
        ageConfirmed18Plus: true,
        verificationConsent: true,
        consentedAt: new Date(),

        // 72h Tracking
        submittedAt,
        reviewDeadline,
      },
    });

    // Identity Document (Private Record)
    await tx.identityDocument.create({
      data: {
        registrationId: app.id,
        documentType: data.documentType || 'COLLEGE_ID',
        documentNumberMasked: data.documentNumberMasked || null,
        filePath: docResult.filePath,
        fileName: docResult.fileName,
        fileSize: docResult.fileSize,
        mimeType: docResult.mimeType,
        fileHashSha256: docResult.fileHashSha256,
        isVerified: false,
      },
    });

    // Exactly 3 User Photographs
    await tx.userPhoto.createMany({
      data: [
        {
          registrationId: app.id,
          photoUrl: photo1Result.filePath,
          photoOrder: 1,
          isMain: true,
          isApproved: false,
        },
        {
          registrationId: app.id,
          photoUrl: photo2Result.filePath,
          photoOrder: 2,
          isMain: false,
          isApproved: false,
        },
        {
          registrationId: app.id,
          photoUrl: photo3Result.filePath,
          photoOrder: 3,
          isMain: false,
          isApproved: false,
        },
      ],
    });

    // Initial Audit History
    await tx.verificationHistory.create({
      data: {
        registrationId: app.id,
        adminId: 'SYSTEM',
        adminName: 'Registration Gateway',
        action: 'SUBMITTED',
        notes: 'Applicant completed all 6 steps, uploaded College ID and 3 photos. Placed in 72-hour review queue.',
        correctionFields: [],
      },
    });

    return app;
  });

  // 9. Dispatch Nodemailer Application Confirmation
  emailService.sendApplicationSubmitted({
    email: emailClean,
    legalName: data.legalName.trim(),
    applicationId,
    reviewDeadline,
  }).catch((err) => logger.warn(`Email notice dispatch skipped: ${err.message}`));

  return {
    success: true,
    applicationId,
    status: 'PENDING_REVIEW',
    submittedAt,
    reviewDeadline,
    targetHours: 72,
    message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.',
  };
};

export const getApplicationStatus = async (applicationId, identifier) => {
  const whereOr = [];

  const addSearchVariants = (val) => {
    if (!val) return;
    const clean = String(val).trim();
    if (!clean) return;
    whereOr.push({ id: clean });
    whereOr.push({ applicationId: clean });
    whereOr.push({ applicationId: clean.toUpperCase() });
    whereOr.push({ email: clean.toLowerCase() });
    whereOr.push({ mobileNumber: clean });
  };

  addSearchVariants(applicationId);
  addSearchVariants(identifier);

  const app = await prisma.pendingRegistration.findFirst({
    where: whereOr.length > 0 ? { OR: whereOr } : {},
    include: {
      photographs: { orderBy: { photoOrder: 'asc' } },
      identityDocument: true,
      reviewHistory: { orderBy: { timestamp: 'desc' } },
    },
  });

  if (!app) {
    throw new Error('No application found with the provided identifier.');
  }

  const timeline = getReviewTimelineMetrics(app.submittedAt, app.reviewDeadline, app.status);

  return {
    applicationId: app.applicationId,
    status: app.status,
    submittedAt: app.submittedAt,
    reviewDeadline: app.reviewDeadline,
    timeline,
    applicant: {
      legalName: app.legalName,
      displayName: app.displayName,
      email: app.email,
      mobileNumber: app.mobileNumber,
      collegeName: app.collegeName,
      degreeName: app.degreeName,
    },
    correctionFields: app.correctionFields,
    correctionMessage: app.correctionMessage,
    rejectionReason: app.rejectionReason,
    photos: app.photographs.map((p) => ({
      order: p.photoOrder,
      isMain: p.isMain,
      url: `/api/v1/admin/documents/photos/${p.photoUrl}`,
    })),
    identityDocument: app.identityDocument
      ? {
          type: app.identityDocument.documentType,
          url: `/api/v1/admin/documents/documents/${app.identityDocument.filePath}`,
          verified: app.identityDocument.isVerified,
        }
      : null,
  };
};

export const resubmitCorrection = async (data, files = {}) => {
  const { applicationId } = data;
  const clean = String(applicationId || '').trim();

  const app = await prisma.pendingRegistration.findFirst({
    where: {
      OR: [
        { id: clean },
        { applicationId: clean },
        { applicationId: clean.toUpperCase() },
        { email: clean.toLowerCase() },
        { mobileNumber: clean },
      ],
    },
    include: { photographs: true, identityDocument: true },
  });

  if (!app) {
    throw new Error('Application not found.');
  }

  if (app.status !== 'NEEDS_CORRECTION') {
    throw new Error(`Application is in ${app.status} status and does not require corrections.`);
  }

  const updateData = {
    status: 'RESUBMITTED',
    correctionFields: [],
    correctionMessage: null,
    submittedAt: new Date(),
    reviewDeadline: calculateReviewDeadline(new Date()),
  };

  if (data.legalName) updateData.legalName = data.legalName.trim();
  if (data.collegeName) updateData.collegeName = data.collegeName.trim();
  if (data.degreeName) updateData.degreeName = data.degreeName.trim();
  if (data.departmentStream) updateData.departmentStream = data.departmentStream.trim();
  if (data.bio) updateData.bio = data.bio.trim();

  // If new identity document provided
  const rawDoc = files?.identity_document?.[0]?.buffer || files?.document?.[0]?.buffer || data.documentUrl;
  if (rawDoc) {
    const docResult = await imageService.processAndSaveDocument(
      rawDoc,
      files?.identity_document?.[0]?.originalname || 'college_id.jpg',
      files?.identity_document?.[0]?.mimetype || 'image/jpeg'
    );
    if (app.identityDocument) {
      await prisma.identityDocument.update({
        where: { id: app.identityDocument.id },
        data: {
          filePath: docResult.filePath,
          fileName: docResult.fileName,
          fileSize: docResult.fileSize,
          mimeType: docResult.mimeType,
          fileHashSha256: docResult.fileHashSha256,
        },
      });
    }
  }

  // If new photos provided
  const rawPhoto1 = files?.photo_1?.[0]?.buffer || data.photo1;
  const rawPhoto2 = files?.photo_2?.[0]?.buffer || data.photo2;
  const rawPhoto3 = files?.photo_3?.[0]?.buffer || data.photo3;

  if (rawPhoto1) {
    const p1 = await imageService.processAndSavePhoto(rawPhoto1, 1);
    await prisma.userPhoto.updateMany({
      where: { registrationId: app.id, photoOrder: 1 },
      data: { photoUrl: p1.filePath },
    });
  }
  if (rawPhoto2) {
    const p2 = await imageService.processAndSavePhoto(rawPhoto2, 2);
    await prisma.userPhoto.updateMany({
      where: { registrationId: app.id, photoOrder: 2 },
      data: { photoUrl: p2.filePath },
    });
  }
  if (rawPhoto3) {
    const p3 = await imageService.processAndSavePhoto(rawPhoto3, 3);
    await prisma.userPhoto.updateMany({
      where: { registrationId: app.id, photoOrder: 3 },
      data: { photoUrl: p3.filePath },
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.pendingRegistration.update({
      where: { id: app.id },
      data: updateData,
    });

    await tx.verificationHistory.create({
      data: {
        registrationId: app.id,
        adminId: 'APPLICANT',
        adminName: app.displayName,
        action: 'RESUBMITTED',
        notes: data.correctionNote || 'Applicant updated requested fields and resubmitted for admin review.',
        correctionFields: [],
      },
    });

    return res;
  });

  // Dispatch resubmission email
  emailService.sendResubmissionConfirmation({
    email: app.email,
    legalName: app.legalName,
    applicationId: app.applicationId,
    reviewDeadline: updateData.reviewDeadline,
  }).catch((err) => logger.warn(`Resubmission email skipped: ${err.message}`));

  return {
    success: true,
    applicationId: updated.applicationId,
    status: 'RESUBMITTED',
    reviewDeadline: updated.reviewDeadline,
    message: 'Corrected application resubmitted! Our team will continue verification.',
  };
};

export default {
  submitRegistrationApplication,
  getApplicationStatus,
  resubmitCorrection,
};
