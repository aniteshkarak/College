import { ZodError } from 'zod';
import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'Request payload failed schema validation',
      errors: formattedErrors
    });
  }

  // 2. Multer File Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum permitted limit (5MB for photos, 10MB for documents).'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'UNEXPECTED_FILE',
        message: `Unexpected upload field: ${err.field}. Allowed fields: photo_1, photo_2, photo_3, identity_document.`
      });
    }

    return res.status(400).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: err.message
    });
  }

  // 3. Known Business Logic / HTTP Errors
  if (err.statusCode || err.status) {
    const status = err.statusCode || err.status;
    return res.status(status).json({
      success: false,
      error: err.code || 'BAD_REQUEST',
      message: err.message,
      ...(err.details && { details: err.details })
    });
  }

  // 4. Default Internal Server Error
  console.error('[UNHANDLED_ERROR]', err);
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message
  });
};
