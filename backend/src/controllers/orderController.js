import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { decrementDevProductStock, getDevProductById } from './productController.js';
import EmailService from '../services/emailService.js';

// In-memory dev orders storage fallback
const devOrders = [];

const isDbActive = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Valid state transitions for order statuses
 */
const ALLOWED_STATUS_TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

/**
 * @route   POST /api/orders
 * @desc    Create a new customer order (Cart checkout or Direct Buy Now)
 * @access  Authenticated Customer
 */
export const createOrder = async (req, res) => {
  const session = isDbActive() && mongoose.connection.client ? await mongoose.startSession().catch(() => null) : null;

  try {
    const {
      items: rawItems,
      shippingAddress,
      paymentMethod = 'COD',
      idempotencyKey,
      isBuyNow = false,
      fromCart = false,
    } = req.body;

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName?.trim() ||
      !shippingAddress.phone?.trim() ||
      !shippingAddress.addressLine?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.pincode?.trim()
    ) {
      return ApiResponse.error(
        res,
        'Please provide a complete shipping address (Full Name, Phone, Address, City, State, PIN).',
        400
      );
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return ApiResponse.error(res, 'Order must contain at least one saree.', 400);
    }

    // Check for duplicate submission via idempotencyKey
    if (idempotencyKey && isDbActive()) {
      const existing = await Order.findOne({ idempotencyKey, user: req.userId });
      if (existing) {
        return ApiResponse.success(res, existing, 'Order retrieved (duplicate submission prevented)', 200);
      }
    }

    // Rate-limit rapid duplicate submissions (last 3 seconds)
    if (isDbActive()) {
      const recentOrder = await Order.findOne({
        user: req.userId,
        createdAt: { $gte: new Date(Date.now() - 3000) },
      });
      if (recentOrder) {
        return ApiResponse.error(
          res,
          'Your previous order is currently being processed. Please wait a moment before trying again.',
          429
        );
      }
    }

    // Price recalculation and stock validation against DATABASE (Never trust client prices)
    const verifiedOrderItems = [];
    let calculatedSubtotal = 0;
    const decrementedProducts = [];

    // Check if MongoDB transactions are supported
    const supportsTransactions = session && mongoose.connection.replicaSet;

    if (supportsTransactions) {
      // Execute within atomic MongoDB transaction
      let createdOrder;
      await session.withTransaction(async () => {
        for (const item of rawItems) {
          const productId = item.product?._id || item.product || item._id;
          const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

          if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error('Invalid product identifier provided in order.');
          }

          // Atomically check availability and decrement stock
          const product = await Product.findOneAndUpdate(
            {
              _id: productId,
              isActive: true,
              stock: { $gte: requestedQty },
            },
            {
              $inc: { stock: -requestedQty },
            },
            { session, new: true }
          );

          if (!product) {
            // Check why it failed
            const existingProd = await Product.findById(productId).session(session);
            if (!existingProd) {
              throw new Error(`Saree was not found in boutique.`);
            }
            if (!existingProd.isActive) {
              throw new Error(`"${existingProd.title}" is currently not available for purchase.`);
            }
            throw new Error(
              `Insufficient stock for "${existingProd.title}". Only ${existingProd.stock} available, requested ${requestedQty}.`
            );
          }

          const unitPrice = Number(product.price);
          calculatedSubtotal += unitPrice * requestedQty;

          const mainImage =
            product.images?.find((img) => img.isMain)?.url ||
            product.images?.[0]?.url ||
            '';

          verifiedOrderItems.push({
            product: product._id,
            title: product.title,
            sku: product.sku,
            price: unitPrice,
            quantity: requestedQty,
            image: mainImage,
          });
        }

        const shippingFee = 0; // Free express delivery for handlooms
        const totalAmount = calculatedSubtotal + shippingFee;

        // Generate Order Number
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(100 + Math.random() * 900);
        const orderNumber = `MAYA-${timestamp}-${random}`;

        // Create Order in DB
        const [order] = await Order.create(
          [
            {
              orderNumber,
              idempotencyKey: idempotencyKey || null,
              user: req.userId,
              customerEmail: req.user?.email || '',
              items: verifiedOrderItems,
              shippingAddress: {
                fullName: shippingAddress.fullName.trim(),
                phone: shippingAddress.phone.trim(),
                addressLine: shippingAddress.addressLine.trim(),
                city: shippingAddress.city.trim(),
                state: shippingAddress.state.trim(),
                pincode: shippingAddress.pincode.trim(),
                deliveryInstructions: shippingAddress.deliveryInstructions?.trim() || '',
              },
              subtotal: calculatedSubtotal,
              shippingFee,
              totalAmount,
              paymentMethod: paymentMethod === 'COD' ? 'COD' : paymentMethod,
              paymentStatus: 'Pending', // COD orders must remain Pending until collected
              orderStatus: 'Placed',
            },
          ],
          { session }
        );

        createdOrder = order;

        // If checkout came from the cart, clear purchased items from user's MongoDB cart
        if (fromCart || !isBuyNow) {
          await Cart.findOneAndUpdate(
            { user: req.userId },
            { $set: { items: [] } },
            { session }
          );
        }
      });

      // Send email alert to store owner (komakulakiranmai@gmail.com)
      EmailService.sendOrderNotification(createdOrder).catch((err) => {
        console.warn('Order notification email failed:', err.message);
      });

      return ApiResponse.success(res, createdOrder, 'Order placed successfully', 201);
    }

    // Fallback for standalone MongoDB or Dev Mocking: Atomic Conditional Decrements with Compensating Rollback
    if (isDbActive()) {
      try {
        for (const item of rawItems) {
          const productId = item.product?._id || item.product || item._id;
          const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

          if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error('Invalid product identifier provided in order.');
          }

          // Atomic conditional update
          const product = await Product.findOneAndUpdate(
            {
              _id: productId,
              isActive: true,
              stock: { $gte: requestedQty },
            },
            {
              $inc: { stock: -requestedQty },
            },
            { new: true }
          );

          if (!product) {
            const existingProd = await Product.findById(productId);
            if (!existingProd) {
              throw new Error(`Saree was not found in boutique.`);
            }
            if (!existingProd.isActive) {
              throw new Error(`"${existingProd.title}" is currently not available for purchase.`);
            }
            throw new Error(
              `Insufficient stock for "${existingProd.title}". Only ${existingProd.stock} available, requested ${requestedQty}.`
            );
          }

          decrementedProducts.push({ productId: product._id, quantity: requestedQty });

          const unitPrice = Number(product.price);
          calculatedSubtotal += unitPrice * requestedQty;

          const mainImage =
            product.images?.find((img) => img.isMain)?.url ||
            product.images?.[0]?.url ||
            '';

          verifiedOrderItems.push({
            product: product._id,
            title: product.title,
            sku: product.sku,
            price: unitPrice,
            quantity: requestedQty,
            image: mainImage,
          });
        }

        const shippingFee = 0;
        const totalAmount = calculatedSubtotal + shippingFee;

        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(100 + Math.random() * 900);
        const orderNumber = `MAYA-${timestamp}-${random}`;

        const newOrder = await Order.create({
          orderNumber,
          idempotencyKey: idempotencyKey || null,
          user: req.userId,
          customerEmail: req.user?.email || '',
          items: verifiedOrderItems,
          shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            addressLine: shippingAddress.addressLine.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            pincode: shippingAddress.pincode.trim(),
            deliveryInstructions: shippingAddress.deliveryInstructions?.trim() || '',
          },
          subtotal: calculatedSubtotal,
          shippingFee,
          totalAmount,
          paymentMethod: paymentMethod === 'COD' ? 'COD' : paymentMethod,
          paymentStatus: 'Pending',
          orderStatus: 'Placed',
        });

        // Clear cart only after successful order creation
        if (fromCart || !isBuyNow) {
          await Cart.findOneAndUpdate({ user: req.userId }, { $set: { items: [] } });
        }

        // Send email alert to store owner (komakulakiranmai@gmail.com)
        EmailService.sendOrderNotification(newOrder).catch((err) => {
          console.warn('Order notification email failed:', err.message);
        });

        return ApiResponse.success(res, newOrder, 'Order placed successfully', 201);
      } catch (err) {
        // Compensating rollback for decremented products
        for (const dec of decrementedProducts) {
          await Product.findByIdAndUpdate(dec.productId, {
            $inc: { stock: dec.quantity },
          }).catch(() => null);
        }
        throw err;
      }
    }

    // Dev Fallback Mock (when DB connection is not initialized)
    for (const item of rawItems) {
      const prodId = item.product?._id || item.product || item._id;
      const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

      let product = getDevProductById(prodId);
      if (!product && Product.findById) {
        product = await Product.findById(prodId);
      }

      if (!product || product.isActive === false) {
        return ApiResponse.error(res, 'Saree is not available for purchase.', 400);
      }

      if (product.stock < requestedQty) {
        return ApiResponse.error(
          res,
          `Insufficient stock for "${product.title}". Only ${product.stock} available.`,
          400
        );
      }

      // Always recalculate using current server database price
      const unitPrice = Number(product.price);
      calculatedSubtotal += unitPrice * requestedQty;

      if (prodId) {
        decrementDevProductStock(prodId, requestedQty);
        const inDev = getDevProductById(prodId);
        if (!inDev && product && product.stock !== undefined) {
          product.stock = Math.max(0, product.stock - requestedQty);
        }
      }

      verifiedOrderItems.push({
        product: prodId || new mongoose.Types.ObjectId().toString(),
        title: product.title || item.title || 'Handloom Silk Saree',
        sku: product.sku || item.sku || 'SAR-DEV',
        price: unitPrice,
        quantity: requestedQty,
        image: product.images?.[0]?.url || item.image || item.images?.[0]?.url || '',
      });
    }

    const orderNumber = `MAYA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const devNewOrder = {
      _id: new mongoose.Types.ObjectId().toString(),
      orderNumber,
      user: req.userId,
      customerEmail: req.user?.email || 'customer@sareesweb.com',
      items: verifiedOrderItems,
      shippingAddress,
      subtotal: calculatedSubtotal,
      shippingFee: 0,
      totalAmount: calculatedSubtotal,
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Placed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    devOrders.unshift(devNewOrder);

    // Send email alert to store owner in dev/fallback mode
    EmailService.sendOrderNotification(devNewOrder).catch(() => {});

    return ApiResponse.success(res, devNewOrder, 'Order placed successfully (dev mode)', 201);
  } catch (error) {
    console.error('createOrder error:', error);
    return ApiResponse.error(res, error.message || 'Failed to place order.', 400);
  } finally {
    if (session) {
      await session.endSession().catch(() => null);
    }
  }
};

/**
 * @route   GET /api/orders/my
 * @route   GET /api/orders/my-orders
 * @desc    Get order history for logged-in customer
 * @access  Authenticated Customer
 */
export const getMyOrders = async (req, res) => {
  try {
    if (isDbActive()) {
      const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
      return ApiResponse.success(res, orders, 'Orders retrieved successfully');
    }

    const userOrders = devOrders.filter((o) => o.user?.toString() === req.userId?.toString());
    return ApiResponse.success(res, userOrders, 'Orders retrieved successfully (dev mode)');
  } catch (error) {
    console.error('getMyOrders error:', error);
    return ApiResponse.error(res, 'Failed to retrieve order history.', 500);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID (Strict ownership check)
 * @access  Authenticated Customer / Admin
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbActive()) {
      let order = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: id });
      }

      if (!order) {
        return ApiResponse.error(res, 'Order not found.', 404);
      }

      // Security check: Must belong to requesting customer or requester is Admin
      if (order.user.toString() !== req.userId.toString() && req.user?.role !== 'admin') {
        return ApiResponse.error(res, 'Unauthorized access to this order.', 403);
      }

      return ApiResponse.success(res, order, 'Order retrieved successfully');
    }

    const devOrder = devOrders.find((o) => o._id.toString() === id || o.orderNumber === id);
    if (!devOrder) {
      return ApiResponse.error(res, 'Order not found.', 404);
    }

    if (devOrder.user?.toString() !== req.userId.toString() && req.user?.role !== 'admin') {
      return ApiResponse.error(res, 'Unauthorized access to this order.', 403);
    }

    return ApiResponse.success(res, devOrder, 'Order retrieved successfully');
  } catch (error) {
    console.error('getOrderById error:', error);
    return ApiResponse.error(res, 'Failed to fetch order details.', 500);
  }
};

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order and restore stock atomically (Customer or Admin)
 * @access  Authenticated Customer / Admin
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbActive()) {
      let order = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: id });
      }

      if (!order) {
        return ApiResponse.error(res, 'Order not found.', 404);
      }

      // Security check: Customer can only cancel their own order; Admin can cancel any
      if (order.user.toString() !== req.userId.toString() && req.user?.role !== 'admin') {
        return ApiResponse.error(res, 'Unauthorized to cancel this order.', 403);
      }

      // Only Placed or Confirmed orders can be cancelled
      if (!['Placed', 'Confirmed'].includes(order.orderStatus)) {
        return ApiResponse.error(
          res,
          `Cannot cancel order with status "${order.orderStatus}". Only Placed or Confirmed orders can be cancelled.`,
          400
        );
      }

      // Restore stock for all items
      for (const item of order.items) {
        if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          }).catch(() => null);
        }
      }

      order.orderStatus = 'Cancelled';
      await order.save();

      return ApiResponse.success(res, order, 'Order cancelled successfully and stock restored.');
    }

    const devOrder = devOrders.find((o) => o._id.toString() === id || o.orderNumber === id);
    if (!devOrder) {
      return ApiResponse.error(res, 'Order not found.', 404);
    }

    if (devOrder.user?.toString() !== req.userId.toString() && req.user?.role !== 'admin') {
      return ApiResponse.error(res, 'Unauthorized to cancel this order.', 403);
    }

    if (!['Placed', 'Confirmed'].includes(devOrder.orderStatus)) {
      return ApiResponse.error(
        res,
        `Cannot cancel order with status "${devOrder.orderStatus}". Only Placed or Confirmed orders can be cancelled.`,
        400
      );
    }

    // Restore stock in dev
    for (const item of devOrder.items || []) {
      const prodId = item.product?._id || item.product;
      let prod = getDevProductById(prodId);
      if (!prod && Product.findById) {
        prod = await Product.findById(prodId);
      }
      if (prod) {
        prod.stock += item.quantity;
      }
      if (isDbActive()) {
        await Product.findByIdAndUpdate(prodId, { $inc: { stock: item.quantity } });
      }
    }

    devOrder.orderStatus = 'Cancelled';
    return ApiResponse.success(res, devOrder, 'Order cancelled successfully and stock restored (dev mode).');
  } catch (error) {
    console.error('cancelOrder error:', error);
    return ApiResponse.error(res, error.message || 'Failed to cancel order.', 500);
  }
};

/**
 * @route   GET /api/orders/admin
 * @desc    Get all orders with filtering and statistics (Admin Only)
 * @access  Admin
 */
export const getAdminOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

    if (isDbActive()) {
      const query = {};

      if (status && status !== 'all') {
        query.orderStatus = status;
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { orderNumber: regex },
          { customerEmail: regex },
          { 'shippingAddress.fullName': regex },
          { 'shippingAddress.phone': regex },
        ];
      }

      const total = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      // Calculate aggregate dashboard statistics
      const allOrders = await Order.find({});
      const stats = {
        totalOrders: allOrders.length,
        placedOrders: allOrders.filter((o) => o.orderStatus === 'Placed').length,
        confirmedOrders: allOrders.filter((o) => o.orderStatus === 'Confirmed').length,
        shippedOrders: allOrders.filter((o) => o.orderStatus === 'Shipped').length,
        deliveredOrders: allOrders.filter((o) => o.orderStatus === 'Delivered').length,
        cancelledOrders: allOrders.filter((o) => o.orderStatus === 'Cancelled').length,
        totalRevenue: allOrders
          .filter((o) => o.orderStatus !== 'Cancelled')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      };

      return ApiResponse.success(
        res,
        {
          orders,
          stats,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            hasNextPage: pageNum * limitNum < total,
            hasPrevPage: pageNum > 1,
          },
        },
        'Admin orders retrieved successfully'
      );
    }

    // Dev Fallback
    return ApiResponse.success(
      res,
      {
        orders: devOrders,
        stats: {
          totalOrders: devOrders.length,
          placedOrders: devOrders.filter((o) => o.orderStatus === 'Placed').length,
          confirmedOrders: devOrders.filter((o) => o.orderStatus === 'Confirmed').length,
          shippedOrders: devOrders.filter((o) => o.orderStatus === 'Shipped').length,
          deliveredOrders: devOrders.filter((o) => o.orderStatus === 'Delivered').length,
          cancelledOrders: devOrders.filter((o) => o.orderStatus === 'Cancelled').length,
          totalRevenue: devOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        },
        pagination: {
          total: devOrders.length,
          page: 1,
          limit: limitNum,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      'Admin orders retrieved (dev mode)'
    );
  } catch (error) {
    console.error('getAdminOrders error:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve orders.', 500);
  }
};

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status with strict transition validation (Admin Only)
 * @access  Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status) {
      return ApiResponse.error(res, 'New order status is required.', 400);
    }

    if (isDbActive()) {
      let order = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: id });
      }

      if (!order) {
        return ApiResponse.error(res, 'Order not found.', 404);
      }

      const currentStatus = order.orderStatus;
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedNext.includes(status) && status !== currentStatus) {
        return ApiResponse.error(
          res,
          `Invalid status transition from "${currentStatus}" to "${status}". Allowed next transitions: ${allowedNext.join(', ') || 'None'}.`,
          400
        );
      }

      // If transitioning to Cancelled, restore stock
      if (status === 'Cancelled' && currentStatus !== 'Cancelled') {
        for (const item of order.items) {
          if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            }).catch(() => null);
          }
        }
      }

      order.orderStatus = status;

      // If explicitly delivered and COD, payment can also be marked as Paid
      if (paymentStatus && ['Pending', 'Paid'].includes(paymentStatus)) {
        order.paymentStatus = paymentStatus;
      } else if (status === 'Delivered' && order.paymentMethod === 'COD' && req.body.markPaid) {
        order.paymentStatus = 'Paid';
      }

      await order.save();

      return ApiResponse.success(res, order, `Order status updated to "${status}".`);
    }

    const devOrder = devOrders.find((o) => o._id.toString() === id || o.orderNumber === id);
    if (!devOrder) {
      return ApiResponse.error(res, 'Order not found.', 404);
    }

    const currentStatus = devOrder.orderStatus;
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(status) && status !== currentStatus) {
      return ApiResponse.error(
        res,
        `Invalid status transition from "${currentStatus}" to "${status}". Allowed next transitions: ${allowedNext.join(', ') || 'None'}.`,
        400
      );
    }

    // Restore stock if cancelled
    if (status === 'Cancelled' && currentStatus !== 'Cancelled') {
      for (const item of devOrder.items || []) {
        const prodId = item.product?._id || item.product;
        let prod = getDevProductById(prodId);
        if (prod) prod.stock += item.quantity;
        if (isDbActive()) {
          await Product.findByIdAndUpdate(prodId, { $inc: { stock: item.quantity } });
        }
      }
    }

    devOrder.orderStatus = status;
    if (paymentStatus && ['Pending', 'Paid'].includes(paymentStatus)) {
      devOrder.paymentStatus = paymentStatus;
    } else if (status === 'Delivered' && devOrder.paymentMethod === 'COD' && req.body.markPaid) {
      devOrder.paymentStatus = 'Paid';
    }

    return ApiResponse.success(res, devOrder, `Order status updated to "${status}" (dev mode).`);
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update order status.', 500);
  }
};

/**
 * @route   PATCH /api/orders/:id/payment
 * @desc    Update payment status (e.g. mark COD as Paid) (Admin Only)
 * @access  Admin
 */
export const updateOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !['Pending', 'Paid'].includes(paymentStatus)) {
      return ApiResponse.error(res, 'Valid payment status ("Pending" or "Paid") is required.', 400);
    }

    if (isDbActive()) {
      let order = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: id });
      }

      if (!order) {
        return ApiResponse.error(res, 'Order not found.', 404);
      }

      order.paymentStatus = paymentStatus;
      await order.save();

      return ApiResponse.success(res, order, `Payment status updated to "${paymentStatus}".`);
    }

    const devOrder = devOrders.find((o) => o._id.toString() === id || o.orderNumber === id);
    if (!devOrder) {
      return ApiResponse.error(res, 'Order not found.', 404);
    }

    devOrder.paymentStatus = paymentStatus;
    return ApiResponse.success(res, devOrder, `Payment status updated to "${paymentStatus}" (dev mode).`);
  } catch (error) {
    console.error('updateOrderPayment error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update payment status.', 500);
  }
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAdminOrders,
  updateOrderStatus,
  updateOrderPayment,
};
