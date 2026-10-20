import { getDbStatus } from '../config/db.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { config } from '../config/env.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getHealth = (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: config.nodeEnv,
    services: {
      database: getDbStatus(),
      cloudinary: isCloudinaryConfigured() ? 'configured' : 'unconfigured',
    },
  };

  return ApiResponse.success(res, healthData, 'API is healthy and running');
};

export default {
  getHealth,
};
