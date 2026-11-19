import { fullRegistrationSchema, resubmitCorrectionSchema } from './registration.validator.js';
import registrationService from './registration.service.js';
import collegeService from '../../services/collegeService.js';
import storageService from '../../services/storageService.js';
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
    const parseResult = fullRegistrationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed: Please ensure all 6 steps are completely filled with valid documents and 3 photos.', 400, parseResult.error.issues);
    }

    const result = await registrationService.submitRegistrationApplication(parseResult.data);
    return success(res, result, result.message, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const getStatus = async (req, res) => {
  try {
    const { applicationId, identifier } = req.query;
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
    const { applicationId } = req.query;
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
    const parseResult = resubmitCorrectionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const result = await registrationService.resubmitCorrection(parseResult.data);
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
    return error(res, err.message, 400);
  }
};

export const uploadPrivateFile = async (req, res) => {
  try {
    const { fileData, originalName, mimeType, type, photoOrder } = req.body;
    if (!fileData || !originalName || !mimeType) {
      return error(res, 'File data, name, and mimeType are required', 400);
    }

    if (type === 'PHOTO') {
      const stored = await storageService.storePrivatePhoto(fileData, originalName, mimeType, photoOrder || 1);
      return success(res, stored, 'Photo uploaded to private storage', 201);
    } else {
      const stored = await storageService.storePrivateDocument(fileData, originalName, mimeType);
      return success(res, stored, 'Document uploaded to private storage', 201);
    }
  } catch (err) {
    return error(res, err.message, 400);
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
  uploadPrivateFile,
};
