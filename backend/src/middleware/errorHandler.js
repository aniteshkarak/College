import multer from 'multer';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';
import { error } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // 1. Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return error(res, 'Validation failed: Please ensure all required fields are correctly supplied.', 400, formattedErrors);
  }

  // 2. Multer File Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'File size exceeds maximum permitted limit of 5MB.', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return error(res, `Unexpected upload field '${err.field}'. Allowed fields: photo_1, photo_2, photo_3, identity_document.`, 400);
    }
    return error(res, `Upload error: ${err.message}`, 400);
  }

  logger.error(`Error on ${req.method} ${req.url}:`, err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return error(res, message, statusCode, err);
};

export default errorHandler;
