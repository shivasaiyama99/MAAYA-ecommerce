import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export class TokenService {
  static generateToken(payload, expiresIn = config.jwtExpiresIn) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn });
  }

  static generateUserToken(user, expiresIn = config.jwtExpiresIn) {
    return this.generateToken(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      expiresIn
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

export default TokenService;
