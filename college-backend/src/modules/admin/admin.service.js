import path from 'path';
import fs from 'fs';
import { applicationsRepo, reviewsRepo, executeApprovalTransaction } from '../../services/file.service.js';
import { notificationService } from '../../services/notification.service.js';
import { getOverdueStatus } from '../../utils/date.js';
import { STORAGE_PATHS } from '../../config/storage.js';

export const adminService = {
  /**
   * 1. Overview Metrics for 72-Hour Verification SLA
   */
  getMetrics: async () => {
    const apps = await applicationsRepo.getAll();
    const now = new Date();

    const metrics = {
      total: apps.length,
      pending: apps.filter((a) => a.status === 'PENDING_REVIEW').length,
      underReview: apps.filter((a) => a.status === 'UNDER_REVIEW').length,
      needsCorrection: apps.filter((a) => a.status === 'NEEDS_CORRECTION').length,
      resubmitted: apps.filter((a) => a.status === 'RESUBMITTED').length,
      approved: apps.filter((a) => a.status === 'APPROVED').length,
      rejected: apps.filter((a) => a.status === 'REJECTED').length,
      overdue: apps.filter((a) => {
        const isActionable = ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(a.status);
        const pastDeadline = a.review_deadline && new Date(a.review_deadline) < now;
        return isActionable && pastDeadline;
      }).length
    };

    return metrics;
  },

  /**
   * 2. List Applications with Status & Overdue Filters
   */
  listApplications: async ({ status, isOverdue, search, page = 1, limit = 50 }) => {
    const apps = await applicationsRepo.getAll();
    const now = new Date();

    let filtered = apps.map((a) => {
      const deadlineInfo = getOverdueStatus(a.review_deadline, a.status);
      return {
        ...a,
        overdueInfo
      };
    });

    // Filter by status
    if (status && status !== 'ALL') {
      filtered = filtered.filter((a) => a.status === status);
    }

    // Filter by overdue (>72 hours)
    if (isOverdue === 'true' || isOverdue === true) {
      filtered = filtered.filter((a) => {
        const isActionable = ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(a.status);
        const pastDeadline = a.review_deadline && new Date(a.review_deadline) < now;
        return isActionable && pastDeadline;
      });
    }

    // Filter by Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((a) => {
        const matchAppId = (a.application_id || '').toLowerCase().includes(q);
        const matchLegalName = (a.legal_name || '').toLowerCase().includes(q);
        const matchDisplayName = (a.display_name || '').toLowerCase().includes(q);
        const matchEmail = (a.email || '').toLowerCase().includes(q);
        const matchMobile = (a.mobile || '').includes(q);
        const matchCollege = (a.college_name || '').toLowerCase().includes(q);
        return matchAppId || matchLegalName || matchDisplayName || matchEmail || matchMobile || matchCollege;
      });
    }

    // Pagination
    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      applications: paginated,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  },

  /**
   * 3. Get Full Application Details (Sections A to F) & Audit History
   */
  getApplicationDetails: async (appId) => {
    const app = await applicationsRepo.getByAppId(appId) || await applicationsRepo.getById(appId);
    if (!app) {
      const err = new Error(`Application ${appId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    const reviewHistory = await reviewsRepo.getByApplicationId(app.application_id);
    const deadlineInfo = getOverdueStatus(app.review_deadline, app.status);

    return {
      application: {
        ...app,
        overdueInfo: deadlineInfo
      },
      reviewHistory
    };
  },

  /**
   * 4. Action: Claim / Mark Under Review
   */
  claimApplication: async (appId, adminUser) => {
    const app = await applicationsRepo.getByAppId(appId) || await applicationsRepo.getById(appId);
    if (!app) {
      const err = new Error(`Application ${appId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    const adminName = adminUser.display_name || adminUser.email;
    const updated = await applicationsRepo.update(app.id, {
      status: 'UNDER_REVIEW',
      assigned_admin: adminName
    });

    // Record review log
    await reviewsRepo.add({
      id: `rev_${Date.now()}`,
      application_id: app.application_id,
      application_primary_id: app.id,
      admin_id: adminUser.id,
      admin_name: adminName,
      action: 'CLAIM_REVIEW',
      previous_status: app.status,
      new_status: 'UNDER_REVIEW',
      notes: `Claimed for manual inspection by ${adminName}.`,
      created_at: new Date().toISOString()
    });

    // Notify applicant
    await notificationService.createAndSend({
      applicationId: app.application_id,
      email: app.email,
      legalName: app.legal_name,
      type: 'UNDER_REVIEW',
      title: 'Application Under Review',
      message: `Your application is currently being checked by campus administrator ${adminName}.`,
      metadata: { adminName }
    });

    return updated;
  },

  /**
   * 5. Action: Approve Application -> Transactional User Creation
   */
  approveApplication: async (appId, adminUser) => {
    const app = await applicationsRepo.getByAppId(appId) || await applicationsRepo.getById(appId);
    if (!app) {
      const err = new Error(`Application ${appId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    if (app.status === 'APPROVED') {
      const err = new Error(`Application ${app.application_id} is already approved.`);
      err.statusCode = 400;
      err.code = 'ALREADY_APPROVED';
      throw err;
    }

    // Execute journaled transaction (User creation + Application update + Review log)
    const txResult = await executeApprovalTransaction({
      application: app,
      adminUser
    });

    // Dispatch Approval Notification & Welcome Email
    await notificationService.createAndSend({
      userId: txResult.user.id,
      applicationId: app.application_id,
      email: app.email,
      legalName: app.legal_name,
      type: 'APPROVED',
      title: 'Application Approved!',
      message: 'Congratulations! Your Collégé student application has been approved and your active account has been created.'
    });

    return txResult;
  },

  /**
   * 6. Action: Reject Application (Mandatory Reason Required)
   */
  rejectApplication: async (appId, reason, adminUser) => {
    if (!reason || !reason.trim()) {
      const err = new Error('Mandatory rejection reason is required.');
      err.statusCode = 400;
      err.code = 'REJECTION_REASON_REQUIRED';
      throw err;
    }

    const app = await applicationsRepo.getByAppId(appId) || await applicationsRepo.getById(appId);
    if (!app) {
      const err = new Error(`Application ${appId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    const adminName = adminUser.display_name || adminUser.email;
    const cleanReason = reason.trim();

    const updated = await applicationsRepo.update(app.id, {
      status: 'REJECTED',
      rejection_reason: cleanReason,
      assigned_admin: adminName
    });

    // Record Review History
    await reviewsRepo.add({
      id: `rev_${Date.now()}`,
      application_id: app.application_id,
      application_primary_id: app.id,
      admin_id: adminUser.id,
      admin_name: adminName,
      action: 'REJECT',
      previous_status: app.status,
      new_status: 'REJECTED',
      notes: cleanReason,
      created_at: new Date().toISOString()
    });

    // Send Rejection Notification & Email
    await notificationService.createAndSend({
      applicationId: app.application_id,
      email: app.email,
      legalName: app.legal_name,
      type: 'REJECTED',
      title: 'Application Update',
      message: `Application declined: "${cleanReason}".`,
      metadata: { reason: cleanReason }
    });

    return updated;
  },

  /**
   * 7. Action: Request Correction
   */
  requestCorrection: async (appId, { fields = [], message }, adminUser) => {
    if (!message || !message.trim()) {
      const err = new Error('Correction instructions for applicant are mandatory.');
      err.statusCode = 400;
      err.code = 'CORRECTION_NOTE_REQUIRED';
      throw err;
    }

    const app = await applicationsRepo.getByAppId(appId) || await applicationsRepo.getById(appId);
    if (!app) {
      const err = new Error(`Application ${appId} not found`);
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    const adminName = adminUser.display_name || adminUser.email;
    const cleanMessage = message.trim();

    const updated = await applicationsRepo.update(app.id, {
      status: 'NEEDS_CORRECTION',
      correction_fields: fields,
      correction_message: cleanMessage,
      assigned_admin: adminName
    });

    // Record Review History
    await reviewsRepo.add({
      id: `rev_${Date.now()}`,
      application_id: app.application_id,
      application_primary_id: app.id,
      admin_id: adminUser.id,
      admin_name: adminName,
      action: 'REQUEST_CORRECTION',
      previous_status: app.status,
      new_status: 'NEEDS_CORRECTION',
      notes: `Requested corrections on fields: ${fields.join(', ')}. Note: "${cleanMessage}"`,
      created_at: new Date().toISOString()
    });

    // Send Notification & Email
    await notificationService.createAndSend({
      applicationId: app.application_id,
      email: app.email,
      legalName: app.legal_name,
      type: 'CORRECTION',
      title: 'Information Correction Requested',
      message: cleanMessage,
      metadata: { fields, message: cleanMessage }
    });

    return updated;
  },

  /**
   * 8. Private Document Streaming (Protected Admin Access Only)
   */
  getPrivateDocumentStream: async (filename, subfolder = 'vault') => {
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const targetDir = subfolder === 'photos'
      ? STORAGE_PATHS.PRIVATE_PHOTOS_DIR
      : STORAGE_PATHS.PRIVATE_DOCUMENTS_DIR;

    const fullPath = path.join(targetDir, safeFilename);
    if (!fs.existsSync(fullPath)) {
      const err = new Error('Requested private document does not exist.');
      err.statusCode = 404;
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    // Determine MIME type
    const ext = path.extname(safeFilename).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    if (ext === '.webp') mimeType = 'image/webp';
    if (ext === '.pdf') mimeType = 'application/pdf';

    return {
      stream: fs.createReadStream(fullPath),
      mimeType,
      size: (await fs.promises.stat(fullPath)).size
    };
  }
};
