import { Router } from 'express';
import {
  register,
  login,
  adminLogin,
  getMe,
  logout,
} from '../controllers/authController.js';
import {
  registerValidator,
  loginValidator,
  adminLoginValidator,
} from '../validators/authValidators.js';
import {
  loginLimiter,
  adminLoginLimiter,
  registerLimiter,
} from '../middleware/rateLimiter.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { ApiResponse } from '../utils/apiResponse.js';

const router = Router();

// Customer Registration
router.post('/register', registerLimiter, registerValidator, register);

// Customer Login
router.post('/login', loginLimiter, loginValidator, login);

// Admin Login
router.post('/admin/login', adminLoginLimiter, adminLoginValidator, adminLogin);

// Current User Profile (Protected)
router.get('/me', authenticateUser, getMe);

// Admin-Only Verification Endpoint (Protected by requireAdmin)
router.get('/admin-check', authenticateUser, requireAdmin, (req, res) => {
  return ApiResponse.success(res, { authorized: true, role: req.user.role }, 'Admin authorization verified');
});

// Logout
router.post('/logout', logout);

export default router;
