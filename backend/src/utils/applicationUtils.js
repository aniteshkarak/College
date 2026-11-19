import crypto from 'crypto';

/**
 * Generates a unique applicant tracking ID format: COL-YYYY-XXXXXX
 * Example: COL-2026-K9P84X
 */
export const generateApplicationId = () => {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  return `COL-${year}-${randomSuffix}`;
};

/**
 * Calculates review deadline as exact submission timestamp + 72 hours
 */
export const calculateReviewDeadline = (submittedAt = new Date()) => {
  const deadline = new Date(submittedAt.getTime() + 72 * 60 * 60 * 1000);
  return deadline;
};

/**
 * Evaluates 72-hour timeline and overdue metrics
 */
export const getReviewTimelineMetrics = (submittedAt, reviewDeadline, status) => {
  const now = Date.now();
  const deadlineMs = new Date(reviewDeadline).getTime();
  const isTerminal = status === 'APPROVED' || status === 'REJECTED';
  
  const isOverdue = !isTerminal && now > deadlineMs;
  const msRemaining = Math.max(0, deadlineMs - now);
  const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60));
  const hoursOverdue = isOverdue ? Math.round((now - deadlineMs) / (1000 * 60 * 60)) : 0;

  return {
    submittedAt: new Date(submittedAt).toISOString(),
    reviewDeadline: new Date(reviewDeadline).toISOString(),
    targetHours: 72,
    hoursRemaining,
    isOverdue,
    hoursOverdue,
    status
  };
};

export default {
  generateApplicationId,
  calculateReviewDeadline,
  getReviewTimelineMetrics,
};
