import { body, param, query } from 'express-validator';
import { validate } from './validate.js';

const VALID_CATEGORIES = [
  'Silk',
  'Cotton',
  'Banarasi',
  'Kanjivaram',
  'Designer',
  'Chanderi',
  'Organza',
  'Other',
];

export const createProductValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Saree name/title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU or product code is required')
    .matches(/^[A-Za-z0-9_-]{3,30}$/)
    .withMessage('SKU must be 3-30 alphanumeric characters (hyphens and underscores allowed)'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('price')
    .notEmpty()
    .withMessage('Price in INR is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('stock')
    .notEmpty()
    .withMessage('Available stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  validate,
];

export const updateProductValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('sku')
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9_-]{3,30}$/)
    .withMessage('SKU must be 3-30 alphanumeric characters (hyphens and underscores allowed)'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('category')
    .optional()
    .trim()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  validate,
];

export const getProductByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  validate,
];

export default {
  createProductValidator,
  updateProductValidator,
  getProductByIdValidator,
};
