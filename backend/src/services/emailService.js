import nodemailer from 'nodemailer';
import { Queue, Worker } from 'bullmq';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import redis from '../config/redis.js';

let transporter = null;

// Initialize Nodemailer transporter
if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  logger.info(`Nodemailer SMTP configured with host: ${config.smtp.host}:${config.smtp.port}`);
}

// Background email queue via BullMQ (when Redis is available)
let emailQueue = null;
let emailWorker = null;

try {
  if (redis.status === 'ready' || redis.status === 'connect') {
    emailQueue = new Queue('college-emails', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    });

    emailWorker = new Worker(
      'college-emails',
      async (job) => {
        return sendDirect(job.data);
      },
      { connection: redis }
    );

    emailWorker.on('failed', (job, err) => {
      logger.error(`Email job ${job.id} failed: ${err.message}`);
    });
  }
} catch (queueErr) {
  logger.warn(`BullMQ email queue disabled, using direct delivery: ${queueErr.message}`);
}

/**
 * Direct email sender using Nodemailer or dev preview logger
 */
const sendDirect = async ({ to, subject, html, text }) => {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email delivered to ${to} (MessageId: ${info.messageId})`);
      return { delivered: true, messageId: info.messageId, provider: 'smtp' };
    } catch (err) {
      logger.error(`SMTP delivery to ${to} failed: ${err.message}`);
      return { delivered: false, error: err.message };
    }
  }

  // Development Preview Mode (Safe console logging when SMTP is unconfigured)
  logger.info(`\n======================================================`);
  logger.info(`[COLLÉGÉ EMAIL DISPATCH PREVIEW - NO SMTP CONFIGURED]`);
  logger.info(`To: ${to}`);
  logger.info(`Subject: ${subject}`);
  logger.info(`Body:\n${text}`);
  logger.info(`======================================================\n`);

  return {
    delivered: false,
    previewMode: true,
    to,
    subject,
  };
};

/**
 * Dispatches email through BullMQ queue if active, otherwise falls back to direct sending
 */
const dispatchEmail = async (emailPayload) => {
  try {
    if (emailQueue && redis.status === 'ready') {
      await emailQueue.add('send-transactional-email', emailPayload);
      return { queued: true };
    }
  } catch (_) {
    // If Redis queue fails, send immediately
  }
  return sendDirect(emailPayload);
};

// Common Brand Header HTML
const emailHeader = (title, accentColor = '#e11d48') => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, ${accentColor}, #be123c); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Collégé</h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0; font-size: 13px; font-weight: 500;">Meet. Chat. Connect. — 18+ Campus Community</p>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">${title}</h2>
`;

const emailFooter = () => `
    </div>
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 12px; color: #64748b;">Collégé — Exclusively for Verified College Students Across India</p>
      <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8;">This is an automated transactional security email. Please do not reply directly.</p>
    </div>
  </div>
`;

export const emailService = {
  /**
   * 1. Registration Confirmation Email
   */
  sendRegistrationConfirmation: async ({ email, displayName }) => {
    const subject = 'Welcome to Collégé – Your Registration has Started!';
    const text = `Hello ${displayName},\n\nWelcome to Collégé! Your registration profile has been initialized.\n\nPlease complete all steps including uploading your College ID and exactly 3 photographs to enter our 72-hour manual verification queue.\n\nBest,\nCollégé Team`;
    const html = `
      ${emailHeader('Welcome to Collégé! 🎓', '#e11d48')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${displayName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Thank you for beginning your registration on Collégé. To maintain safety across campus communities, every applicant is manually verified by authorized administrators.</p>
      <div style="background: #fdf2f8; border-left: 4px solid #db2777; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #9d174d; font-size: 13px; font-weight: 600;">Next Steps:</p>
        <p style="margin: 4px 0 0; color: #701a75; font-size: 13px;">Complete your academic details, provide your college ID, and upload 3 clear photographs.</p>
      </div>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 2. Email OTP Verification
   */
  sendEmailOtp: async ({ email, otp, expiresMinutes = 10 }) => {
    const subject = `Your Collégé Verification Code: ${otp}`;
    const text = `Your Collégé verification code is: ${otp}. It will expire in ${expiresMinutes} minutes. Never share this code with anyone.`;
    const html = `
      ${emailHeader('Email Verification Code 🔒', '#2563eb')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Please use the one-time code below to verify your email address on Collégé:</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 14px 28px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 8px;">Valid for ${expiresMinutes} minutes. Do not share with anyone.</p>
      </div>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 3. Application Submission Confirmation (72-Hour Manual Verification Timeline)
   */
  sendApplicationSubmitted: async ({ email, legalName, applicationId, reviewDeadline }) => {
    const formattedDeadline = reviewDeadline ? new Date(reviewDeadline).toLocaleString('en-IN') : 'Within 72 Hours';
    const subject = `Collégé Application Received – ${applicationId}`;
    const text = `Hello ${legalName},\n\nYour application (${applicationId}) has been successfully submitted to Collégé. Our campus verification team will review your college credentials and photographs within 72 hours.\nReview Target Deadline: ${formattedDeadline}\n\nYou can track your status anytime with your Application ID.\n\nBest regards,\nCollégé Verification Team`;
    const html = `
      ${emailHeader('Application Submitted for 72-Hour Review 📋', '#e11d48')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${legalName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your Collégé application has been successfully submitted and entered into our manual verification queue.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Application ID</p>
        <p style="margin: 4px 0 12px; font-family: monospace; font-size: 20px; font-weight: 800; color: #0f172a;">${applicationId}</p>
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Target Review Deadline</p>
        <p style="margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #2563eb;">${formattedDeadline} (Up to 72 Hours)</p>
      </div>
      <p style="color: #475569; font-size: 13px; line-height: 1.5;">Every single credential, student ID, and personal photograph is reviewed by authorized human administrators to maintain platform safety. We will notify you by email as soon as an administrator takes action.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 4. Application Under Review Notification
   */
  sendUnderReviewNotification: async ({ email, legalName, applicationId, adminName }) => {
    const subject = `Collégé Application Under Review – ${applicationId}`;
    const text = `Hello ${legalName},\n\nYour application (${applicationId}) has been claimed by campus reviewer ${adminName || 'Admin'} and is currently being inspected.\n\nCollégé Team`;
    const html = `
      ${emailHeader('Review in Progress 🔍', '#2563eb')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${legalName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">An authorized campus administrator (<strong>${adminName || 'Reviewer'}</strong>) has started reviewing your student documents and profile photographs for application <strong>${applicationId}</strong>.</p>
      <p style="color: #475569; font-size: 13px;">You will receive another update once the evaluation is finalized.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 5. Admin Approval Email (Account Activated)
   */
  sendApprovalEmail: async ({ email, legalName, displayName, applicationId }) => {
    const subject = `Congratulations! Your Collégé Account is Approved 🎉`;
    const text = `Hello ${displayName || legalName},\n\nCongratulations! Your Collégé application (${applicationId}) has been approved by the administration team.\nYour account is now ACTIVE. You can now log in using your email/mobile and password to discover peers, send match requests, and connect!\n\nWelcome to Collégé!`;
    const html = `
      ${emailHeader('Account Approved! Welcome to Campus 🎓✨', '#059669')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${displayName || legalName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">We are pleased to inform you that your college enrollment, identity document, and photographs have been successfully verified!</p>
      <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 18px; margin: 18px 0; text-align: center;">
        <span style="font-size: 32px;">🎓</span>
        <h3 style="margin: 8px 0 4px; color: #065f46; font-size: 16px;">Account Status: ACTIVE</h3>
        <p style="margin: 0; color: #047857; font-size: 13px;">Full access to Discovery, Campus Board, Mutual Matching & Real-time Chat unlocked.</p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">You may now log in to Collégé with your registered email or mobile number and password.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 6. Application Rejection Email
   */
  sendRejectionEmail: async ({ email, legalName, applicationId, reason }) => {
    const subject = `Important: Update Regarding Collégé Application ${applicationId}`;
    const text = `Hello ${legalName},\n\nThank you for applying to Collégé. After careful review, our administration team was unable to approve application ${applicationId}.\n\nReason: "${reason}"\n\nIf you believe this was an error or you have updated documentation, you may submit a new application on our portal.\n\nCollégé Moderation Team`;
    const html = `
      ${emailHeader('Application Evaluation Notice', '#dc2626')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${legalName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Thank you for your interest in Collégé. After manual inspection of your submitted documents, our verification team has declined application <strong>${applicationId}</strong>.</p>
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; font-weight: 700; color: #991b1b;">Rejection Reason:</p>
        <p style="margin: 6px 0 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">"${reason}"</p>
      </div>
      <p style="color: #475569; font-size: 13px; line-height: 1.5;">Collégé strictly requires active college enrollment and verifiable documentation to keep the platform safe for all students. If you have valid credentials, you are welcome to submit a fresh application.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 7. Correction Request Email
   */
  sendCorrectionRequestEmail: async ({ email, legalName, applicationId, fields = [], message }) => {
    const subject = `Action Required: Correction Needed for Application ${applicationId}`;
    const text = `Hello ${legalName},\n\nOur reviewer requested corrections on your Collégé application (${applicationId}).\n\nFields requiring correction: ${fields.join(', ')}\nAdmin Instructions:\n"${message}"\n\nPlease log in to update and resubmit your details.\n\nCollégé Team`;
    const html = `
      ${emailHeader('Correction Requested ⚠️', '#d97706')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${legalName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Our campus verification team checked your application (<strong>${applicationId}</strong>) and noted that certain details require your correction before we can proceed.</p>
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #92400e;">Fields Requiring Update:</p>
        <p style="margin: 4px 0 12px; color: #b45309; font-weight: 600; font-size: 14px;">${fields.length > 0 ? fields.join(', ') : 'Document / Photo Details'}</p>
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #92400e;">Administrator's Instructions:</p>
        <p style="margin: 4px 0 0; color: #451a03; font-size: 13px; font-style: italic;">"${message}"</p>
      </div>
      <p style="color: #475569; font-size: 13px;">Please log in to your Collégé status portal to upload the corrected information.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 8. Resubmission Confirmation Email
   */
  sendResubmissionConfirmation: async ({ email, legalName, applicationId, reviewDeadline }) => {
    const formattedDeadline = reviewDeadline ? new Date(reviewDeadline).toLocaleString('en-IN') : 'Within 72 Hours';
    const subject = `Collégé Application Resubmitted – ${applicationId}`;
    const text = `Hello ${legalName},\n\nYour corrected application (${applicationId}) has been received and returned to the review queue. We will complete verification by ${formattedDeadline}.\n\nCollégé Team`;
    const html = `
      ${emailHeader('Application Resubmitted 🔄', '#2563eb')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${legalName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your corrected details for application <strong>${applicationId}</strong> have been successfully resubmitted to our administration queue.</p>
      <p style="color: #475569; font-size: 13px;">Review Target Deadline: <strong>${formattedDeadline}</strong>.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 9. Password Reset Email
   */
  sendPasswordResetEmail: async ({ email, resetToken, resetUrl }) => {
    const subject = 'Reset Your Collégé Password';
    const url = resetUrl || `http://localhost:5173/?resetToken=${resetToken}`;
    const text = `Hello,\n\nA password reset request was received for your Collégé account. Click the link below to set a new password:\n${url}\n\nThis link will expire in 1 hour. If you did not make this request, please ignore this email.`;
    const html = `
      ${emailHeader('Password Reset Request 🔑', '#4f46e5')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">A password reset request was initiated for your Collégé account.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${url}" style="background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 10px; font-size: 14px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 12px;">This link will expire in 1 hour. If you did not request a password reset, your account remains secure and no action is required.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },

  /**
   * 10. Important Security Notifications
   */
  sendSecurityAlert: async ({ email, alertType = 'New Login', details = '', timestamp = new Date() }) => {
    const subject = `Security Alert: ${alertType} on your Collégé Account`;
    const text = `Security Alert: ${alertType} detected on your Collégé account at ${new Date(timestamp).toLocaleString('en-IN')}.\nDetails: ${details}\nIf this was not you, please reset your password immediately.`;
    const html = `
      ${emailHeader('Security Alert 🛡️', '#dc2626')}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">We detected important activity on your Collégé account:</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a;">${alertType}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">${new Date(timestamp).toLocaleString('en-IN')}</p>
        ${details ? `<p style="margin: 8px 0 0; font-size: 13px; color: #334155;">${details}</p>` : ''}
      </div>
      <p style="color: #64748b; font-size: 12px;">If you recognize this action, no further steps are needed. If this wasn't you, please change your password immediately.</p>
      ${emailFooter()}
    `;
    return dispatchEmail({ to: email, subject, html, text });
  },
};

export default emailService;
