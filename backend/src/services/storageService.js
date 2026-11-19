import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const PRIVATE_STORAGE_ROOT = path.resolve('storage', 'private');
const DOCS_DIR = path.join(PRIVATE_STORAGE_ROOT, 'documents');
const PHOTOS_DIR = path.join(PRIVATE_STORAGE_ROOT, 'photos');

// Ensure isolation directories exist
[DOCS_DIR, PHOTOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const ALLOWED_DOC_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates and stores identity document in private storage
 */
export const storePrivateDocument = async (fileData, originalName, mimeType) => {
  if (!ALLOWED_DOC_MIMES.includes(mimeType)) {
    throw new Error('Unsupported document format. Allowed: JPEG, PNG, WebP, PDF.');
  }

  const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('Document exceeds maximum permitted file size of 5MB.');
  }

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const ext = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
  const safeFileName = `doc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
  const filePath = path.join(DOCS_DIR, safeFileName);

  fs.writeFileSync(filePath, buffer);
  logger.info(`Stored private verification document: ${safeFileName} (${buffer.length} bytes)`);

  return {
    filePath: safeFileName, // relative identifier
    fileName: originalName,
    fileSize: buffer.length,
    mimeType,
    fileHashSha256: hash
  };
};

/**
 * Validates and stores user photograph in private storage (before approval)
 */
export const storePrivatePhoto = async (fileData, originalName, mimeType, photoOrder) => {
  if (!ALLOWED_PHOTO_MIMES.includes(mimeType)) {
    throw new Error('Unsupported photo format. Allowed: JPEG, PNG, WebP.');
  }

  const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('Photo exceeds maximum permitted file size of 5MB.');
  }

  const ext = path.extname(originalName) || '.jpg';
  const safeFileName = `photo_p${photoOrder}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
  const filePath = path.join(PHOTOS_DIR, safeFileName);

  fs.writeFileSync(filePath, buffer);
  logger.info(`Stored private applicant photograph: ${safeFileName}`);

  return {
    filePath: safeFileName,
    fileSize: buffer.length,
    mimeType,
    photoOrder
  };
};

/**
 * Reads a private document safely for authorized admin streaming
 */
export const getPrivateDocumentStream = (safeFileName) => {
  const normalized = path.basename(safeFileName);
  const fullPath = path.join(DOCS_DIR, normalized);
  if (!fs.existsSync(fullPath)) {
    throw new Error('Requested document not found in private storage');
  }
  return fs.createReadStream(fullPath);
};

export default {
  storePrivateDocument,
  storePrivatePhoto,
  getPrivateDocumentStream,
};
