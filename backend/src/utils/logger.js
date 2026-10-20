import { config } from '../config/env.js';

// Keys that must NEVER be logged or leaked in plain text
const SENSITIVE_KEYS = [
  'password',
  'token',
  'refreshtoken',
  'authorization',
  'cookie',
  'jwt_secret',
  'api_secret',
  'apikey',
  'mongodb_uri',
  'secret',
  'creditcard',
  'cvv',
];

/**
 * Recursively deep-redacts sensitive keys from objects and strings
 */
export const sanitizeForLogging = (data) => {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact Bearer tokens
    let sanitized = data.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED]');
    // Redact mongodb connection strings with passwords
    sanitized = sanitized.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, 'mongodb$1://[REDACTED_USER]:[REDACTED_PASS]@');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lower.includes(sensitive))) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = sanitizeForLogging(value);
      }
    }
    return cleaned;
  }

  return data;
};

export const logger = {
  info: (message, meta = null) => {
    if (config.nodeEnv === 'test') return;
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[${timestamp}] [INFO] ${message}`, JSON.stringify(sanitizeForLogging(meta)));
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`);
    }
  },
  warn: (message, meta = null) => {
    if (config.nodeEnv === 'test') return;
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[${timestamp}] [WARN] ${message}`, JSON.stringify(sanitizeForLogging(meta)));
    } else {
      console.warn(`[${timestamp}] [WARN] ${message}`);
    }
  },
  error: (message, error = null) => {
    if (config.nodeEnv === 'test') return;
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error
      ? { message: error.message, name: error.name, stack: config.nodeEnv === 'development' ? error.stack : undefined }
      : error;
    console.error(`[${timestamp}] [ERROR] ${message}`, JSON.stringify(sanitizeForLogging(errorDetails)));
  },
};

export default logger;
