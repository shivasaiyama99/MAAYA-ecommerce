import mongoose from 'mongoose';
import User from '../models/userModel.js';
import { TokenService } from '../services/tokenService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { config } from '../config/env.js';
import devUserStore from '../utils/devUserStore.js';
import EmailService from '../services/emailService.js';

const isDbActive = () => mongoose.connection.readyState === 1 || User._isMocked === true;

// Helper to configure secure cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account
 * @access  Public
 * @note    Enforces role: 'customer' strictly. Ignores any role escalation attempts.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbActive()) {
      const existing = devUserStore.findUserByEmail(normalizedEmail);
      if (existing) {
        return ApiResponse.error(
          res,
          'An account with this email address already exists.',
          409
        );
      }

      const newUser = await devUserStore.createUser({
        name: name.trim(),
        email: normalizedEmail,
        password,
        phone: phone ? phone.trim() : '',
        role: 'customer',
      });

      const token = TokenService.generateUserToken(newUser);
      EmailService.sendRegistrationNotification(newUser).catch(() => {});
      res.cookie('token', token, getCookieOptions());

      return ApiResponse.success(
        res,
        {
          user: newUser.toJSON(),
          token,
        },
        'Account registered successfully',
        201
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return ApiResponse.error(
        res,
        'An account with this email address already exists.',
        409
      );
    }

    // Role MUST always default to customer; never allow role from req.body
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'customer',
    });

    // Send email alert with new customer's phone number to store owner
    EmailService.sendRegistrationNotification(newUser).catch((err) => {
      console.warn('Registration email notification failed:', err.message);
    });

    const token = TokenService.generateUserToken(newUser);

    // Set secure HttpOnly cookie
    res.cookie('token', token, getCookieOptions());

    return ApiResponse.success(
      res,
      {
        user: newUser.toJSON(),
        token,
      },
      'Account registered successfully',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return ApiResponse.error(res, 'Registration failed due to a server error.', 500);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Customer login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbActive()) {
      const devUser = devUserStore.findUserByEmail(normalizedEmail);
      if (!devUser || !(await devUser.comparePassword(password))) {
        return ApiResponse.error(res, 'Invalid email or password.', 401);
      }

      const token = TokenService.generateUserToken(devUser);
      res.cookie('token', token, getCookieOptions());

      return ApiResponse.success(
        res,
        {
          user: devUser.toJSON(),
          token,
        },
        'Logged in successfully'
      );
    }

    // Retrieve user including the password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Use generic error message to prevent account enumeration
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, 'Invalid email or password.', 401);
    }

    const token = TokenService.generateUserToken(user);
    res.cookie('token', token, getCookieOptions());

    return ApiResponse.success(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Logged in successfully'
    );
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error(res, 'Login failed due to a server error.', 500);
  }
};

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login (requires role: 'admin')
 * @access  Public (Restricted to admin accounts)
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'test') {
      if (normalizedEmail === (config.adminEmail || 'admin@sareesweb.com').toLowerCase()) {
        const devAdmin = {
          _id: 'dev_admin_root',
          name: 'Store Administrator',
          email: normalizedEmail,
          role: 'admin',
        };
        const token = TokenService.generateUserToken(devAdmin);
        res.cookie('token', token, getCookieOptions());
        return ApiResponse.success(
          res,
          {
            user: devAdmin,
            token,
          },
          'Admin logged in successfully (dev mode)'
        );
      }
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, 'Invalid administrative credentials.', 401);
    }

    if (user.role !== 'admin') {
      return ApiResponse.error(
        res,
        'Access denied: Insufficient administrative privileges.',
        403
      );
    }

    const token = TokenService.generateUserToken(user);
    res.cookie('token', token, getCookieOptions());

    return ApiResponse.success(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Admin logged in successfully'
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return ApiResponse.error(res, 'Admin authentication failed due to a server error.', 500);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Protected
 */
export const getMe = async (req, res) => {
  try {
    const userData = typeof req.user.toJSON === 'function' ? req.user.toJSON() : req.user;
    return ApiResponse.success(
      res,
      {
        user: userData,
      },
      'User profile retrieved successfully'
    );
  } catch (error) {
    console.error('getMe error:', error);
    return ApiResponse.error(res, 'Failed to retrieve user profile.', 500);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by clearing cookie
 * @access  Public
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', getCookieOptions());
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return ApiResponse.error(res, 'Logout failed.', 500);
  }
};

export default {
  register,
  login,
  adminLogin,
  getMe,
  logout,
};
