import mongoose from 'mongoose';
import { TokenService } from '../services/tokenService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import User from '../models/userModel.js';
import devUserStore from '../utils/devUserStore.js';

/**
 * Middleware: authenticateUser
 * Validates JWT from Authorization header or signed/secure cookie,
 * verifies signature and expiration, and loads the user from database.
 */
export const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check cookies as fallback
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.error(
        res,
        'Authentication required. No authorization token provided.',
        401
      );
    }

    const decoded = TokenService.verifyToken(token);
    if (!decoded || !decoded.id) {
      return ApiResponse.error(
        res,
        'Invalid, expired, or malformed authentication token.',
        401
      );
    }

    // Dev admin token bypass
    if (decoded.id === 'dev_admin_root') {
      req.user = {
        _id: 'dev_admin_root',
        name: 'Store Administrator',
        email: decoded.email || 'admin@sareesweb.com',
        role: 'admin',
        toJSON: function () {
          return {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
          };
        },
      };
      req.userId = req.user._id;
      req.userRole = req.user.role;
      return next();
    }

    // Dev fallback if DB connection is disconnected
    if (mongoose.connection.readyState !== 1 && User._isMocked !== true) {
      const devUser = devUserStore.findUserById(decoded.id);
      if (devUser) {
        req.user = devUser;
        req.userId = devUser._id;
        req.userRole = devUser.role;
        return next();
      }
    }

    // Load user from database to ensure account is active and role is valid
    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.error(
        res,
        'User associated with this token no longer exists.',
        401
      );
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return ApiResponse.error(
      res,
      'Authentication failed due to an internal server error.',
      500
    );
  }
};

/**
 * Middleware: requireCustomer
 * Enforces that authenticated user has the 'customer' role
 */
export const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required.', 401);
  }

  if (req.user.role !== 'customer') {
    return ApiResponse.error(
      res,
      'Access denied: Customer privileges required.',
      403
    );
  }

  next();
};

/**
 * Middleware: requireAdmin
 * Enforces that authenticated user has the 'admin' role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required.', 401);
  }

  if (req.user.role !== 'admin') {
    return ApiResponse.error(
      res,
      'Access denied: Administrative privileges required.',
      403
    );
  }

  next();
};

// Aliases for compatibility
export const authenticate = authenticateUser;

export default {
  authenticateUser,
  authenticate,
  requireCustomer,
  requireAdmin,
};
