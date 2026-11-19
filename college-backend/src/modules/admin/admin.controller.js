import { adminService } from './admin.service.js';

export const adminController = {
  /**
   * GET /api/v1/admin/metrics
   */
  getMetrics: async (req, res, next) => {
    try {
      const metrics = await adminService.getMetrics();
      return res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/applications
   */
  listApplications: async (req, res, next) => {
    try {
      const { status, isOverdue, search, page, limit } = req.query;
      const result = await adminService.listApplications({
        status,
        isOverdue,
        search,
        page,
        limit
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
   * GET /api/v1/admin/applications/:id
   */
  getApplicationDetails: async (req, res, next) => {
    try {
      const { id } = req.params;
      const details = await adminService.getApplicationDetails(id);

      return res.status(200).json({
        success: true,
        data: details
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/applications/:id/start-review
   */
  claimApplication: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await adminService.claimApplication(id, req.user);

      return res.status(200).json({
        success: true,
        message: `Application ${updated.application_id} claimed and marked UNDER_REVIEW.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/applications/:id/approve
   */
  approveApplication: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await adminService.approveApplication(id, req.user);

      return res.status(200).json({
        success: true,
        message: `Application ${id} approved successfully! Active user account created.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/applications/:id/reject
   */
  rejectApplication: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = await adminService.rejectApplication(id, reason, req.user);

      return res.status(200).json({
        success: true,
        message: `Application ${updated.application_id} rejected.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/applications/:id/request-correction
   */
  requestCorrection: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fields, message } = req.body;
      const updated = await adminService.requestCorrection(id, { fields, message }, req.user);

      return res.status(200).json({
        success: true,
        message: `Correction requested for application ${updated.application_id}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/documents/:subfolder/:filename
   * Stream private documents and photos to authorized admins only
   */
  streamDocument: async (req, res, next) => {
    try {
      const { subfolder, filename } = req.params;
      const { stream, mimeType, size } = await adminService.getPrivateDocumentStream(filename, subfolder);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', size);
      res.setHeader('Cache-Control', 'private, no-cache, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
};
