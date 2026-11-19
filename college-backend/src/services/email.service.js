import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';

let transporter = null;

// Initialize transporter if SMTP credentials provided
if (env.SMTP.HOST && env.SMTP.USER) {
  transporter = nodemailer.createTransport({
    host: env.SMTP.HOST,
    port: env.SMTP.PORT,
    secure: env.SMTP.PORT === 465,
    auth: {
      user: env.SMTP.USER,
      pass: env.SMTP.PASS
    }
  });
}

/**
 * Send email or development preview
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (transporter) {
    const info = await transporter.sendMail({
      from: env.SMTP.FROM,
      to,
      subject,
      text,
      html
    });
    return { delivered: true, messageId: info.messageId, provider: 'smtp' };
  }

  // Development Preview Mode (Safe logging when SMTP is not configured)
  console.log(`\n======================================================`);
  console.log(`[EMAIL DEVELOPMENT PREVIEW - NO SMTP CONFIGURED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body (Text):\n${text}`);
  console.log(`======================================================\n`);

  return {
    delivered: false,
    previewMode: true,
    note: 'SMTP not configured. Message displayed in development log.',
    to,
    subject
  };
};

export const emailService = {
  // 1. Application Submitted
  sendApplicationSubmitted: async ({ email, legalName, applicationId, reviewDeadline }) => {
    const subject = `Collégé Application Received – ${applicationId}`;
    const text = `Hello ${legalName},\n\nYour application (${applicationId}) has been successfully submitted to Collégé. Our campus verification team will review your college credentials and photographs within 72 hours.\nReview Target Deadline: ${new Date(reviewDeadline).toLocaleString('en-IN')}\n\nYou can track your status anytime with your Application ID.\n\nBest regards,\nCollégé Verification Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #e11d48; margin-top: 0;">Collégé – Application Received</h2>
        <p>Dear <strong>${legalName}</strong>,</p>
        <p>Your application has been received into our manual verification queue.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 15px 0;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Application ID:</p>
          <p style="margin: 4px 0 10px; font-size: 18px; font-weight: bold; color: #0f172a; font-family: monospace;">${applicationId}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Target Review Deadline:</p>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: bold; color: #2563eb;">Within 72 Hours (${new Date(reviewDeadline).toLocaleString('en-IN')})</p>
        </div>
        <p style="font-size: 13px; color: #475569;">Our authorized administrators inspect every student credential manually to maintain a safe campus community. We will notify you once a decision has been reached.</p>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  },

  // 2. Application Under Review
  sendUnderReview: async ({ email, legalName, applicationId, adminName }) => {
    const subject = `Collégé Application Under Review – ${applicationId}`;
    const text = `Hello ${legalName},\n\nYour application (${applicationId}) is currently being reviewed by administrator ${adminName}.\n\nCollégé Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h3 style="color: #2563eb; margin-top: 0;">Application Under Review</h3>
        <p>Dear <strong>${legalName}</strong>,</p>
        <p>Your application <strong>${applicationId}</strong> has been claimed by campus reviewer <strong>${adminName}</strong> and is currently being checked.</p>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  },

  // 3. Correction Requested
  sendCorrectionRequested: async ({ email, legalName, applicationId, fields, message }) => {
    const subject = `Action Required: Correction Needed for Application ${applicationId}`;
    const text = `Hello ${legalName},\n\nOur reviewer requested corrections on your application (${applicationId}).\n\nFields needing update: ${fields.join(', ')}\n\nInstructions from Admin:\n"${message}"\n\nPlease log in to your Collégé status dashboard to upload corrected details.\n\nCollégé Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #fffaf5;">
        <h3 style="color: #ea580c; margin-top: 0;">⚠️ Action Required: Information Correction</h3>
        <p>Dear <strong>${legalName}</strong>,</p>
        <p>Your application <strong>${applicationId}</strong> requires corrections before it can be approved.</p>
        <div style="background: #ffffff; padding: 12px; border-radius: 10px; border: 1px solid #fdba74; margin: 12px 0;">
          <p style="margin: 0; font-weight: bold; color: #9a3412;">Admin Note:</p>
          <p style="margin: 6px 0 0; color: #334155; font-size: 13px;">"${message}"</p>
        </div>
        <p style="font-size: 13px;">Please log in to your status dashboard to resubmit the corrected information.</p>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  },

  // 4. Application Resubmitted
  sendApplicationResubmitted: async ({ email, legalName, applicationId }) => {
    const subject = `Collégé Application Resubmitted – ${applicationId}`;
    const text = `Hello ${legalName},\n\nYour corrected application (${applicationId}) has been resubmitted and is back in the verification queue.\n\nCollégé Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h3 style="color: #7c3aed; margin-top: 0;">Resubmission Received</h3>
        <p>Dear <strong>${legalName}</strong>,</p>
        <p>Your updated information for application <strong>${applicationId}</strong> has been received and queued for review.</p>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  },

  // 5. Application Approved
  sendApplicationApproved: async ({ email, legalName, applicationId }) => {
    const subject = `Welcome to Collégé! Application Approved 🎓✨`;
    const text = `Congratulations ${legalName}!\n\nYour Collégé application (${applicationId}) has been verified and APPROVED.\nYour active account is now created! You can now log in using your email/mobile and password to discover campus peers and connect.\n\nWelcome aboard,\nCollégé Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #a7f3d0; border-radius: 16px; background-color: #f0fdf4;">
        <h2 style="color: #059669; margin-top: 0;">Congratulations, ${legalName}! 🎓</h2>
        <p style="font-size: 14px; color: #065f46;">Your application <strong>${applicationId}</strong> has been verified by our campus team and <strong>APPROVED</strong>!</p>
        <p style="font-size: 13px; color: #334155;">Your active profile is ready. Log in to your Collégé account to discover peers, join campus discussions, and make meaningful connections.</p>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  },

  // 6. Application Rejected
  sendApplicationRejected: async ({ email, legalName, applicationId, reason }) => {
    const subject = `Collégé Application Decision – ${applicationId}`;
    const text = `Dear ${legalName},\n\nThank you for your interest in Collégé. After careful manual inspection of application ${applicationId}, we are unable to approve your account at this time.\n\nReason: "${reason}"\n\nIf you believe this was an error, you may submit a new application with valid college credentials.\n\nCollégé Safety Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #fecdd3; border-radius: 16px; background-color: #fff1f2;">
        <h3 style="color: #e11d48; margin-top: 0;">Application Status Update</h3>
        <p>Dear <strong>${legalName}</strong>,</p>
        <p>After manual inspection of application <strong>${applicationId}</strong>, we are unable to approve your account at this time.</p>
        <div style="background: #ffffff; padding: 12px; border-radius: 10px; border: 1px solid #fda4af; margin: 12px 0;">
          <p style="margin: 0; font-weight: bold; color: #9f1239;">Reason:</p>
          <p style="margin: 6px 0 0; color: #334155; font-size: 13px;">"${reason}"</p>
        </div>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  },

  // 7. Application Delayed (Exceeded 72h SLA notification)
  sendApplicationDelayed: async ({ email, legalName, applicationId }) => {
    const subject = `Collégé Application Update – Verification In Progress (${applicationId})`;
    const text = `Dear ${legalName},\n\nWe apologize for the delay. Your application (${applicationId}) requires additional institutional verification and has taken longer than our standard 72-hour review window. Our senior verification administrator is prioritizing your application.\n\nCollégé Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h3 style="color: #475569; margin-top: 0;">Review In Progress</h3>
        <p>Dear <strong>${legalName}</strong>,</p>
        <p>Your application <strong>${applicationId}</strong> is still undergoing verification. While our target review SLA is 72 hours, higher application volumes or credential checks occasionally take slightly longer. We are prioritizing your review.</p>
      </div>
    `;
    return sendMail({ to: email, subject, html, text });
  }
};
