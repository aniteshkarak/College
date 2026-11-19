import fs from 'fs';
import path from 'path';
import { STORAGE_PATHS } from '../config/storage.js';
import imageService from './imageService.js';
import logger from '../utils/logger.js';

export const storageService = {
  /**
   * Save identity document (using imageService for optimization & validation)
   */
  storePrivateDocument: async (fileData, originalName = 'document.jpg', mimeType = 'image/jpeg') => {
    return imageService.processAndSaveDocument(fileData, originalName, mimeType);
  },

  /**
   * Save user photo (using imageService for Sharp processing, WebP conversion, thumbnails)
   */
  storePrivatePhoto: async (fileData, photoOrder = 1) => {
    return imageService.processAndSavePhoto(fileData, photoOrder);
  },

  /**
   * Save private voice message audio file
   */
  storePrivateVoiceAudio: async (fileBuffer, originalName = 'voice.webm', mimeType = 'audio/webm') => {
    const ext = path.extname(originalName) || (mimeType.includes('ogg') ? '.ogg' : mimeType.includes('mp4') ? '.mp4' : '.webm');
    const filename = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    const fullPath = path.join(STORAGE_PATHS.VOICE_DIR, filename);

    if (!fs.existsSync(STORAGE_PATHS.VOICE_DIR)) {
      fs.mkdirSync(STORAGE_PATHS.VOICE_DIR, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, fileBuffer);
    return {
      filename,
      filePath: fullPath,
      fileSize: fileBuffer.length,
      mimeType,
    };
  },

  /**
   * Securely retrieve stream for private documents or photos
   * Strictly prevents directory traversal attacks via path.basename
   */
  getPrivateFileStream: (subfolder, rawFilename) => {
    const filename = path.basename(rawFilename); // strips any ../ or directory components
    let baseDir = STORAGE_PATHS.DOCUMENTS_DIR;

    if (subfolder === 'photos') {
      baseDir = STORAGE_PATHS.PHOTOS_DIR;
    } else if (subfolder === 'thumbnails') {
      baseDir = STORAGE_PATHS.THUMBNAILS_DIR;
    } else if (subfolder === 'discovery') {
      baseDir = STORAGE_PATHS.DISCOVERY_DIR;
    } else if (subfolder === 'voice') {
      baseDir = STORAGE_PATHS.VOICE_DIR;
    }

    const fullPath = path.join(baseDir, filename);

    // Verify resolved path stays strictly within allowed directory
    if (!fullPath.startsWith(baseDir)) {
      throw new Error('Access denied: Invalid file path traversal attempt.');
    }

    if (!fs.existsSync(fullPath)) {
      const err = new Error('Requested file not found in storage.');
      err.statusCode = 404;
      throw err;
    }

    // Determine MIME type
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'image/webp';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webm') mimeType = 'audio/webm';
    else if (ext === '.ogg') mimeType = 'audio/ogg';
    else if (ext === '.mp3') mimeType = 'audio/mpeg';
    else if (ext === '.wav') mimeType = 'audio/wav';
    else if (ext === '.m4a' || ext === '.mp4') mimeType = 'audio/mp4';

    return {
      stream: fs.createReadStream(fullPath),
      mimeType,
      fileSize: fs.statSync(fullPath).size,
      filename,
    };
  },

  /**
   * Secure deletion of uploaded files
   */
  deletePrivateFile: async (subfolder, rawFilename) => {
    try {
      const filename = path.basename(rawFilename);
      let baseDir = STORAGE_PATHS.DOCUMENTS_DIR;
      if (subfolder === 'photos') baseDir = STORAGE_PATHS.PHOTOS_DIR;
      else if (subfolder === 'thumbnails') baseDir = STORAGE_PATHS.THUMBNAILS_DIR;

      const fullPath = path.join(baseDir, filename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info(`Deleted file: ${fullPath}`);
      }
    } catch (err) {
      logger.warn(`File deletion error: ${err.message}`);
    }
  },
};

export default storageService;
