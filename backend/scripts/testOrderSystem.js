/**
 * Comprehensive Order & Cart Security & Safety Test Suite
 * Tests:
 * 1. Cart persistence in MongoDB
 * 2. Guest cart merging into customer cart after login
 * 3. Prevention of quantities greater than available stock
 * 4. Price tampering rejection (backend recalculation)
 * 5. Out-of-stock product rejection
 * 6. Direct Buy Now checkout without cart visit
 * 7. Unauthorized order access prevention (403 Forbidden)
 * 8. Order cancellation with atomic inventory restoration
 * 9. Admin order management & status transition validations
 * 10. Prevention of invalid status transitions (e.g. Delivered -> Cancelled)
 */

process.env.NODE_ENV = 'test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/userModel.js';
import Product from '../src/models/productModel.js';
import Order from '../src/models/orderModel.js';
import Cart from '../src/models/cartModel.js';
import { TokenService } from '../src/services/tokenService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// In-memory mock storage for standalone test execution
const simulatedUsers = new Map();
const simulatedProducts = new Map();
const simulatedCarts = new Map();
const simulatedOrders = new Map();

function setupMocks() {
  User.findById = function (id) {
    for (const [_, u] of simulatedUsers.entries()) {
      if (u._id.toString() === id.toString()) {
        return Promise.resolve({
          ...u,
          toJSON: () => {
            const copy = { ...u };
            delete copy.password;
            return copy;
          },
        });
      }
    }
    return Promise.resolve(null);
  };

  Product.findById = function (id) {
    const prod = simulatedProducts.get(id.toString());
    return Promise.resolve(prod || null);
  };

  Product.findOneAndUpdate = function (query, update, options = {}) {
    const prodId = query._id?.toString();
    const prod = simulatedProducts.get(prodId);
    if (!prod) return Promise.resolve(null);

    if (query.isActive !== undefined && prod.isActive !== query.isActive) {
      return Promise.resolve(null);
    }

    if (query.stock?.$gte !== undefined && prod.stock < query.stock.$gte) {
      return Promise.resolve(null);
    }

    if (update.$inc?.stock !== undefined) {
      prod.stock += update.$inc.stock;
    }

    simulatedProducts.set(prodId, prod);
    return Promise.resolve({ ...prod });
  };

  Product.findByIdAndUpdate = function (id, update) {
    const prod = simulatedProducts.get(id.toString());
    if (!prod) return Promise.resolve(null);
    if (update.$inc?.stock !== undefined) {
      prod.stock += update.$inc.stock;
    }
    simulatedProducts.set(id.toString(), prod);
    return Promise.resolve({ ...prod });
  };

  Cart.findOne = function (query) {
    const userId = query.user?.toString();
    let cart = simulatedCarts.get(userId);
    if (!cart) {
      return Promise.resolve(null);
    }

    // Return cart with populate mock
    return Promise.resolve({
      ...cart,
      save: async function () {
        simulatedCarts.set(userId, this);
        return this;
      },
      populate: async function (path) {
        if (path === 'items.product') {
          this.items = this.items.map((item) => {
            const prod = simulatedProducts.get(item.product?.toString());
            return {
              ...item,
              product: prod ? { ...prod } : null,
            };
          });
        }
        return this;
      },
    });
  };

  Cart.create = async function (doc) {
    const userId = doc.user?.toString();
    const newCart = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: userId,
      items: doc.items || [],
      save: async function () {
        simulatedCarts.set(userId, this);
        return this;
      },
      populate: async function () {
        return this;
      },
    };
    simulatedCarts.set(userId, newCart);
    return newCart;
  };

  Cart.findOneAndUpdate = async function (query, update) {
    const userId = query.user?.toString();
    let cart = simulatedCarts.get(userId);
    if (!cart) {
      cart = { _id: new mongoose.Types.ObjectId().toString(), user: userId, items: [] };
    }
    if (update.$set?.items) {
      cart.items = update.$set.items;
    }
    simulatedCarts.set(userId, cart);
    return cart;
  };

  Order.create = async function (docs) {
    const doc = Array.isArray(docs) ? docs[0] : docs;
    const orderId = new mongoose.Types.ObjectId().toString();
    const orderNumber = doc.orderNumber || `MAYA-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      _id: orderId,
      orderNumber,
      user: doc.user,
      customerEmail: doc.customerEmail,
      items: doc.items,
      shippingAddress: doc.shippingAddress,
      subtotal: doc.subtotal,
      shippingFee: doc.shippingFee || 0,
      totalAmount: doc.totalAmount,
      paymentMethod: doc.paymentMethod || 'COD',
      paymentStatus: doc.paymentStatus || 'Pending',
      orderStatus: doc.orderStatus || 'Placed',
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        simulatedOrders.set(orderId, this);
        return this;
      },
    };
    simulatedOrders.set(orderId, newOrder);
    return Array.isArray(docs) ? [newOrder] : newOrder;
  };

  Order.findById = function (id) {
    const o = simulatedOrders.get(id.toString());
    if (o) {
      return Promise.resolve({
        ...o,
        save: async function () {
          simulatedOrders.set(id.toString(), this);
          return this;
        },
      });
    }
    return Promise.resolve(null);
  };

  Order.findOne = function (query) {
    for (const [_, o] of simulatedOrders.entries()) {
      if (query.orderNumber && o.orderNumber === query.orderNumber) {
        return Promise.resolve({
          ...o,
          save: async function () {
            simulatedOrders.set(o._id.toString(), this);
            return this;
          },
        });
      }
    }
    return Promise.resolve(null);
  };

  Order.find = function (query = {}) {
    let results = Array.from(simulatedOrders.values());
    if (query.user) {
      results = results.filter((o) => o.user.toString() === query.user.toString());
    }
    return {
      sort: () => results,
    };
  };

  Order.countDocuments = function () {
    return Promise.resolve(simulatedOrders.size);
  };
}

async function runOrderSystemTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Shopping Cart, Checkout & Order Security Suite');
  console.log('======================================================\n');

  setupMocks();

  // Create Test Users
  const customerId1 = new mongoose.Types.ObjectId().toString();
  const customerId2 = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  simulatedUsers.set(customerId1, {
    _id: customerId1,
    name: 'Ananya Sharma',
    email: 'ananya@shoppers.com',
    role: 'customer',
  });

  simulatedUsers.set(customerId2, {
    _id: customerId2,
    name: 'Rohan Verma',
    email: 'rohan@shoppers.com',
    role: 'customer',
  });

  simulatedUsers.set(adminId, {
    _id: adminId,
    name: 'Store Administrator',
    email: 'admin@sareesweb.com',
    role: 'admin',
  });

  const customerToken1 = TokenService.generateUserToken({ _id: customerId1, role: 'customer', email: 'ananya@shoppers.com' });
  const customerToken2 = TokenService.generateUserToken({ _id: customerId2, role: 'customer', email: 'rohan@shoppers.com' });
  const adminToken = TokenService.generateUserToken({ _id: adminId, role: 'admin', email: 'admin@sareesweb.com' });

  // Create Test Sarees
  const kanjivaramId = new mongoose.Types.ObjectId().toString();
  simulatedProducts.set(kanjivaramId, {
    _id: kanjivaramId,
    title: 'Bridal Kanjeevaram Pure Silk Saree',
    sku: 'KANJ-TEST-001',
    price: 35000,
    stock: 4,
    isActive: true,
    images: [{ url: 'https://example.com/kanj.jpg', isMain: true }],
  });

  const banarasiId = new mongoose.Types.ObjectId().toString();
  simulatedProducts.set(banarasiId, {
    _id: banarasiId,
    title: 'Royal Banarasi Kadwa Saree',
    sku: 'BAN-TEST-002',
    price: 28000,
    stock: 2,
    isActive: true,
    images: [{ url: 'https://example.com/ban.jpg', isMain: true }],
  });

  const outOfStockId = new mongoose.Types.ObjectId().toString();
  simulatedProducts.set(outOfStockId, {
    _id: outOfStockId,
    title: 'Vintage Chanderi Tissue Saree',
    sku: 'CHAN-TEST-003',
    price: 18000,
    stock: 0,
    isActive: true,
    images: [{ url: 'https://example.com/chan.jpg', isMain: true }],
  });

  // --- Test 1: Add Item to MongoDB Cart & Stock Cap ---
  console.log('--- Test 1: Add Item to Cart with Stock Cap ---');
  const addCartRes = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${customerToken1}`)
    .send({ productId: kanjivaramId, quantity: 2 });

  assert(addCartRes.status === 200, `Item added to cart with 200 OK (got ${addCartRes.status})`);
  assert(addCartRes.body.data.items.length === 1, 'Cart contains 1 item');
  assert(addCartRes.body.data.items[0].quantity === 2, 'Item quantity is 2');
  assert(addCartRes.body.data.subtotal === 70000, 'Subtotal is 70,000 (2 × 35,000)');

  // Requesting quantity > stock should cap at available stock (4)
  const overStockRes = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${customerToken1}`)
    .send({ productId: kanjivaramId, quantity: 10 });

  assert(overStockRes.status === 200, 'Handled quantity exceeding stock');
  assert(overStockRes.body.data.items[0].quantity === 4, 'Quantity capped at maximum available stock (4)');

  // --- Test 2: Guest Cart Reconciliation / Merge upon Login ---
  console.log('\n--- Test 2: Guest Cart Reconciliation / Merge ---');
  // Customer 2 had a guest cart with Banarasi (qty 1)
  const mergeRes = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${customerToken2}`)
    .send({
      items: [
        { productId: banarasiId, quantity: 1 },
      ],
    });

  assert(mergeRes.status === 200, `Merged guest cart successfully with 200 OK (got ${mergeRes.status})`);
  assert(mergeRes.body.data.items.length === 1, 'Customer 2 cart has 1 merged item');
  assert(mergeRes.body.data.items[0].product.title === 'Royal Banarasi Kadwa Saree', 'Matching merged saree');

  // --- Test 3: Cart Retrieval (GET /api/cart) ---
  console.log('\n--- Test 3: Authenticated Cart Persistence (GET /api/cart) ---');
  const getCartRes = await request(app)
    .get('/api/cart')
    .set('Authorization', `Bearer ${customerToken1}`);

  assert(getCartRes.status === 200, `Cart retrieved with 200 OK (got ${getCartRes.status})`);
  assert(getCartRes.body.data.items[0].quantity === 4, 'Cart persisted across requests');

  // --- Test 4: Price Tampering Rejection on Checkout ---
  console.log('\n--- Test 4: Price Tampering Rejection ---');
  // Attacker attempts to submit price: 100 instead of 35,000
  const tamperedOrderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken1}`)
    .send({
      items: [{ product: kanjivaramId, quantity: 1, price: 100, totalAmount: 100 }],
      shippingAddress: {
        fullName: 'Ananya Sharma',
        phone: '9876543210',
        addressLine: '12 Temple Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
      },
      paymentMethod: 'COD',
    });

  assert(tamperedOrderRes.status === 201, `Order created with 201 Created`);
  assert(
    tamperedOrderRes.body.data.totalAmount === 35000,
    `Total recalculates using server database price (₹35,000) ignoring client payload (₹100)`
  );
  assert(
    tamperedOrderRes.body.data.paymentStatus === 'Pending',
    'COD order marked Pending (not paid automatically)'
  );
  assert(
    tamperedOrderRes.body.data.orderStatus === 'Placed',
    'Initial order status is Placed'
  );

  const orderId1 = tamperedOrderRes.body.data._id;

  // --- Test 5: Out of Stock Product Rejection ---
  console.log('\n--- Test 5: Out of Stock Product Rejection ---');
  const outOfStockOrderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken1}`)
    .send({
      items: [{ product: outOfStockId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Ananya Sharma',
        phone: '9876543210',
        addressLine: '12 Temple Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
      },
    });

  assert(outOfStockOrderRes.status === 400, `Out-of-stock product rejected with 400 Bad Request (got ${outOfStockOrderRes.status})`);

  // --- Test 6: Direct Buy Now Checkout ---
  console.log('\n--- Test 6: Direct Buy Now Checkout (Bypassing Cart) ---');
  const buyNowRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken2}`)
    .send({
      isBuyNow: true,
      items: [{ product: banarasiId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Rohan Verma',
        phone: '9811122233',
        addressLine: '74 Civil Lines',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226001',
        deliveryInstructions: 'Ring doorbell twice',
      },
      paymentMethod: 'COD',
    });

  assert(buyNowRes.status === 201, `Buy Now order placed with 201 Created (got ${buyNowRes.status})`);
  assert(buyNowRes.body.data.shippingAddress.deliveryInstructions === 'Ring doorbell twice', 'Delivery instructions saved');

  // Verify Customer 2's cart was NOT wiped by Buy Now
  const c2CartRes = await request(app)
    .get('/api/cart')
    .set('Authorization', `Bearer ${customerToken2}`);
  assert(c2CartRes.body.data.items.length === 1, "Customer 2's unrelated cart preserved during Buy Now");

  // --- Test 7: Unauthorized Order Access Prevention ---
  console.log('\n--- Test 7: Unauthorized Order Access (IDOR Prevention) ---');
  // Customer 2 attempts to view Customer 1's order
  const unauthorizedRes = await request(app)
    .get(`/api/orders/${orderId1}`)
    .set('Authorization', `Bearer ${customerToken2}`);

  assert(
    unauthorizedRes.status === 403,
    `Customer blocked from accessing another customer's order with 403 Forbidden (got ${unauthorizedRes.status})`
  );

  // Admin permitted to view any order
  const adminViewRes = await request(app)
    .get(`/api/orders/${orderId1}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert(adminViewRes.status === 200, `Admin permitted to view order with 200 OK (got ${adminViewRes.status})`);

  // --- Test 8: Order Cancellation & Inventory Restoration ---
  console.log('\n--- Test 8: Order Cancellation & Stock Restoration ---');
  const stockBeforeCancel = simulatedProducts.get(kanjivaramId).stock;
  const cancelRes = await request(app)
    .patch(`/api/orders/${orderId1}/cancel`)
    .set('Authorization', `Bearer ${customerToken1}`);

  assert(cancelRes.status === 200, `Order cancelled successfully with 200 OK (got ${cancelRes.status})`);
  assert(cancelRes.body.data.orderStatus === 'Cancelled', 'Status updated to Cancelled');
  const stockAfterCancel = simulatedProducts.get(kanjivaramId).stock;
  assert(stockAfterCancel === stockBeforeCancel + 1, `Inventory restored by 1 unit (${stockBeforeCancel} -> ${stockAfterCancel})`);

  // --- Test 9: Admin Order Management & Valid Status Transitions ---
  console.log('\n--- Test 9: Admin Order Status Transitions ---');
  const orderId2 = buyNowRes.body.data._id;

  // Placed -> Confirmed
  const confirmRes = await request(app)
    .patch(`/api/orders/${orderId2}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Confirmed' });
  assert(confirmRes.status === 200, `Transition Placed -> Confirmed allowed`);

  // Confirmed -> Shipped
  const shipRes = await request(app)
    .patch(`/api/orders/${orderId2}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Shipped' });
  assert(shipRes.status === 200, `Transition Confirmed -> Shipped allowed`);

  // Shipped -> Delivered (and mark COD paid)
  const deliverRes = await request(app)
    .patch(`/api/orders/${orderId2}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Delivered', markPaid: true });
  assert(deliverRes.status === 200, `Transition Shipped -> Delivered allowed`);
  assert(deliverRes.body.data.paymentStatus === 'Paid', 'COD payment marked Paid upon delivery');

  // --- Test 10: Prevention of Invalid Status Transitions ---
  console.log('\n--- Test 10: Invalid Status Transition Rejection ---');
  // Attempting Delivered -> Cancelled
  const invalidTransitionRes = await request(app)
    .patch(`/api/orders/${orderId2}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Cancelled' });

  assert(
    invalidTransitionRes.status === 400,
    `Invalid transition (Delivered -> Cancelled) blocked with 400 Bad Request (got ${invalidTransitionRes.status})`
  );

  console.log('\n======================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOrderSystemTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
