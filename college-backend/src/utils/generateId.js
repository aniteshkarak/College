import crypto from 'crypto';

/**
 * Generate unique Collégé Application ID (e.g. COL-2026-X82J91)
 */
export const generateApplicationId = (year = new Date().getFullYear()) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars 0, O, 1, I
  let suffix = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return `COL-${year}-${suffix}`;
};

/**
 * Generate unique entity IDs
 */
export const generateId = (prefix = 'id') => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

export const generateUserId = () => generateId('usr');
export const generateDocId = () => generateId('doc');
export const generatePhotoId = () => generateId('pht');
export const generateLogId = () => generateId('log');
export const generateNotificationId = () => generateId('notif');
