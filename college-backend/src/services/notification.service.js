import { notificationsRepo } from './file.service.js';
import { emailService } from './email.service.js';
import { generateNotificationId } from '../utils/generateId.js';

export const notificationService = {
  createAndSend: async ({
    userId = null,
    applicationId = null,
    email = null,
    legalName = 'Applicant',
    type, // 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED' | 'DELAYED'
    title,
    message,
    metadata = {}
  }) => {
    // 1. Save in JSON notifications store
    const record = {
      id: generateNotificationId(),
      user_id: userId,
      application_id: applicationId,
      type,
      title,
      message,
      metadata,
      is_read: false,
      created_at: new Date().toISOString()
    };
    await notificationsRepo.add(record);

    // 2. Dispatch email notification if email provided
    if (email) {
      try {
        switch (type) {
          case 'SUBMITTED':
            await emailService.sendApplicationSubmitted({
              email,
              legalName,
              applicationId,
              reviewDeadline: metadata.reviewDeadline
            });
            break;
          case 'UNDER_REVIEW':
            await emailService.sendUnderReview({
              email,
              legalName,
              applicationId,
              adminName: metadata.adminName || 'Admin'
            });
            break;
          case 'CORRECTION':
            await emailService.sendCorrectionRequested({
              email,
              legalName,
              applicationId,
              fields: metadata.fields || [],
              message: metadata.message || message
            });
            break;
          case 'RESUBMITTED':
            await emailService.sendApplicationResubmitted({
              email,
              legalName,
              applicationId
            });
            break;
          case 'APPROVED':
            await emailService.sendApplicationApproved({
              email,
              legalName,
              applicationId
            });
            break;
          case 'REJECTED':
            await emailService.sendApplicationRejected({
              email,
              legalName,
              applicationId,
              reason: metadata.reason || message
            });
            break;
          case 'DELAYED':
            await emailService.sendApplicationDelayed({
              email,
              legalName,
              applicationId
            });
            break;
          default:
            break;
        }
      } catch (err) {
        console.error(`[WARN] Notification email failed for ${email}:`, err.message);
      }
    }

    return record;
  }
};
