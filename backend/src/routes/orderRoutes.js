import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAdminOrders,
  updateOrderStatus,
  updateOrderPayment,
} from '../controllers/orderController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Customer creates order (Cart checkout or Buy Now)
router.post('/', authenticateUser, createOrder);

// Customer fetches their own order history (supports /my and /my-orders)
router.get('/my', authenticateUser, getMyOrders);
router.get('/my-orders', authenticateUser, getMyOrders);

// Admin order management endpoints
router.get('/admin', authenticateUser, requireAdmin, getAdminOrders);
router.patch('/:id/status', authenticateUser, requireAdmin, updateOrderStatus);
router.patch('/:id/payment', authenticateUser, requireAdmin, updateOrderPayment);

// Customer or Admin cancel order (with inventory restoration)
router.patch('/:id/cancel', authenticateUser, cancelOrder);

// Single order details (strict ownership check in controller)
router.get('/:id', authenticateUser, getOrderById);

export default router;
