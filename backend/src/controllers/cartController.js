import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { getDevProductById } from './productController.js';

// In-memory dev cart fallback if MongoDB is disconnected in dev
const devCarts = new Map();

const isDbActive = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Format and populate cart items with current database prices and live stock
 */
const formatCartResponse = (cartDoc) => {
  let subtotal = 0;
  let totalItems = 0;

  const formattedItems = (cartDoc.items || [])
    .filter((item) => item.product && item.product._id)
    .map((item) => {
      const prod = item.product;
      const currentPrice = Number(prod.price) || 0;
      const currentStock = Number(prod.stock) || 0;
      const itemQty = Number(item.quantity) || 1;

      subtotal += currentPrice * itemQty;
      totalItems += itemQty;

      return {
        _id: item._id,
        product: {
          _id: prod._id,
          title: prod.title,
          sku: prod.sku,
          price: currentPrice,
          stock: currentStock,
          isActive: prod.isActive,
          category: prod.category,
          fabric: prod.fabric,
          images: prod.images || [],
        },
        quantity: itemQty,
        itemTotal: currentPrice * itemQty,
        isOutOfStock: currentStock <= 0,
        stockWarning: itemQty > currentStock,
      };
    });

  return {
    _id: cartDoc._id,
    user: cartDoc.user,
    items: formattedItems,
    totalItems,
    subtotal,
    shippingFee: 0, // Free Handloom Shipping
    finalTotal: subtotal,
  };
};

/**
 * @route   GET /api/cart
 * @desc    Get authenticated customer's cart
 * @access  Authenticated Customer
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.userId.toString();

    if (isDbActive()) {
      let cart = await Cart.findOne({ user: req.userId }).populate('items.product');

      if (!cart) {
        cart = await Cart.create({ user: req.userId, items: [] });
      }

      return ApiResponse.success(res, formatCartResponse(cart), 'Cart retrieved successfully');
    }

    // Dev Fallback
    let devCart = devCarts.get(userId);
    if (!devCart) {
      devCart = { _id: new mongoose.Types.ObjectId().toString(), user: userId, items: [] };
      devCarts.set(userId, devCart);
    }

    return ApiResponse.success(res, formatCartResponse(devCart), 'Cart retrieved successfully (dev mode)');
  } catch (error) {
    console.error('getCart error:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve shopping bag', 500);
  }
};

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart OR merge guest items upon login
 * @access  Authenticated Customer
 */
export const addOrMergeCartItems = async (req, res) => {
  try {
    const { productId, quantity = 1, items } = req.body;
    const userId = req.userId.toString();

    // Check if batch merge request (array of items from guest cart)
    const incomingItems = Array.isArray(items)
      ? items
      : productId
      ? [{ productId, quantity: Math.max(1, parseInt(quantity, 10) || 1) }]
      : [];

    if (incomingItems.length === 0) {
      return ApiResponse.error(res, 'No items provided to add to shopping bag.', 400);
    }

    if (isDbActive()) {
      let cart = await Cart.findOne({ user: req.userId });
      if (!cart) {
        cart = new Cart({ user: req.userId, items: [] });
      }

      for (const inc of incomingItems) {
        const prodId = inc.productId || inc.product?._id || inc.product;
        const qtyToAdd = Math.max(1, parseInt(inc.quantity, 10) || 1);

        if (!mongoose.Types.ObjectId.isValid(prodId)) continue;

        const product = await Product.findById(prodId);
        if (!product || !product.isActive || product.stock <= 0) continue;

        const existingItemIndex = cart.items.findIndex(
          (i) => i.product.toString() === prodId.toString()
        );

        if (existingItemIndex > -1) {
          const currentQty = cart.items[existingItemIndex].quantity;
          cart.items[existingItemIndex].quantity = Math.min(
            currentQty + qtyToAdd,
            product.stock
          );
        } else {
          cart.items.push({
            product: prodId,
            quantity: Math.min(qtyToAdd, product.stock),
          });
        }
      }

      await cart.save();
      await cart.populate('items.product');

      return ApiResponse.success(
        res,
        formatCartResponse(cart),
        'Shopping bag updated successfully',
        200
      );
    }

    // Dev Fallback
    let devCart = devCarts.get(userId);
    if (!devCart) {
      devCart = { _id: new mongoose.Types.ObjectId().toString(), user: userId, items: [] };
      devCarts.set(userId, devCart);
    }

    for (const inc of incomingItems) {
      const prodId = inc.productId || inc.product?._id || inc.product;
      const qtyToAdd = Math.max(1, parseInt(inc.quantity, 10) || 1);

      let product = getDevProductById(prodId);
      if (!product && Product.findById) {
        product = await Product.findById(prodId);
      }
      if (!product || !product.isActive || product.stock <= 0) continue;

      const existingIndex = devCart.items.findIndex(
        (i) => i.product._id?.toString() === prodId?.toString()
      );

      if (existingIndex > -1) {
        const curQty = devCart.items[existingIndex].quantity;
        devCart.items[existingIndex].quantity = Math.min(curQty + qtyToAdd, product.stock);
      } else {
        devCart.items.push({
          _id: new mongoose.Types.ObjectId().toString(),
          product: { ...product },
          quantity: Math.min(qtyToAdd, product.stock),
        });
      }
    }

    return ApiResponse.success(
      res,
      formatCartResponse(devCart),
      'Shopping bag updated successfully (dev mode)',
      200
    );
  } catch (error) {
    console.error('addOrMergeCartItems error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update shopping bag', 500);
  }
};

/**
 * @route   PATCH /api/cart/items/:productId
 * @desc    Update quantity for a cart item
 * @access  Authenticated Customer
 */
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId.toString();
    const newQty = parseInt(quantity, 10);

    if (isNaN(newQty)) {
      return ApiResponse.error(res, 'Valid quantity is required.', 400);
    }

    if (isDbActive()) {
      let cart = await Cart.findOne({ user: req.userId });
      if (!cart) {
        return ApiResponse.error(res, 'Shopping bag not found.', 404);
      }

      if (newQty <= 0) {
        cart.items = cart.items.filter(
          (item) => item.product.toString() !== productId.toString()
        );
      } else {
        const product = await Product.findById(productId);
        if (!product) {
          return ApiResponse.error(res, 'Product not found.', 404);
        }

        const item = cart.items.find(
          (i) => i.product.toString() === productId.toString()
        );

        if (item) {
          item.quantity = Math.min(newQty, product.stock);
        }
      }

      await cart.save();
      await cart.populate('items.product');

      return ApiResponse.success(
        res,
        formatCartResponse(cart),
        'Item quantity updated successfully'
      );
    }

    // Dev Fallback
    let devCart = devCarts.get(userId);
    if (!devCart) {
      return ApiResponse.error(res, 'Shopping bag not found.', 404);
    }

    if (newQty <= 0) {
      devCart.items = devCart.items.filter(
        (i) => i.product._id?.toString() !== productId?.toString()
      );
    } else {
      const item = devCart.items.find(
        (i) => i.product._id?.toString() === productId?.toString()
      );
      if (item) {
        item.quantity = Math.min(newQty, item.product.stock || 99);
      }
    }

    return ApiResponse.success(res, formatCartResponse(devCart), 'Item quantity updated successfully (dev mode)');
  } catch (error) {
    console.error('updateCartItemQuantity error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update item quantity', 500);
  }
};

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Remove an item from cart
 * @access  Authenticated Customer
 */
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId.toString();

    if (isDbActive()) {
      const cart = await Cart.findOne({ user: req.userId });
      if (!cart) {
        return ApiResponse.error(res, 'Shopping bag not found.', 404);
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId.toString()
      );

      await cart.save();
      await cart.populate('items.product');

      return ApiResponse.success(
        res,
        formatCartResponse(cart),
        'Item removed from shopping bag'
      );
    }

    // Dev Fallback
    let devCart = devCarts.get(userId);
    if (devCart) {
      devCart.items = devCart.items.filter(
        (i) => i.product._id?.toString() !== productId?.toString()
      );
    }

    return ApiResponse.success(res, formatCartResponse(devCart || { items: [] }), 'Item removed from shopping bag (dev mode)');
  } catch (error) {
    console.error('removeCartItem error:', error);
    return ApiResponse.error(res, error.message || 'Failed to remove item', 500);
  }
};

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Authenticated Customer
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.userId.toString();

    if (isDbActive()) {
      await Cart.findOneAndUpdate(
        { user: req.userId },
        { $set: { items: [] } },
        { upsert: true }
      );
    }

    let devCart = devCarts.get(userId);
    if (devCart) {
      devCart.items = [];
    }

    return ApiResponse.success(res, { items: [], totalItems: 0, subtotal: 0 }, 'Shopping bag cleared');
  } catch (error) {
    console.error('clearCart error:', error);
    return ApiResponse.error(res, error.message || 'Failed to clear cart', 500);
  }
};
