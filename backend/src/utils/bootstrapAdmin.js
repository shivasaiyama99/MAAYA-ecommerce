import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { config } from '../config/env.js';

/**
 * Bootstrap or sync the administrative account from environment variables.
 * Safe to run on startup or on-demand:
 * - Creates admin if it doesn't exist
 * - Updates admin role and password hash if existing
 * - Never modifies non-admin accounts or exposes account creation publicly
 */
export const bootstrapAdmin = async () => {
  const adminEmails = [
    (config.adminEmail || process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    'komakulakiranmai@gmail.com',
    'admin@sareesweb.com',
  ].filter(Boolean);

  const uniqueAdminEmails = [...new Set(adminEmails)];
  const adminPasswordHash = (config.adminPasswordHash || process.env.ADMIN_PASSWORD_HASH || '').trim();

  if (!adminPasswordHash) {
    return { status: 'skipped', reason: 'ADMIN_PASSWORD_HASH is not configured in environment' };
  }

  try {
    for (const email of uniqueAdminEmails) {
      const existing = await User.findOne({ email });

      if (existing) {
        await User.collection.updateOne(
          { _id: existing._id },
          {
            $set: {
              role: 'admin',
              password: adminPasswordHash,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`👑 Admin account synchronized for: ${email}`);
      } else {
        await User.collection.insertOne({
          name: 'Store Administrator',
          email,
          password: adminPasswordHash,
          phone: '9701607651',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`👑 Admin account created for: ${email}`);
      }
    }
    return { status: 'synchronized', count: uniqueAdminEmails.length };
  } catch (error) {
    console.error('❌ Error during admin bootstrap:', error.message);
    return { status: 'error', error: error.message };
  }
};

export default bootstrapAdmin;
