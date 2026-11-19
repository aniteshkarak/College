import { fullRegistrationSchema, resubmitCorrectionSchema } from './registration.validator.js';
import registrationService from './registration.service.js';
import collegeService from '../../services/collegeService.js';
import { success, error } from '../../utils/response.js';

export const startRegistration = async (_req, res) => {
  return success(
    res,
    {
      targetReviewHours: 72,
      steps: [
        'Personal Information & 18+ Verification',
        'College & Academic Details',
        'Identity Verification Document',
        'Exactly 3 Profile Photographs',
        'About & Connection Preferences',
        'Consents & Final 72-Hour Submission'
      ]
    },
    'Registration workflow initialized'
  );
};

export const submitRegistration = async (req, res) => {
  try {
    const rawBody = req.body || {};
    const normalized = {
      legalName: rawBody.legalName || rawBody.legal_name || rawBody.fullName || rawBody.full_name,
      displayName: rawBody.displayName || rawBody.display_name,
      dateOfBirth: rawBody.dateOfBirth || rawBody.date_of_birth,
      email: rawBody.email,
      mobileNumber: rawBody.mobileNumber || rawBody.mobile,
      gender: rawBody.gender,
      city: rawBody.city,
      state: rawBody.state,
      languagesSpoken: rawBody.languagesSpoken || rawBody.languages_spoken,
      password: rawBody.password,

      // Step 2 College
      collegeName: rawBody.collegeName || rawBody.college_name,
      universityName: rawBody.universityName || rawBody.university_name,
      collegeLocation: rawBody.collegeLocation || rawBody.college_location,
      collegeState: rawBody.collegeState || rawBody.college_state,
      degreeName: rawBody.degreeName || rawBody.degree_name || rawBody.course,
      departmentStream: rawBody.departmentStream || rawBody.department_stream,
      academicYear: rawBody.academicYear || rawBody.academic_year,
      currentSemester: rawBody.currentSemester || rawBody.current_semester,
      graduationYear: rawBody.graduationYear || rawBody.graduation_year,
      studentStatus: rawBody.studentStatus || rawBody.student_status,

      // Step 3 Document
      documentType: rawBody.documentType || rawBody.verification_id_type || 'COLLEGE_ID',
      documentUrl: req.files?.identity_document?.[0] || req.files?.document?.[0] || rawBody.documentUrl || rawBody.verification_id_url || rawBody.identity_document,
      documentNumberMasked: rawBody.documentNumberMasked || rawBody.document_number_masked,

      // Step 4 Exactly 3 Photos
      photo1: req.files?.photo_1?.[0] || req.files?.photo1?.[0] || rawBody.photo1 || rawBody.photo_1,
      photo2: req.files?.photo_2?.[0] || req.files?.photo2?.[0] || rawBody.photo2 || rawBody.photo_2,
      photo3: req.files?.photo_3?.[0] || req.files?.photo3?.[0] || rawBody.photo3 || rawBody.photo_3,

      // Step 5 About & Preferences
      bio: rawBody.bio,
      interests: rawBody.interests,
      hobbies: rawBody.hobbies,
      personality: rawBody.personality,
      lookingFor: rawBody.lookingFor || rawBody.looking_for,
      ageRangeMin: rawBody.ageRangeMin || rawBody.age_range_min,
      ageRangeMax: rawBody.ageRangeMax || rawBody.age_range_max,
      preferredDistance: rawBody.preferredDistance || rawBody.preferred_distance,

      // Step 6 Consents
      termsAccepted: rawBody.termsAccepted ?? rawBody.terms_accepted ?? true,
      privacyAccepted: rawBody.privacyAccepted ?? rawBody.privacy_accepted ?? true,
      ageConfirmed18Plus: rawBody.ageConfirmed18Plus ?? rawBody.age_confirmed_18_plus ?? true,
      verificationConsent: rawBody.verificationConsent ?? rawBody.verification_consent ?? true,
    };

    const parseResult = fullRegistrationSchema.safeParse(normalized);
    if (!parseResult.success) {
      return error(res, 'Validation failed: Please ensure all 6 steps are completely filled with valid documents and 3 photos.', 400, parseResult.error.issues);
    }

    const result = await registrationService.submitRegistrationApplication(parseResult.data, req.files);
    return success(res, result, result.message, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const getStatus = async (req, res) => {
  try {
    const applicationId = req.params.applicationId || req.query.applicationId;
    const identifier = req.params.identifier || req.query.identifier;
    if (!applicationId && !identifier) {
      return error(res, 'Please provide an Application ID (COL-YYYY-XXXXXX), email, or mobile number.', 400);
    }

    const statusData = await registrationService.getApplicationStatus(applicationId, identifier);
    return success(res, statusData, 'Application status retrieved');
  } catch (err) {
    return error(res, err.message, 404);
  }
};

export const getApplicationDetails = async (req, res) => {
  try {
    const applicationId = req.params.applicationId || req.query.applicationId;
    if (!applicationId) {
      return error(res, 'Application ID is required.', 400);
    }

    const data = await registrationService.getApplicationStatus(applicationId);
    return success(res, data, 'Application details retrieved');
  } catch (err) {
    return error(res, err.message, 404);
  }
};

export const resubmit = async (req, res) => {
  try {
    const rawBody = req.body || {};
    const applicationId = req.params.applicationId || rawBody.applicationId || rawBody.application_id;

    const normalized = {
      ...rawBody,
      applicationId,
      legalName: rawBody.legalName || rawBody.legal_name,
      collegeName: rawBody.collegeName || rawBody.college_name,
      degreeName: rawBody.degreeName || rawBody.degree_name,
      departmentStream: rawBody.departmentStream || rawBody.department_stream,
      documentUrl: req.files?.identity_document?.[0] || req.files?.document?.[0] || rawBody.documentUrl || rawBody.verification_id_url,
      photo1: req.files?.photo_1?.[0] || req.files?.photo1?.[0] || rawBody.photo1 || rawBody.photo_1,
      photo2: req.files?.photo_2?.[0] || req.files?.photo2?.[0] || rawBody.photo2 || rawBody.photo_2,
      photo3: req.files?.photo_3?.[0] || req.files?.photo3?.[0] || rawBody.photo3 || rawBody.photo_3,
    };

    const parseResult = resubmitCorrectionSchema.safeParse(normalized);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const result = await registrationService.resubmitCorrection(parseResult.data, req.files);
    return success(res, result, result.message);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const getColleges = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const colleges = await collegeService.searchColleges(q);
    return success(res, { colleges }, 'Colleges directory retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const requestCollege = async (req, res) => {
  try {
    const { name, city, state, email } = req.body;
    if (!name || !city || !state) {
      return error(res, 'Name, city, and state are required to request a college entry.', 400);
    }

    const requested = await collegeService.requestNewCollege({ name, city, state }, email);
    return success(res, { college: requested }, 'College entry requested for admin verification', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export default {
  startRegistration,
  submitRegistration,
  getStatus,
  getApplicationDetails,
  resubmit,
  getColleges,
  requestCollege,
};
