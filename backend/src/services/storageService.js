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
