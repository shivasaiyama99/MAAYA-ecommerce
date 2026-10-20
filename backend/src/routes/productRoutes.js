import { Router } from 'express';
import {
  createProduct,
  getAdminProducts,
  getPublicProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../controllers/productController.js';
import {
  createProductValidator,
  updateProductValidator,
  getProductByIdValidator,
} from '../validators/productValidators.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public Saree Catalog for Customers (Active Sarees with Filtering, Sorting, Pagination)
router.get('/', getPublicProducts);

// Image Upload Endpoint (Admin Only, Memory Buffer to Cloudinary)
router.post(
  '/upload-image',
  authenticateUser,
  requireAdmin,
  uploadSingleImage,
  uploadProductImage
);

// Admin Product Listing with Stats, Search, Filters, and Pagination
router.get('/admin', authenticateUser, requireAdmin, getAdminProducts);

// Create Product (Admin Only)
router.post(
  '/',
  authenticateUser,
  requireAdmin,
  createProductValidator,
  createProduct
);

// Get Single Product by ID (Public / Admin)
router.get('/:id', getProductByIdValidator, getProductById);

// Update Product (Admin Only)
router.patch(
  '/:id',
  authenticateUser,
  requireAdmin,
  updateProductValidator,
  updateProduct
);

// Delete Product (Admin Only)
router.delete(
  '/:id',
  authenticateUser,
  requireAdmin,
  getProductByIdValidator,
  deleteProduct
);

export default router;
