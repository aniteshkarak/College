import * as argon2 from 'argon2';
import prisma from '../../config/prisma.js';
import { generateApplicationId, calculateReviewDeadline, getReviewTimelineMetrics } from '../../utils/applicationUtils.js';

export const submitRegistrationApplication = async (data) => {
  // 1. Prevent duplicate email / mobile in active users OR pending applications
  const [existingUser, existingPending] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { mobileNumber: data.mobileNumber },
        ],
      },
    }),
    prisma.pendingRegistration.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { mobileNumber: data.mobileNumber },
        ],
        status: { in: ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED'] },
      },
    }),
  ]);

  if (existingUser) {
    if (existingUser.email.toLowerCase() === data.email.toLowerCase()) {
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

  // 3. Password Hashing using Argon2id
  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  // 4. Generate Application ID and 72-Hour Review Deadline
  const applicationId = generateApplicationId();
  const submittedAt = new Date();
  const reviewDeadline = calculateReviewDeadline(submittedAt);

  // 5. Transaction: Create PendingRegistration + IdentityDocument + 3 Photos
  const result = await prisma.$transaction(async (tx) => {
    const app = await tx.pendingRegistration.create({
      data: {
        applicationId,
        status: 'PENDING_REVIEW',
        legalName: data.legalName.trim(),
        displayName: data.displayName.trim(),
        dateOfBirth: birthDate,
        age: calculatedAge,
        gender: data.gender || null,
        city: data.city.trim(),
        state: data.state.trim(),
        languagesSpoken: data.languagesSpoken,
        email: data.email.toLowerCase().trim(),
        mobileNumber: data.mobileNumber.trim(),
        passwordHash,

        // Step 2 Education
        collegeName: data.collegeName.trim(),
        universityName: data.universityName?.trim() || null,
        collegeLocation: data.collegeLocation?.trim() || null,
        collegeState: data.collegeState?.trim() || null,
        degreeName: data.degreeName.trim(),
        departmentStream: data.departmentStream.trim(),
        academicYear: data.academicYear,
        currentSemester: data.currentSemester || null,
        graduationYear: data.graduationYear,
        studentStatus: data.studentStatus,

        // Step 5 About & Preferences
        bio: data.bio.trim(),
        interests: data.interests,
        hobbies: data.hobbies,
        personality: data.personality || null,
        lookingFor: data.lookingFor,
        ageRangeMin: data.ageRangeMin || 18,
        ageRangeMax: data.ageRangeMax || 26,
        preferredDistance: data.preferredDistance,

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
        documentType: data.documentType,
        documentNumberMasked: data.documentNumberMasked || null,
        filePath: data.documentUrl,
        fileName: `${data.documentType}_${applicationId}.jpg`,
        fileSize: 1024 * 500, // estimated or provided
        mimeType: 'image/jpeg',
        isVerified: false,
      },
    });

    // Exactly 3 User Photographs
    await tx.userPhoto.createMany({
      data: [
        {
          registrationId: app.id,
          photoUrl: data.photo1,
          photoOrder: 1,
          isMain: true,
          isApproved: false,
        },
        {
          registrationId: app.id,
          photoUrl: data.photo2,
          photoOrder: 2,
          isMain: false,
          isApproved: false,
        },
        {
          registrationId: app.id,
          photoUrl: data.photo3,
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
        notes: 'Application successfully created and queued for manual human review.',
        correctionFields: [],
      },
    });

    return app;
  });

  return {
    applicationId: result.applicationId,
    status: result.status,
    submittedAt: result.submittedAt,
    reviewDeadline: result.reviewDeadline,
    targetReviewHours: 72,
    message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.',
  };
};

export const getApplicationStatus = async (applicationId, emailOrMobile) => {
  const application = await prisma.pendingRegistration.findFirst({
    where: applicationId
      ? { applicationId }
      : {
          OR: [
            { email: emailOrMobile?.toLowerCase() },
            { mobileNumber: emailOrMobile },
          ],
        },
    include: {
      photographs: { orderBy: { photoOrder: 'asc' } },
      identityDocument: true,
      reviewHistory: { orderBy: { timestamp: 'desc' } },
    },
  });

  if (!application) {
    throw new Error('No pending or reviewed registration found for provided identifier.');
  }

  const timeline = getReviewTimelineMetrics(
    application.submittedAt,
    application.reviewDeadline,
    application.status
  );

  return {
    applicationId: application.applicationId,
    status: application.status,
    applicantName: application.displayName,
    legalName: application.legalName,
    collegeName: application.collegeName,
    degreeName: application.degreeName,
    email: application.email,
    mobile: application.mobileNumber,
    timeline,
    correctionFields: application.correctionFields,
    correctionMessage: application.correctionMessage,
    rejectionReason: application.rejectionReason,
    reviewHistory: application.reviewHistory,
  };
};

export const resubmitCorrection = async (data) => {
  const application = await prisma.pendingRegistration.findUnique({
    where: { applicationId: data.applicationId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  if (application.status !== 'NEEDS_CORRECTION') {
    throw new Error(`Application cannot be resubmitted. Current status is ${application.status}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.pendingRegistration.update({
      where: { applicationId: data.applicationId },
      data: {
        legalName: data.legalName ? data.legalName.trim() : undefined,
        collegeName: data.collegeName ? data.collegeName.trim() : undefined,
        degreeName: data.degreeName ? data.degreeName.trim() : undefined,
        departmentStream: data.departmentStream ? data.departmentStream.trim() : undefined,
        academicYear: data.academicYear || undefined,
        bio: data.bio ? data.bio.trim() : undefined,
        status: 'RESUBMITTED',
        correctionFields: [],
        correctionMessage: null,
        submittedAt: new Date(),
        reviewDeadline: calculateReviewDeadline(new Date()),
      },
    });

    // Update document if provided
    if (data.documentUrl) {
      await tx.identityDocument.updateMany({
        where: { registrationId: application.id },
        data: {
          filePath: data.documentUrl,
          documentType: data.documentType || 'COLLEGE_ID',
        },
      });
    }

    // Update photos if provided
    if (data.photo1) {
      await tx.userPhoto.updateMany({
        where: { registrationId: application.id, photoOrder: 1 },
        data: { photoUrl: data.photo1 },
      });
    }
    if (data.photo2) {
      await tx.userPhoto.updateMany({
        where: { registrationId: application.id, photoOrder: 2 },
        data: { photoUrl: data.photo2 },
      });
    }
    if (data.photo3) {
      await tx.userPhoto.updateMany({
        where: { registrationId: application.id, photoOrder: 3 },
        data: { photoUrl: data.photo3 },
      });
    }

    // Record review history
    await tx.verificationHistory.create({
      data: {
        registrationId: application.id,
        adminId: 'APPLICANT',
        adminName: application.displayName,
        action: 'RESUBMITTED',
        notes: data.correctionNote || 'Applicant updated requested correction fields and resubmitted.',
        correctionFields: [],
      },
    });

    return updatedApp;
  });

  return {
    applicationId: updated.applicationId,
    status: updated.status,
    submittedAt: updated.submittedAt,
    reviewDeadline: updated.reviewDeadline,
    message: 'Your corrected application has been resubmitted successfully. It is now back with the verification team.',
  };
};

export default {
  submitRegistrationApplication,
  getApplicationStatus,
  resubmitCorrection,
};
