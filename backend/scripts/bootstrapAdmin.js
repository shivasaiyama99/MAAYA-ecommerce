import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/userModel.js';

const run = async () => {
  console.log('--- Admin Account Setup & Bootstrap Script ---');

  const args = process.argv.slice(2);
  const cliPassword = args[0];

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@sareesweb.com').trim().toLowerCase();
  let passwordHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();

  if (cliPassword) {
    console.log(`🔑 Generating bcrypt hash for provided password...`);
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(cliPassword, salt);
    console.log(`\nGenerated ADMIN_PASSWORD_HASH:\n${passwordHash}\n`);
    console.log(`(You can update this hash in your backend/.env file)\n`);
  }

  if (!passwordHash) {
    console.error('❌ Error: No password provided and ADMIN_PASSWORD_HASH is not set in environment.');
    console.log('Usage: node scripts/bootstrapAdmin.js "<your-desired-admin-password>"');
    process.exit(1);
  }

  // Connect to DB
  console.log('🔌 Connecting to MongoDB...');
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to database. Ensure MONGODB_URI is set.');
    process.exit(1);
  }

  try {
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      await User.collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            role: 'admin',
            password: passwordHash,
            updatedAt: new Date(),
          },
        }
      );
      console.log(`✅ Successfully updated existing admin account (${adminEmail}) with role 'admin' and new password hash.`);
    } else {
      await User.collection.insertOne({
        name: 'Administrator',
        email: adminEmail,
        password: passwordHash,
        phone: '',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Successfully created initial admin account (${adminEmail}) with role 'admin'.`);
    }

    console.log('🎉 Admin setup completed successfully.');
  } catch (err) {
    console.error('❌ Database error during admin setup:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
    process.exit(0);
  }
};

run();
