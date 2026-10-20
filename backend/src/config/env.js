import dotenv from 'dotenv';

dotenv.config();

const parseCloudinaryConfig = () => {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  let apiKey = process.env.CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const rawUrl = process.env.CLOUDINARY_URL || (cloudName.includes('cloudinary://') ? cloudName : '');
  if (rawUrl) {
    const cleaned = rawUrl.replace(/^CLOUDINARY_URL=/, '').trim();
    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol === 'cloudinary:') {
        apiKey = parsed.username || apiKey;
        apiSecret = parsed.password || apiSecret;
        cloudName = parsed.hostname || cloudName;
      }
    } catch {
      // Ignore URL parse error and fallback to variables
    }
  }

  return { cloudName, apiKey, apiSecret };
};

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'fallback_development_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  cloudinary: parseCloudinaryConfig(),
  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    notificationRecipient: process.env.STORE_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'komakulakiranmai@gmail.com',
  },
  payment: {
    upiId: process.env.STORE_UPI_ID || '',
    upiName: process.env.STORE_UPI_NAME || 'MAAYA Collections',
    upiQrUrl: process.env.STORE_UPI_QR_URL || '',
  },
  store: {
    name: 'MAAYA Collections',
    tagline: 'Sarees & Royal Jewellery',
    supportEmail: 'komakulakiranmai@gmail.com',
    supportAddress: 'H.no:4-6-158/31A, Durga Nagar, Nacharam, Rangareddy. Pincode 500076',
    supportPhone: '+91 97016 07651',
  },
};

export const validateProductionEnv = () => {
  const missing = [];
  if (!config.mongodbUri) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_development_secret') {
    missing.push('JWT_SECRET');
  }
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    missing.push('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET');
  }
  return missing;
};

export default config;

