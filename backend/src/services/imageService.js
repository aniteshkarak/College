import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { STORAGE_PATHS } from '../config/storage.js';
import logger from '../utils/logger.js';

/**
 * Converts data URL or base64 string to a Buffer if needed.
 * Also handles HTTP/HTTPS URLs by downloading them or generating a mock image buffer for demo presets.
 */
export const toBuffer = async (input) => {
  if (!input) return null;
  if (Buffer.isBuffer(input)) return input;
  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      const parts = input.split(',');
      return Buffer.from(parts[1], 'base64');
    }
    // Remote HTTP / HTTPS URL (e.g. Unsplash demo presets)
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const response = await fetch(input);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (err) {
        logger.warn(`Remote image fetch failed for ${input}: ${err.message}. Generating fallback graphic buffer.`);
      }
      // If network fails to fetch remote URL, create a valid 600x600 SVG PNG buffer via Sharp
      try {
        return await sharp({
          create: {
            width: 600,
            height: 600,
            channels: 4,
            background: { r: 225, g: 29, b: 72, alpha: 1 }
          }
        }).png().toBuffer();
      } catch (e) {
        return null;
      }
    }
    // Standard base64
    try {
      return Buffer.from(input, 'base64');
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const imageService = {
  /**
   * Process and optimize profile photograph with Sharp:
   * 1. Confirms genuine image binary & rejects corrupted files
   * 2. Strips EXIF metadata & GPS location tags
   * 3. Converts to high-efficiency WebP format
   * 4. Generates:
   *    - Full high-quality profile photo (max width 1200, WebP)
   *    - Discovery card portrait (600x800, WebP)
   *    - Circular profile thumbnail (150x150, WebP)
   */
  processAndSavePhoto: async (inputData, photoOrder = 1) => {
    const buffer = await toBuffer(inputData);
    if (!buffer || buffer.length === 0) {
      throw new Error('Valid photograph image buffer is required.');
    }

    // Inspect image metadata with Sharp to verify real binary image
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (err) {
      throw new Error('Uploaded file is corrupted or not a valid image. Please upload a genuine photo.');
    }

    const permitted = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !permitted.includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported image format: ${metadata.format}. Permitted formats are JPEG, PNG, and WebP.`);
    }

    if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100) {
      throw new Error('Image dimensions too small. Minimum resolution required is 100x100 pixels.');
    }

    const uniqueId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const baseName = `photo_order${photoOrder}_${uniqueId}`;

    const mainFileName = `${baseName}.webp`;
    const discoveryFileName = `${baseName}_disc.webp`;
    const thumbFileName = `${baseName}_thumb.webp`;

    const mainPath = path.join(STORAGE_PATHS.PHOTOS_DIR, mainFileName);
    const discoveryPath = path.join(STORAGE_PATHS.DISCOVERY_DIR, discoveryFileName);
    const thumbPath = path.join(STORAGE_PATHS.THUMBNAILS_DIR, thumbFileName);

    // 1. Full Optimized Profile Photo: Strips EXIF/GPS, auto-rotates, max width 1200, WebP quality 82
    await sharp(buffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(mainPath);

    // 2. Discovery Portrait: 600x800 cover fit for campus discovery feed
    await sharp(buffer)
      .rotate()
      .resize(600, 800, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80, effort: 4 })
      .toFile(discoveryPath);

    // 3. Compact Thumbnail: 150x150 for messages and match headers
    await sharp(buffer)
      .rotate()
      .resize(150, 150, { fit: 'cover', position: 'entropy' })
      .webp({ quality: 75, effort: 3 })
      .toFile(thumbPath);

    const stats = await fs.promises.stat(mainPath);
    logger.info(`Sharp processed photo ${photoOrder}: ${mainFileName} (${stats.size} bytes, WebP)`);

    return {
      fileName: mainFileName,
      discoveryFileName,
      thumbnailFileName: thumbFileName,
      filePath: mainFileName, // relative safe identifier
      format: 'webp',
      fileSize: stats.size,
      width: metadata.width,
      height: metadata.height,
      photoOrder,
    };
  },

  /**
   * Process and securely store private identity verification document (College ID or Govt ID)
   * Stored in private directory; never directly served through static public routes.
   */
  processAndSaveDocument: async (inputData, originalName = 'college_id.jpg', mimeType = 'image/jpeg') => {
    const buffer = await toBuffer(inputData);
    if (!buffer || buffer.length === 0) {
      throw new Error('Valid identity document buffer is required.');
    }

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Document exceeds maximum permitted file size of 5MB.');
    }

    const uniqueId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Handle PDF documents
    if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
      // Validate PDF magic bytes (%PDF-)
      if (buffer.toString('utf8', 0, 5) !== '%PDF-') {
        throw new Error('Invalid or corrupted PDF document file.');
      }

      const fileName = `doc_${uniqueId}.pdf`;
      const filePath = path.join(STORAGE_PATHS.DOCUMENTS_DIR, fileName);
      await fs.promises.writeFile(filePath, buffer);

      return {
        fileName,
        filePath: fileName,
        fileSize: buffer.length,
        mimeType: 'application/pdf',
        fileHashSha256: hash,
      };
    }

    // Handle Image documents (College ID Card photo, Voter ID, etc.)
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (err) {
      throw new Error('Corrupted or unreadable identity document image. Please upload a clear scan.');
    }

    const permitted = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !permitted.includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported document image format: ${metadata.format}. Allowed: JPEG, PNG, WebP, PDF.`);
    }

    const fileName = `doc_${uniqueId}.webp`;
    const filePath = path.join(STORAGE_PATHS.DOCUMENTS_DIR, fileName);

    // Strip EXIF metadata, auto-rotate, convert to WebP
    await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toFile(filePath);

    const stats = await fs.promises.stat(filePath);
    logger.info(`Sharp processed private document: ${fileName} (${stats.size} bytes)`);

    return {
      fileName,
      filePath: fileName,
      fileSize: stats.size,
      mimeType: 'image/webp',
      fileHashSha256: hash,
    };
  },

  /**
   * Process and save optional announcement image attachment:
   * Strips EXIF/GPS, resizes to max width 1200, WebP conversion.
   */
  processAndSaveAnnouncementImage: async (inputData) => {
    const buffer = toBuffer(inputData);
    if (!buffer || buffer.length === 0) {
      throw new Error('Valid announcement image buffer is required.');
    }

    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (err) {
      throw new Error('Uploaded file is corrupted or not a valid image.');
    }

    const permitted = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !permitted.includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported image format: ${metadata.format}. Permitted formats are JPEG, PNG, and WebP.`);
    }

    const uniqueId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const fileName = `announcement_${uniqueId}.webp`;
    const filePath = path.join(STORAGE_PATHS.PHOTOS_DIR, fileName);

    await sharp(buffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(filePath);

    const stats = await fs.promises.stat(filePath);
    logger.info(`Sharp processed announcement image: ${fileName} (${stats.size} bytes)`);

    return {
      fileName,
      filePath,
      fileSize: stats.size,
      mimeType: 'image/webp',
    };
  },

  /**
   * Safely deletes physical photo files (main, discovery, thumbnail) from disk.
   * Skips remote URLs (Unsplash/HTTP) and safely handles missing files.
   */
  deletePhotoFiles: async (fileName) => {
    if (!fileName || typeof fileName !== 'string') return;
    if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('data:')) return;
    const clean = path.basename(fileName);
    const baseName = clean.replace(/\.webp$/i, '');
    const discName = `${baseName}_disc.webp`;
    const thumbName = `${baseName}_thumb.webp`;

    const pathsToDelete = [
      path.join(STORAGE_PATHS.PHOTOS_DIR, clean),
      path.join(STORAGE_PATHS.DISCOVERY_DIR, discName),
      path.join(STORAGE_PATHS.THUMBNAILS_DIR, thumbName),
    ];

    for (const p of pathsToDelete) {
      try {
        await fs.promises.unlink(p);
      } catch (e) {
        // file might already be absent, ignore safely
      }
    }
  },
};

export default imageService;
