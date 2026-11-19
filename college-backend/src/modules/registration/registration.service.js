import { applicationsRepo, usersRepo } from '../../services/file.service.js';
import { imageService } from '../../services/image.service.js';
import { notificationService } from '../../services/notification.service.js';
import { generateApplicationId, generateId } from '../../utils/generateId.js';
import { calculateAge, calculateReviewDeadline, getOverdueStatus } from '../../utils/date.js';
import { hashPassword } from '../../utils/password.js';

export const registrationService = {
  /**
   * Process and register a new applicant
   */
  submitApplication: async ({ validatedData, files = {} }) => {
    // 1. Prevent duplicate registrations on email or mobile
    const existingActiveUser = await usersRepo.findByEmailOrMobile(validatedData.email) ||
                               await usersRepo.findByEmailOrMobile(validatedData.mobile);
    if (existingActiveUser) {
      const err = new Error('An active account already exists with this email or mobile number.');
      err.statusCode = 409;
      err.code = 'ACCOUNT_ALREADY_EXISTS';
      throw err;
    }

    const existingPending = await applicationsRepo.findByEmailOrMobile(validatedData.email, validatedData.mobile);
    if (existingPending && ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED'].includes(existingPending.status)) {
      const err = new Error(`An application (${existingPending.application_id}) with this email or mobile is already in our verification queue.`);
      err.statusCode = 409;
      err.code = 'APPLICATION_ALREADY_PENDING';
      err.details = { applicationId: existingPending.application_id, status: existingPending.status };
      throw err;
    }

    // 2. Validate and process THREE photographs
    let photo1 = null;
    let photo2 = null;
    let photo3 = null;

    // Check files uploaded via multipart
    if (files.photo_1 && files.photo_1[0]) {
      const saved = await imageService.processAndSavePrivatePhoto(files.photo_1[0].buffer, files.photo_1[0].originalname);
      photo1 = `/api/v1/admin/documents/photos/${saved.filename}`;
    } else if (validatedData.photo_1) {
      photo1 = validatedData.photo_1;
    }

    if (files.photo_2 && files.photo_2[0]) {
      const saved = await imageService.processAndSavePrivatePhoto(files.photo_2[0].buffer, files.photo_2[0].originalname);
      photo2 = `/api/v1/admin/documents/photos/${saved.filename}`;
    } else if (validatedData.photo_2) {
      photo2 = validatedData.photo_2;
    }

    if (files.photo_3 && files.photo_3[0]) {
      const saved = await imageService.processAndSavePrivatePhoto(files.photo_3[0].buffer, files.photo_3[0].originalname);
      photo3 = `/api/v1/admin/documents/photos/${saved.filename}`;
    } else if (validatedData.photo_3) {
      photo3 = validatedData.photo_3;
    }

    // Handle case where photos are uploaded as an array `files.photos`
    if (files.photos && Array.isArray(files.photos)) {
      if (!photo1 && files.photos[0]) {
        const s1 = await imageService.processAndSavePrivatePhoto(files.photos[0].buffer, files.photos[0].originalname);
        photo1 = `/api/v1/admin/documents/photos/${s1.filename}`;
      }
      if (!photo2 && files.photos[1]) {
        const s2 = await imageService.processAndSavePrivatePhoto(files.photos[1].buffer, files.photos[1].originalname);
        photo2 = `/api/v1/admin/documents/photos/${s2.filename}`;
      }
      if (!photo3 && files.photos[2]) {
        const s3 = await imageService.processAndSavePrivatePhoto(files.photos[2].buffer, files.photos[2].originalname);
        photo3 = `/api/v1/admin/documents/photos/${s3.filename}`;
      }
    }

    // Strict validation: Exactly THREE photos required
    if (!photo1 || !photo2 || !photo3) {
      const missing = [];
      if (!photo1) missing.push('Photo 1 (Avatar)');
      if (!photo2) missing.push('Photo 2 (Personal 1)');
      if (!photo3) missing.push('Photo 3 (Personal 2)');

      const err = new Error(`All THREE photographs are mandatory for manual verification. Missing: ${missing.join(', ')}.`);
      err.statusCode = 400;
      err.code = 'MISSING_MANDATORY_PHOTOGRAPHS';
      throw err;
    }

    // 3. Validate and process Identity Document
    let identityDocUrl = null;
    if (files.identity_document && files.identity_document[0]) {
      const docFile = files.identity_document[0];
      const savedDoc = await imageService.processAndSavePrivateDocument(docFile.buffer, docFile.originalname, docFile.mimetype);
      identityDocUrl = `/api/v1/admin/documents/vault/${savedDoc.filename}`;
    } else if (validatedData.verification_id_url) {
      identityDocUrl = validatedData.verification_id_url;
    }

    if (!identityDocUrl) {
      const err = new Error('Identity verification document is mandatory. Please upload a clear student ID card or government document.');
      err.statusCode = 400;
      err.code = 'MISSING_IDENTITY_DOCUMENT';
      throw err;
    }

    // 4. Hash password with Argon2id
    const passwordHash = await hashPassword(validatedData.password);

    // 5. Build application record with 72-hour timeline
    const applicationId = generateApplicationId();
    const submittedAt = new Date().toISOString();
    const reviewDeadline = calculateReviewDeadline(submittedAt);
    const calculatedAge = calculateAge(validatedData.date_of_birth);

    const applicationRecord = {
      id: generateId('app'),
      application_id: applicationId,
      status: 'PENDING_REVIEW', // PENDING_REVIEW | UNDER_REVIEW | NEEDS_CORRECTION | RESUBMITTED | APPROVED | REJECTED

      // Section A: Personal Information
      legal_name: validatedData.legal_name,
      display_name: validatedData.display_name,
      date_of_birth: validatedData.date_of_birth,
      age: calculatedAge,
      gender: validatedData.gender,
      email: validatedData.email,
      mobile: validatedData.mobile,
      city: validatedData.city,
      state: validatedData.state,
      languages_spoken: validatedData.languages_spoken,
      password_hash: passwordHash,

      // Section B: College & Education
      college_name: validatedData.college_name,
      university_name: validatedData.university_name,
      college_location: validatedData.college_location || validatedData.city,
      college_state: validatedData.college_state || validatedData.state,
      degree_name: validatedData.degree_name,
      department_stream: validatedData.department_stream,
      academic_year: validatedData.academic_year,
      current_semester: validatedData.current_semester,
      graduation_year: validatedData.graduation_year,
      student_status: validatedData.student_status,

      // Section C: Identity Document
      verification_id_type: validatedData.verification_id_type,
      verification_id_url: identityDocUrl,
      document_consent: true,

      // Section D: Three Verified Photos
      photo_1: photo1,
      photo_2: photo2,
      photo_3: photo3,

      // Section E: Preferences & Bio
      bio: validatedData.bio,
      interests: validatedData.interests,
      hobbies: validatedData.hobbies,
      looking_for: validatedData.looking_for,
      preferred_distance: validatedData.preferred_distance,
      age_range_min: validatedData.age_range_min,
      age_range_max: validatedData.age_range_max,

      // Section F: Review Timeline & Audit
      submitted_at: submittedAt,
      review_deadline: reviewDeadline,
      assigned_admin: null,
      correction_fields: [],
      correction_message: null,
      rejection_reason: null,
      created_at: submittedAt
    };

    // 6. Save in applications.json
    await applicationsRepo.create(applicationRecord);

    // 7. Dispatch Notification & Email
    await notificationService.createAndSend({
      applicationId: applicationRecord.application_id,
      email: applicationRecord.email,
      legalName: applicationRecord.legal_name,
      type: 'SUBMITTED',
      title: 'Application Received',
      message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.',
      metadata: { reviewDeadline: applicationRecord.review_deadline }
    });

    return {
      applicationId: applicationRecord.application_id,
      status: applicationRecord.status,
      submittedAt: applicationRecord.submitted_at,
      reviewDeadline: applicationRecord.review_deadline,
      message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.'
    };
  },

  /**
   * Get application status by ID
   */
  getStatus: async (applicationId) => {
    const app = await applicationsRepo.getByAppId(applicationId) || await applicationsRepo.getById(applicationId);
    if (!app) {
      const err = new Error(`Application ${applicationId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    const deadlineInfo = getOverdueStatus(app.review_deadline, app.status);

    let statusMessage = 'Our verification team is inspecting your credentials. Review takes up to 72 hours.';
    if (app.status === 'UNDER_REVIEW') {
      statusMessage = `Your application is currently being inspected by ${app.assigned_admin || 'an authorized campus administrator'}.`;
    } else if (app.status === 'NEEDS_CORRECTION') {
      statusMessage = `Administrator requested information corrections: "${app.correction_message}". Please update and resubmit.`;
    } else if (app.status === 'APPROVED') {
      statusMessage = 'Congratulations! Your Collégé account has been verified and activated. You can now log in.';
    } else if (app.status === 'REJECTED') {
      statusMessage = `Application declined: "${app.rejection_reason}".`;
    } else if (deadlineInfo.isOverdue) {
      statusMessage = 'Your application review is taking slightly longer than our 72-hour target. A senior administrator is prioritizing your credentials.';
    }

    return {
      applicationId: app.application_id,
      status: app.status,
      legalName: app.legal_name,
      displayName: app.display_name,
      submittedAt: app.submitted_at,
      reviewDeadline: app.review_deadline,
      overdueStatus: deadlineInfo,
      message: statusMessage,
      correctionFields: app.correction_fields || [],
      correctionMessage: app.correction_message || null,
      rejectionReason: app.rejection_reason || null
    };
  },

  /**
   * Resubmit application after NEEDS_CORRECTION
   */
  resubmitApplication: async ({ applicationId, updates, files = {} }) => {
    const app = await applicationsRepo.getByAppId(applicationId) || await applicationsRepo.getById(applicationId);
    if (!app) {
      const err = new Error(`Application ${applicationId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    if (app.status !== 'NEEDS_CORRECTION' && app.status !== 'PENDING_REVIEW') {
      const err = new Error(`Application in status ${app.status} cannot be resubmitted.`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_FOR_RESUBMISSION';
      throw err;
    }

    // Process updated files if attached
    const patch = { ...updates };

    if (files.photo_1 && files.photo_1[0]) {
      const saved = await imageService.processAndSavePrivatePhoto(files.photo_1[0].buffer, files.photo_1[0].originalname);
      patch.photo_1 = `/api/v1/admin/documents/photos/${saved.filename}`;
    }
    if (files.photo_2 && files.photo_2[0]) {
      const saved = await imageService.processAndSavePrivatePhoto(files.photo_2[0].buffer, files.photo_2[0].originalname);
      patch.photo_2 = `/api/v1/admin/documents/photos/${saved.filename}`;
    }
    if (files.photo_3 && files.photo_3[0]) {
      const saved = await imageService.processAndSavePrivatePhoto(files.photo_3[0].buffer, files.photo_3[0].originalname);
      patch.photo_3 = `/api/v1/admin/documents/photos/${saved.filename}`;
    }
    if (files.identity_document && files.identity_document[0]) {
      const doc = files.identity_document[0];
      const savedDoc = await imageService.processAndSavePrivateDocument(doc.buffer, doc.originalname, doc.mimetype);
      patch.verification_id_url = `/api/v1/admin/documents/vault/${savedDoc.filename}`;
    }

    const submittedAt = new Date().toISOString();
    const newDeadline = calculateReviewDeadline(submittedAt);

    const updated = await applicationsRepo.update(app.id, {
      ...patch,
      status: 'RESUBMITTED',
      correction_fields: [],
      correction_message: null,
      submitted_at: submittedAt,
      review_deadline: newDeadline
    });

    // Notify
    await notificationService.createAndSend({
      applicationId: updated.application_id,
      email: updated.email,
      legalName: updated.legal_name,
      type: 'RESUBMITTED',
      title: 'Correction Resubmitted',
      message: 'Your updated details have been resubmitted and are back in the admin review queue.'
    });

    return {
      success: true,
      applicationId: updated.application_id,
      status: updated.status,
      message: 'Application resubmitted successfully. Our team will resume verification.'
    };
  }
};
