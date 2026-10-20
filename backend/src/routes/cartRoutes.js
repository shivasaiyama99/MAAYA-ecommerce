import { Router } from 'express';
import {
  getCart,
  addOrMergeCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All cart endpoints require an authenticated customer
router.use(authenticateUser);

// GET /api/cart - Fetch authenticated customer's cart
router.get('/', getCart);

// POST /api/cart/items - Add item or merge guest cart
router.post('/items', addOrMergeCartItems);

// PATCH /api/cart/items/:productId - Update item quantity
router.patch('/items/:productId', updateCartItemQuantity);

// DELETE /api/cart/items/:productId - Remove specific item
router.delete('/items/:productId', removeCartItem);

// DELETE /api/cart - Clear shopping bag
router.delete('/', clearCart);

export default router;
