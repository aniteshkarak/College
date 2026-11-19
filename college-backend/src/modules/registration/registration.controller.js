import { registrationService } from './registration.service.js';
import { registrationSubmissionSchema, resubmissionSchema } from './registration.validator.js';

export const registrationController = {
  /**
   * POST /api/v1/registration/submit
   */
  submit: async (req, res, next) => {
    try {
      // Parse body if JSON or multipart form
      let payload = req.body;

      // Handle multipart form text fields that might be stringified
      if (typeof payload === 'object') {
        payload = { ...payload };
      }

      const validatedData = registrationSubmissionSchema.parse(payload);
      const result = await registrationService.submitApplication({
        validatedData,
        files: req.files || {}
      });

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/registration/status/:applicationId
   */
  getStatus: async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const statusData = await registrationService.getStatus(applicationId);

      return res.status(200).json({
        success: true,
        data: statusData
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/registration/application/:applicationId
   */
  getApplication: async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const data = await registrationService.getStatus(applicationId);

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/registration/update/:applicationId
   */
  update: async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const updates = resubmissionSchema.parse(req.body);

      const result = await registrationService.resubmitApplication({
        applicationId,
        updates,
        files: req.files || {}
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/registration/resubmit/:applicationId
   */
  resubmit: async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const updates = resubmissionSchema.parse(req.body);

      const result = await registrationService.resubmitApplication({
        applicationId,
        updates,
        files: req.files || {}
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
