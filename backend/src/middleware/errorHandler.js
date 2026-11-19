import logger from '../utils/logger.js';
import { error } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.url}:`, err.stack || err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return error(res, message, statusCode, err);
};

export default errorHandler;
