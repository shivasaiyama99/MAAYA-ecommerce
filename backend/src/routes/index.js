import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';

const apiRouter = Router();

// Health Check
apiRouter.use('/health', healthRoutes);

// Authentication Routes
apiRouter.use('/auth', authRoutes);

// Cart Routes
apiRouter.use('/cart', cartRoutes);

// Product Management Routes
apiRouter.use('/products', productRoutes);

// Order Management Routes
apiRouter.use('/orders', orderRoutes);

export default apiRouter;
