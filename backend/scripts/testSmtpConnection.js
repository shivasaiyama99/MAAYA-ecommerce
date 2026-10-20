import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_NOTIFICATION_EMAIL || 'komakulakiranmai@gmail.com';

console.log('\n======================================================');
console.log('🔍 Testing Gmail SMTP Connection & Live Email Delivery');
console.log('======================================================');
console.log(`EMAIL_USER: ${emailUser ? `"${emailUser}"` : '[NOT SET]'}`);
console.log(`EMAIL_PASS: ${emailPass ? `[${emailPass.length} characters provided]` : '[EMPTY / NOT SET]'}`);
console.log(`Target:     ${adminEmail}`);

if (!emailUser || !emailPass) {
  console.error('\n❌ ERROR: EMAIL_PASS is empty in backend/.env!');
  console.error('To send real emails via Gmail, Google requires a 16-character App Password:');
  console.error('  1. Go to https://myaccount.google.com/security');
  console.error('  2. Enable 2-Step Verification if not already enabled');
  console.error('  3. Search for "App Passwords" or go to https://myaccount.google.com/apppasswords');
  console.error('  4. Create an App name (e.g. "MAAYA Web")');
  console.error('  5. Copy the generated 16-letter password into backend/.env:');
  console.error('     EMAIL_PASS=xxxx xxxx xxxx xxxx\n');
  process.exit(1);
}

const cleanPass = emailPass.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: cleanPass,
  },
});

console.log('\n⏳ Connecting to Gmail SMTP servers (smtp.gmail.com:465)...');

try {
  await transporter.verify();
  console.log('✅ SMTP Handshake Successful: Gmail accepted credentials!');

  console.log(`⏳ Sending test verification email to ${adminEmail}...`);
  const info = await transporter.sendMail({
    from: `"MAAYA Test Verification" <${emailUser}>`,
    to: adminEmail,
    subject: `Test Verification – MAAYA SMTP Working!`,
    text: `Hello,\n\nThis is a test email verifying that Gmail SMTP sending is active for MAAYA E-commerce.\nSender: ${emailUser}\nTimestamp: ${new Date().toISOString()}`,
    html: `<div style="font-family: Arial; padding: 20px; background: #fafaf9; border-radius: 12px; border: 1px solid #e7e5e4;">
      <h2 style="color: #701a23;">MAAYA SMTP Connection Verified! ✅</h2>
      <p>Your Gmail App Password is configured correctly and live emails can now be dispatched to customers.</p>
      <p style="color: #78716c; font-size: 12px;">Sent from: <strong>${emailUser}</strong></p>
    </div>`,
  });

  console.log(`🎉 Live Email Delivered Successfully! Message ID: ${info.messageId}`);
  console.log(`Please check inbox for ${adminEmail} (and Spam/Promotions folder).\n`);
} catch (error) {
  console.error('\n❌ SMTP Verification Failed:');
  console.error(error.message);
  if (error.code === 'EAUTH') {
    console.error('\n👉 Google rejected the password. Please make sure you are using a 16-character App Password (not your personal Google account password).');
  }
  process.exit(1);
}
