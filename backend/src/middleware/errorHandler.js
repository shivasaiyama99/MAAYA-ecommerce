import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  
  // Log securely using sanitized logger
  logger.error(`Request ${req.method} ${req.originalUrl} failed with ${statusCode}: ${err.message}`, err);

  // In production, sanitize 500 messages to prevent internal architecture leaks
  let userMessage = err.message || 'Internal Server Error';
  if (config.nodeEnv === 'production' && statusCode >= 500) {
    userMessage = 'An unexpected server error occurred. Please try again later.';
  }

  const response = {
    success: false,
    message: userMessage,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;

