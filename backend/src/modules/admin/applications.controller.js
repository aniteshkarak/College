import prisma from '../../config/prisma.js';
import storageService from '../../services/storageService.js';
import emailService from '../../services/emailService.js';
import { getReviewTimelineMetrics } from '../../utils/applicationUtils.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

/**
 * GET /api/v1/admin/applications
 * Returns searchable, filterable applications with 72-hour overview cards
 */
export const listApplications = async (req, res) => {
  try {
    const { status, college, search, overdue } = req.query;

    const whereClause = {};

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (college) {
      whereClause.collegeName = { contains: college, mode: 'insensitive' };
    }

    if (search) {
      whereClause.OR = [
        { applicationId: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search, mode: 'insensitive' } },
        { collegeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.pendingRegistration.findMany({
      where: whereClause,
      include: {
        photographs: { orderBy: { photoOrder: 'asc' } },
        identityDocument: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    const now = Date.now();
    const formatted = applications.map((app) => {
      const timeline = getReviewTimelineMetrics(app.submittedAt, app.reviewDeadline, app.status);
      return {
        ...app,
        timeline,
        isOverdue: timeline.isOverdue,
      };
    });

    // If filter by overdue
    const filtered = overdue === 'true'
      ? formatted.filter((a) => a.isOverdue)
      : formatted;

    // Overview Metrics
    const allApps = await prisma.pendingRegistration.findMany({
      select: { status: true, submittedAt: true, reviewDeadline: true },
    });

    let total = allApps.length;
    let pending = 0;
    let underReview = 0;
    let needsCorrection = 0;
    let approved = 0;
    let rejected = 0;
    let overdueCount = 0;

    allApps.forEach((a) => {
      if (a.status === 'PENDING_REVIEW') pending++;
      else if (a.status === 'UNDER_REVIEW') underReview++;
      else if (a.status === 'NEEDS_CORRECTION') needsCorrection++;
      else if (a.status === 'APPROVED') approved++;
      else if (a.status === 'REJECTED') rejected++;

      if (
        !['APPROVED', 'REJECTED'].includes(a.status) &&
        now > new Date(a.reviewDeadline).getTime()
      ) {
        overdueCount++;
      }
    });

    return success(res, {
      metrics: {
        total,
        pending,
        underReview,
        needsCorrection,
        approved,
        rejected,
        overdue: overdueCount,
        targetHours: 72,
      },
      applications: filtered,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/v1/admin/applications/:id
 * Full detailed application view (Sections A to F)
 */
export const getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.pendingRegistration.findFirst({
      where: {
        OR: [{ id }, { applicationId: id }],
      },
      include: {
        photographs: { orderBy: { photoOrder: 'asc' } },
        identityDocument: true,
        reviewHistory: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    const timeline = getReviewTimelineMetrics(
      application.submittedAt,
      application.reviewDeadline,
      application.status
    );

    return success(res, {
      application: {
        ...application,
        timeline,
      },
      sections: {
        sectionA_personal: {
          legalName: application.legalName,
          displayName: application.displayName,
          dateOfBirth: application.dateOfBirth,
          age: application.age,
          gender: application.gender,
          city: application.city,
          state: application.state,
          languagesSpoken: application.languagesSpoken,
          email: application.email,
          mobileNumber: application.mobileNumber,
        },
        sectionB_education: {
          collegeName: application.collegeName,
          universityName: application.universityName,
          collegeLocation: application.collegeLocation,
          collegeState: application.collegeState,
          degreeName: application.degreeName,
          departmentStream: application.departmentStream,
          academicYear: application.academicYear,
          currentSemester: application.currentSemester,
          graduationYear: application.graduationYear,
          studentStatus: application.studentStatus,
        },
        sectionC_identityDocument: application.identityDocument,
        sectionD_photographs: application.photographs,
        sectionE_aboutPreferences: {
          bio: application.bio,
          interests: application.interests,
          hobbies: application.hobbies,
          personality: application.personality,
          lookingFor: application.lookingFor,
          ageRangeMin: application.ageRangeMin,
          ageRangeMax: application.ageRangeMax,
          preferredDistance: application.preferredDistance,
        },
        sectionF_verificationMeta: {
          applicationId: application.applicationId,
          status: application.status,
          assignedAdminId: application.assignedAdminId,
          submittedAt: application.submittedAt,
          reviewDeadline: application.reviewDeadline,
          timeline,
          reviewHistory: application.reviewHistory,
        },
      },
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/v1/admin/applications/:id/assign
 */
  
export const assignApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.pendingRegistration.findFirst({
      where: {
        OR: [{ id }, { applicationId: id }],
      },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.pendingRegistration.update({
        where: { id: application.id },
        data: {
          assignedAdminId: req.admin.id,
        },
      });

      await tx.verificationHistory.create({
        data: {
          registrationId: app.id,
          adminId: req.admin.id,
          adminName: req.admin.fullName,
          action: 'ASSIGNED',
          notes: `Assigned to ${req.admin.fullName}.`,
          correctionFields: [],
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          action: 'ASSIGN_APPLICATION',
          targetType: 'APPLICATION',
          targetId: application.id,
          details: `Application ${application.applicationId} assigned to administrator ${req.admin.fullName}.`,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return app;
    });

    return success(res, updated, 'Application successfully assigned');
  } catch (err) {
    return error(res, 'Unable to assign application.', 500);
  }
};


/**
 * POST /api/v1/admin/applications/:id/start-review
 */
export const startReview = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.pendingRegistration.update({
        where: { id: application.id },
        data: {
          status: 'UNDER_REVIEW',
          reviewStartedAt: new Date(),
          assignedAdminId: req.admin.id,
        },
      });

      await tx.verificationHistory.create({
        data: {
          registrationId: app.id,
          adminId: req.admin.id,
	  adminName: req.admin.fullName,
          action: 'STARTED_REVIEW',
          notes: 'Admin opened and started inspecting applicant documents & photographs.',
          correctionFields: [],
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          action: 'START_REVIEW',
          targetType: 'APPLICATION',
          targetId: application.id,
          details: `Review started for application ${application.applicationId} by ${req.admin.fullName}.`,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return app;
    });

    // Notify applicant that their application is actively being checked
    emailService.sendUnderReviewNotification({
      email: application.email,
      legalName: application.legalName,
      applicationId: application.applicationId,
      adminName: req.admin.fullName,
    }).catch(() => {});

    return success(res, updated, 'Application marked as UNDER_REVIEW');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/v1/admin/applications/:id/approve
 * Executes secure database transaction to create the active user account
 */
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
      include: {
        photographs: true,
        identityDocument: true,
      },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    if (application.status === 'APPROVED') {
      return error(res, 'Application has already been approved and account is active', 400);
    }

    const adminId = req.admin.id;
    const adminName = req.admin.fullName;

    // Transactional Activation:
    // 1. Create User
    // 2. Create UserProfile
    // 3. Create Education
    // 4. Update Photographs & Document
    // 5. Update PendingRegistration to APPROVED
    // 6. Record Audit Log
    const result = await prisma.$transaction(async (tx) => {
      // 1. User
      const newUser = await tx.user.create({
        data: {
          applicationId: application.id,
          email: application.email,
          mobileNumber: application.mobileNumber,
          passwordHash: application.passwordHash,
          fullName: application.legalName,
          displayName: application.displayName,
          dateOfBirth: application.dateOfBirth,
          age: application.age,
          gender: application.gender,
          accountStatus: 'ACTIVE',
          role: 'STUDENT',
          verificationStatus: 'APPROVED',
          approvedAt: new Date(),
          approvedByAdminId: adminId,
        },
      });

      // 2. UserProfile
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          bio: application.bio,
          interests: application.interests,
          hobbies: application.hobbies,
          personality: application.personality,
          relationshipIntention: application.lookingFor === 'Dating' ? 'Dating Connection' : 'Casual Connection',
          lookingFor: application.lookingFor,
          ageRangeMin: application.ageRangeMin,
          ageRangeMax: application.ageRangeMax,
          preferredDistance: application.preferredDistance,
          city: application.city,
          state: application.state,
          languages: application.languagesSpoken,
        },
      });

      // 3. Education
      await tx.education.create({
        data: {
          userId: newUser.id,
          collegeName: application.collegeName,
          universityName: application.universityName,
          degreeName: application.degreeName,
          departmentStream: application.departmentStream,
          academicYear: application.academicYear,
          currentSemester: application.currentSemester,
          graduationYear: application.graduationYear,
          studentStatus: application.studentStatus,
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      // 4. Photos
      await tx.userPhoto.updateMany({
        where: { registrationId: application.id },
        data: {
          userId: newUser.id,
          isApproved: true,
        },
      });

      // 5. Document
      if (application.identityDocument) {
        await tx.identityDocument.update({
          where: { id: application.identityDocument.id },
          data: {
            userId: newUser.id,
            isVerified: true,
            verifiedAt: new Date(),
          },
        });
      }

      // 6. Update PendingRegistration status
      const updatedApp = await tx.pendingRegistration.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      // 7. Verification History
      await tx.verificationHistory.create({
        data: {
          registrationId: application.id,
          adminId,
          adminName,
          action: 'APPROVED',
          notes: 'Personal identity, 18+ eligibility, college student status, and all 3 photographs manually approved.',
          correctionFields: [],
        },
      });

      // 8. Admin Audit Log
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'APPROVE_APPLICATION',
          targetType: 'APPLICATION',
          targetId: application.id,
          details: `Application ${application.applicationId} approved. Active User account ${newUser.id} created.`,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return { user: newUser, application: updatedApp };
    });

    // Dispatch approval notice email with activation confirmation
    emailService.sendApprovalEmail({
      email: application.email,
      legalName: application.legalName,
      displayName: application.displayName,
      applicationId: application.applicationId,
    }).catch(() => {});

    return success(
      res,
      {
        userId: result.user.id,
        applicationId: result.application.applicationId,
        status: 'APPROVED',
        approvedAt: result.user.approvedAt,
      },
      `Application ${application.applicationId} successfully APPROVED! Active account created for ${application.displayName}.`
    );
  } catch (err) {
    return error(res, `Approval transaction failed: ${err.message}`, 500);
  }
};

/**
 * POST /api/v1/admin/applications/:id/reject
 */
const rejectSchema = z.object({
  reason: z.string().min(5, 'A clear rejection reason is required (min 5 characters)'),
  explanation: z.string().optional(),
});

export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = rejectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed: A valid rejection reason is required', 400, parseResult.error.issues);
    }

    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    if (application.status === 'APPROVED') {
      return error(res, 'Cannot reject an application that has already been approved.', 400);
    }

    const adminId = req.admin.id;
    const adminName = req.admin.fullName;
    const reason = parseResult.data.reason;

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.pendingRegistration.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          reviewedAt: new Date(),
        },
      });

      await tx.verificationHistory.create({
        data: {
          registrationId: app.id,
          adminId,
          adminName,
          action: 'REJECTED',
          notes: reason,
          correctionFields: [],
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REJECT_APPLICATION',
          targetType: 'APPLICATION',
          targetId: application.id,
          details: `Application ${application.applicationId} rejected. Reason: ${reason}`,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return app;
    });

    // Dispatch rejection email with clear explanation
    emailService.sendRejectionEmail({
      email: application.email,
      legalName: application.legalName,
      applicationId: application.applicationId,
      reason,
    }).catch(() => {});

    return success(
      res,
      { applicationId: updated.applicationId, status: updated.status, rejectionReason: reason },
      `Application ${application.applicationId} was REJECTED.`
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/v1/admin/applications/:id/request-correction
 */
const correctionSchema = z.object({
  correctionFields: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional(),
  message: z.string().min(5, 'Correction instructions for the applicant are required'),
});

export const requestCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = correctionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    if (application.status === 'APPROVED') {
      return error(res, 'Cannot request corrections for an already approved application.', 400);
    }

    const adminId = req.admin.id;
    const adminName = req.admin.fullName;
    const targetFields = parseResult.data.correctionFields || parseResult.data.fields || [];

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.pendingRegistration.update({
        where: { id: application.id },
        data: {
          status: 'NEEDS_CORRECTION',
          correctionFields: targetFields,
          correctionMessage: parseResult.data.message,
        },
      });

      await tx.verificationHistory.create({
        data: {
          registrationId: app.id,
          adminId,
          adminName,
          action: 'REQUESTED_CORRECTION',
          notes: parseResult.data.message,
          correctionFields: targetFields,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REQUEST_CORRECTION',
          targetType: 'APPLICATION',
          targetId: application.id,
          details: `Correction requested for application ${application.applicationId}. Fields: ${targetFields.join(', ')}. Instructions: ${parseResult.data.message}`,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return app;
    });

    // Dispatch correction request email with instructions
    emailService.sendCorrectionRequestEmail({
      email: application.email,
      legalName: application.legalName,
      applicationId: application.applicationId,
      fields: targetFields,
      message: parseResult.data.message,
    }).catch(() => {});

    return success(
      res,
      { applicationId: updated.applicationId, status: updated.status, correctionFields: updated.correctionFields },
      `Correction request sent to applicant for fields: ${updated.correctionFields.join(', ')}`
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/v1/admin/applications/:id/history
 */
export const getReviewHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
      include: {
        reviewHistory: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    return success(res, { history: application.reviewHistory });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/v1/admin/applications/:id/documents/:documentId
 * Streams private identity document securely to authorized admin
 * Strictly verifies document ownership against the specific application to prevent cross-application leakage
 */
export const getPrivateDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    // 1. Verify application exists
    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    // 2. Strictly verify document belongs to this specific application
    const doc = await prisma.identityDocument.findFirst({
      where: {
        id: documentId,
        registrationId: application.id,
      },
    });

    if (!doc) {
      return error(res, 'Identity document not found for this application', 404);
    }

    // 3. Securely stream from private storage (safe against path traversal)
    const { stream, mimeType, filename: safeName } = storageService.getPrivateFileStream('documents', doc.filePath);

    // 4. Record administrator document access in audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'VIEW_DOCUMENT',
        targetType: 'DOCUMENT',
        targetId: doc.id,
        details: `Administrator ${req.admin.fullName} viewed identity document for application ${application.applicationId}.`,
        ipAddress: req.ip || req.socket?.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
      },
    }).catch(() => {});

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    return stream.pipe(res);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/v1/admin/applications/:id/photos/:photoId
 * Streams private applicant photograph securely to authorized admin
 * Strictly verifies photograph ownership against the specific application to prevent cross-application leakage
 */
export const getPrivatePhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;

    // 1. Verify application exists
    const application = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ id }, { applicationId: id }] },
    });

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    // 2. Strictly verify photo belongs to this specific application
    const photo = await prisma.userPhoto.findFirst({
      where: {
        id: photoId,
        registrationId: application.id,
      },
    });

    if (!photo) {
      return error(res, 'Photograph not found for this application', 404);
    }

    // 3. Securely stream from private storage
    const { stream, mimeType, filename: safeName } = storageService.getPrivateFileStream('photos', photo.photoUrl);

    // 4. Record administrator photograph access in audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'VIEW_PHOTO',
        targetType: 'PHOTO',
        targetId: photo.id,
        details: `Administrator ${req.admin.fullName} viewed photograph #${photo.photoOrder} for application ${application.applicationId}.`,
        ipAddress: req.ip || req.socket?.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
      },
    }).catch(() => {});

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    return stream.pipe(res);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * Unverified direct file streaming is disabled for security.
 * File retrieval must specify verified application ownership.
 */
export const streamPrivateFile = async (req, res) => {
  return error(res, 'Direct file streaming without verified application context is disabled for security.', 403);
};

export default {
  listApplications,
  getApplicationDetails,
  assignApplication,
  startReview,
  approveApplication,
  rejectApplication,
  requestCorrection,
  getReviewHistory,
  getPrivateDocument,
  getPrivatePhoto,
  streamPrivateFile,
};
