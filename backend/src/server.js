import app from './app.js';
import { config, validateProductionEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { bootstrapAdmin } from './utils/bootstrapAdmin.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // Validate production configuration
  if (config.nodeEnv === 'production') {
    const missing = validateProductionEnv();
    if (missing.length > 0) {
      logger.warn(`⚠️ Warning: Production environment is missing recommended variables: ${missing.join(', ')}`);
    } else {
      logger.info('🔒 Production environment validated successfully.');
    }
  }

  // Connect to MongoDB Atlas (graceful if URI not yet configured)
  const isDbConnected = await connectDB();
  if (isDbConnected) {
    await bootstrapAdmin();
  }

  const server = app.listen(config.port, () => {
    logger.info(`🚀 Saree E-commerce Backend Server Running on port ${config.port} (${config.nodeEnv})`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('💤 HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err);
  });
};

startServer();
