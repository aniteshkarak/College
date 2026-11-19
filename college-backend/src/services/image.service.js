import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { STORAGE_PATHS } from '../config/storage.js';

export const imageService = {
  /**
   * Validate and sanitize image using Sharp:
   * 1. Confirms actual image binary data
   * 2. Rejects corrupted or non-image payloads
   * 3. Verifies format (jpeg, png, webp)
   * 4. Strips EXIF metadata (removes GPS and personal device tags)
   * 5. Saves securely in private storage
   */
  processAndSavePrivatePhoto: async (fileBuffer, originalName = 'photo.jpg') => {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('Valid file buffer is required for image processing');
    }

    let metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch (err) {
      throw new Error('Invalid or corrupted image file. Please upload a genuine photo.');
    }

    const permittedFormats = ['jpeg', 'png', 'webp'];
    if (!metadata.format || !permittedFormats.includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported image format (${metadata.format}). Allowed: JPEG, PNG, WebP.`);
    }

    if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100) {
      throw new Error('Image resolution too low. Minimum resolution is 100x100 pixels.');
    }

    // Generate non-enumerable, collision-safe filename
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
    const filename = `photo_${uniqueSuffix}.${extension}`;
    const targetPath = path.join(STORAGE_PATHS.PRIVATE_PHOTOS_DIR, filename);

    // Strip EXIF metadata, auto-rotate if oriented, convert cleanly
    await sharp(fileBuffer)
      .rotate()
      .toFormat(metadata.format, { quality: 85 })
      .toFile(targetPath);

    const stats = await fs.promises.stat(targetPath);

    return {
      filename,
      filePath: targetPath,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: stats.size
    };
  },

  /**
   * Process and save private identity verification document (Image or PDF)
   */
  processAndSavePrivateDocument: async (fileBuffer, originalName = 'document.jpg', mimeType = 'image/jpeg') => {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('Valid file buffer is required for document processing');
    }

    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    // If PDF document
    if (mimeType === 'application/pdf') {
      const filename = `doc_${uniqueSuffix}.pdf`;
      const targetPath = path.join(STORAGE_PATHS.PRIVATE_DOCUMENTS_DIR, filename);
      await fs.promises.writeFile(targetPath, fileBuffer);
      const stats = await fs.promises.stat(targetPath);
      return {
        filename,
        filePath: targetPath,
        format: 'pdf',
        mimeType: 'application/pdf',
        sizeBytes: stats.size
      };
    }

    // If image document (ID card photo)
    let metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch (err) {
      throw new Error('Invalid or unreadable document image. Please upload a clear scan.');
    }

    const permittedFormats = ['jpeg', 'png', 'webp'];
    if (!metadata.format || !permittedFormats.includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported document format. Allowed: JPEG, PNG, WebP, PDF.`);
    }

    const extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
    const filename = `doc_${uniqueSuffix}.${extension}`;
    const targetPath = path.join(STORAGE_PATHS.PRIVATE_DOCUMENTS_DIR, filename);

    await sharp(fileBuffer)
      .rotate()
      .toFormat(metadata.format, { quality: 90 })
      .toFile(targetPath);

    const stats = await fs.promises.stat(targetPath);

    return {
      filename,
      filePath: targetPath,
      format: metadata.format,
      mimeType: `image/${extension}`,
      sizeBytes: stats.size
    };
  }
};
