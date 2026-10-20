import rateLimit from 'express-rate-limit';

// Standard rate limiter for customer login (10 attempts per 15 minutes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

// Stricter rate limiter for admin login (5 attempts per 15 minutes)
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many administrative login attempts. Please try again after 15 minutes.',
  },
});

// Rate limiter for new account registrations (5 accounts per hour per IP)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many account registrations from this IP. Please try again later.',
  },
});

// Global API rate limiter (protects server from denial of service)
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please slow down and try again later.',
  },
  skip: (req) => req.method === 'OPTIONS' || process.env.NODE_ENV === 'test',
});

export default {
  loginLimiter,
  adminLoginLimiter,
  registerLimiter,
  globalApiLimiter,
};

