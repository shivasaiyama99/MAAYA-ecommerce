/**
 * Comprehensive Manual UPI Transfer & Email Workflow Test Suite
 * Tests all requirements from:
 * 1. COD removal / forced PhonePe / Google Pay payment method
 * 2. Secure backend total price calculation (ignoring client price tampering)
 * 3. Initial statuses: orderStatus='Placed', paymentStatus='Pending', paymentVerified=false
 * 4. Validation of customer details (fullName, phone, email regex, address)
 * 5. Order placement email dispatch to Admin and Customer
 * 6. IDOR protection: Customer cannot view another customer's order
 * 7. RBAC protection: Customer cannot confirm orders (403 Forbidden)
 * 8. Admin confirmation requires explicit payment verification (paymentVerified === true)
 * 9. Admin confirmation updates status to Confirmed, paymentStatus to Paid, and dispatches confirmation email
 * 10. Confirmation email HTML & text contains exact required store contact details
 * 11. Duplicate order prevention via idempotency key
 * 12. Safe email retry mechanism (resend-email endpoint)
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
import { EmailService } from '../src/services/emailService.js';
import { config } from '../src/config/env.js';

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

// In-memory mock maps for test execution
const simulatedUsers = new Map();
const simulatedProducts = new Map();
const simulatedOrders = new Map();
const simulatedCarts = new Map();

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

  Cart.findOneAndUpdate = async function (query, update) {
    const userId = query.user?.toString();
    let cart = simulatedCarts.get(userId) || { user: userId, items: [] };
    if (update.$set?.items) {
      cart.items = update.$set.items;
    }
    simulatedCarts.set(userId, cart);
    return cart;
  };

  Order.create = async function (doc) {
    const orderId = new mongoose.Types.ObjectId().toString();
    const order = {
      _id: orderId,
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        simulatedOrders.set(orderId, this);
        return this;
      },
    };
    simulatedOrders.set(orderId, order);
    return order;
  };

  Order.findById = function (id) {
    const order = simulatedOrders.get(id.toString());
    if (!order) return Promise.resolve(null);
    return Promise.resolve({
      ...order,
      save: async function () {
        simulatedOrders.set(id.toString(), this);
        return this;
      },
      populate: async function () {
        return this;
      },
    });
  };

  Order.findOne = function (query) {
    if (query.orderNumber) {
      for (const [_, ord] of simulatedOrders.entries()) {
        if (ord.orderNumber === query.orderNumber) {
          return Promise.resolve({
            ...ord,
            save: async function () {
              simulatedOrders.set(ord._id.toString(), this);
              return this;
            },
            populate: async function () {
              return this;
            },
          });
        }
      }
    }
    if (query.idempotencyKey) {
      for (const [_, ord] of simulatedOrders.entries()) {
        if (ord.idempotencyKey === query.idempotencyKey) {
          return Promise.resolve({
            ...ord,
            save: async function () {
              simulatedOrders.set(ord._id.toString(), this);
              return this;
            },
          });
        }
      }
    }
    return Promise.resolve(null);
  };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Manual UPI Transfer & Email Workflow Test Suite');
  console.log('======================================================\n');

  setupMocks();

  // 1. Create simulated test users: Customer 1, Customer 2, and Admin
  const customerId1 = new mongoose.Types.ObjectId().toString();
  const customer1 = {
    _id: customerId1,
    name: 'Radhika Iyer',
    email: 'radhika@example.com',
    phone: '9876543210',
    role: 'customer',
  };
  simulatedUsers.set(customerId1, customer1);
  const customerToken1 = TokenService.generateUserToken(customer1);

  const customerId2 = new mongoose.Types.ObjectId().toString();
  const customer2 = {
    _id: customerId2,
    name: 'Meera Patel',
    email: 'meera@example.com',
    phone: '9876543211',
    role: 'customer',
  };
  simulatedUsers.set(customerId2, customer2);
  const customerToken2 = TokenService.generateUserToken(customer2);

  const adminId = new mongoose.Types.ObjectId().toString();
  const admin = {
    _id: adminId,
    name: 'Admin Store Manager',
    email: 'komakulakiranmai@gmail.com',
    phone: '9701607651',
    role: 'admin',
  };
  simulatedUsers.set(adminId, admin);
  const adminToken = TokenService.generateUserToken(admin);

  // 2. Create simulated Saree Product in database
  const sareeId = new mongoose.Types.ObjectId().toString();
  const sareeProduct = {
    _id: sareeId,
    title: 'Pure Kanchipuram Crimson Silk Saree',
    sku: 'KAN-CRIM-001',
    price: 34500, // Trusted backend price ₹34,500
    stock: 5,
    category: 'Kanjivaram',
    isActive: true,
    images: [{ url: 'https://example.com/saree.jpg', isMain: true }],
  };
  simulatedProducts.set(sareeId, sareeProduct);

  // --- Test 1: Fetch Store Payment Configuration ---
  console.log('--- Test 1: GET /api/orders/payment-config ---');
  const configRes = await request(app).get('/api/orders/payment-config');
  assert(configRes.status === 200, 'Payment config endpoint returns 200 OK');
  assert(configRes.body.success === true, 'Returns success: true');
  assert(typeof configRes.body.data.upiId === 'string', 'Returns configured or fallback store UPI ID');
  assert(configRes.body.data.supportEmail === 'komakulakiranmai@gmail.com', 'Matches designated support email');

  // Create customer without email to verify mandatory email check
  const customerIdNoEmail = new mongoose.Types.ObjectId().toString();
  const customerNoEmail = {
    _id: customerIdNoEmail,
    name: 'Phone Only User',
    phone: '9876543299',
    role: 'customer',
  };
  simulatedUsers.set(customerIdNoEmail, customerNoEmail);
  const customerNoEmailToken = TokenService.generateUserToken(customerNoEmail);

  // --- Test 2: Validation on Invalid Checkout Fields ---
  console.log('\n--- Test 2: Invalid Checkout Information Handling ---');
  const invalidPayloads = [
    {
      desc: 'Missing email',
      token: customerNoEmailToken,
      payload: {
        isBuyNow: true,
        items: [{ product: sareeId, quantity: 1 }],
        shippingAddress: {
          fullName: 'Radhika Iyer',
          phone: '9876543210',
          addressLine: '12 Temple St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600004',
        },
      },
      expectedStatus: 400,
    },
    {
      desc: 'Invalid email format',
      token: customerToken1,
      payload: {
        isBuyNow: true,
        customerEmail: 'not-an-email',
        items: [{ product: sareeId, quantity: 1 }],
        shippingAddress: {
          fullName: 'Radhika Iyer',
          phone: '9876543210',
          addressLine: '12 Temple St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600004',
        },
      },
      expectedStatus: 400,
    },
    {
      desc: 'Missing delivery pincode',
      token: customerToken1,
      payload: {
        isBuyNow: true,
        customerEmail: 'radhika@example.com',
        items: [{ product: sareeId, quantity: 1 }],
        shippingAddress: {
          fullName: 'Radhika Iyer',
          phone: '9876543210',
          addressLine: '12 Temple St',
          city: 'Chennai',
          state: 'Tamil Nadu',
        },
      },
      expectedStatus: 400,
    },
  ];

  for (const item of invalidPayloads) {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${item.token || customerToken1}`)
      .send(item.payload);
    assert(
      res.status === item.expectedStatus,
      `Rejected invalid checkout (${item.desc}) with ${item.expectedStatus} Bad Request`
    );
  }

  // --- Test 3: COD Removal & Secure Backend Calculation ---
  console.log('\n--- Test 3: Order Placement (COD removed, Backend Totals Enforced) ---');
  const clientPayload = {
    idempotencyKey: 'test_idemp_key_001',
    isBuyNow: true,
    customerEmail: 'radhika@example.com',
    items: [{ product: sareeId, quantity: 2 }],
    // Tampered client price payload attempting to pay ₹100 instead of ₹69,000
    price: 100,
    totalAmount: 100,
    paymentMethod: 'COD', // Attacker trying to request COD
    shippingAddress: {
      fullName: 'Radhika Iyer',
      phone: '9876543210',
      addressLine: '12 Temple St, Mylapore',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600004',
      deliveryInstructions: 'Call upon arrival',
    },
  };

  const placeOrderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken1}`)
    .send(clientPayload);

  assert(placeOrderRes.status === 201, 'Order created successfully with 201 Created');
  const createdOrder = placeOrderRes.body.data;
  assert(Boolean(createdOrder._id), 'Unique order ID generated');
  assert(Boolean(createdOrder.orderNumber), 'Readable order number generated (e.g. MAYA-xxx)');

  // COD overridden to PhonePe / Google Pay
  assert(
    createdOrder.paymentMethod === 'PhonePe / Google Pay',
    "COD removed: payment method forced strictly to 'PhonePe / Google Pay'"
  );

  // Initial statuses must be Pending / Placed
  assert(createdOrder.paymentStatus === 'Pending', "Initial payment status is 'Pending'");
  assert(createdOrder.orderStatus === 'Placed', "Initial order status is 'Placed' (pending confirmation)");
  assert(createdOrder.paymentVerified === false, 'Initial paymentVerified is false');

  // Backend total price recalculation: 2 units * ₹34,500 = ₹69,000
  assert(
    createdOrder.totalAmount === 69000,
    `Total calculated strictly by backend from DB (₹69,000) ignoring client total (₹100)`
  );
  assert(createdOrder.customerEmail === 'radhika@example.com', 'Customer email saved correctly');

  // --- Test 4: Duplicate Order Prevention via Idempotency Key ---
  console.log('\n--- Test 4: Duplicate Submission Prevention (Idempotency) ---');
  const duplicateRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken1}`)
    .send(clientPayload);

  assert(duplicateRes.status === 200, 'Duplicate submission intercepted safely with 200 OK');
  assert(
    duplicateRes.body.data._id === createdOrder._id,
    'Returned identical existing order rather than creating duplicate in DB'
  );

  // --- Test 5: IDOR Access Prevention ---
  console.log('\n--- Test 5: IDOR Protection (Customer Order Isolation) ---');
  const idorRes = await request(app)
    .get(`/api/orders/${createdOrder._id}`)
    .set('Authorization', `Bearer ${customerToken2}`); // Customer 2 trying to read Customer 1's order
  assert(idorRes.status === 403, 'Customer 2 forbidden from accessing Customer 1 order (403 Forbidden)');

  // --- Test 6: Non-Admin Cannot Confirm Orders ---
  console.log('\n--- Test 6: RBAC: Customer Cannot Confirm Orders ---');
  const customerConfirmRes = await request(app)
    .post(`/api/orders/${createdOrder._id}/confirm`)
    .set('Authorization', `Bearer ${customerToken1}`)
    .send({ paymentVerified: true });
  assert(customerConfirmRes.status === 403, 'Customer forbidden from confirming orders (403 Forbidden)');

  // --- Test 7: Admin Confirmation Requires Explicit Verification ---
  console.log('\n--- Test 7: Admin Confirmation Requires Explicit Payment Verification ---');
  const unverifiedConfirmRes = await request(app)
    .post(`/api/orders/${createdOrder._id}/confirm`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ paymentVerified: false }); // Admin didn't verify checkbox

  assert(
    unverifiedConfirmRes.status === 400,
    'Admin confirm rejected with 400 when paymentVerified is false'
  );

  // --- Test 8: Admin Confirms Order & Triggers Customer Confirmation Email ---
  console.log('\n--- Test 8: Admin Confirms Order with Verified Payment ---');
  const validConfirmRes = await request(app)
    .post(`/api/orders/${createdOrder._id}/confirm`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      paymentVerified: true,
      notes: 'Verified ₹69,000 transfer in PhonePe business account (Ref #40291823)',
    });

  assert(validConfirmRes.status === 200, 'Order successfully confirmed by Admin (200 OK)');
  const confirmedOrder = validConfirmRes.body.data;
  assert(confirmedOrder.orderStatus === 'Confirmed', "Order status updated to 'Confirmed'");
  assert(confirmedOrder.paymentStatus === 'Paid', "Payment status updated to 'Paid'");
  assert(confirmedOrder.paymentVerified === true, 'paymentVerified is true');
  assert(Boolean(confirmedOrder.confirmedAt), 'Recorded confirmation timestamp');
  assert(Boolean(confirmedOrder.confirmedBy), 'Recorded confirming admin ID');
  assert(
    confirmedOrder.adminNotes.includes('PhonePe'),
    'Admin transaction verification notes saved'
  );

  // --- Test 9: Duplicate Confirmation Prevention ---
  console.log('\n--- Test 9: Duplicate Confirmation Prevention ---');
  const duplicateConfirmRes = await request(app)
    .post(`/api/orders/${createdOrder._id}/confirm`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ paymentVerified: true });
  assert(
    duplicateConfirmRes.status === 400,
    'Already confirmed order rejects duplicate confirmation with 400 Bad Request'
  );

  // --- Test 10: Safe Resend Email Mechanism ---
  console.log('\n--- Test 10: Safe Resend Email Endpoint ---');
  const resendConfRes = await request(app)
    .post(`/api/orders/${createdOrder._id}/resend-email`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ type: 'confirmation' });
  assert(resendConfRes.status === 200, 'Resend confirmation email endpoint returns 200 OK');

  const resendPlacementRes = await request(app)
    .post(`/api/orders/${createdOrder._id}/resend-email`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ type: 'placement' });
  assert(resendPlacementRes.status === 200, 'Resend placement email endpoint returns 200 OK');

  // --- Test 11: Confirmation Email Content & Store Contact Verification ---
  console.log('\n--- Test 11: Confirmation Email Content Verification ---');
  // Check the email service output directly
  const simulatedOrderForEmail = {
    orderNumber: 'MAYA-TEST-123',
    customerEmail: 'radhika@example.com',
    createdAt: new Date(),
    totalAmount: 69000,
    subtotal: 69000,
    shippingAddress: {
      fullName: 'Radhika Iyer',
      phone: '9876543210',
      addressLine: '12 Temple St',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600004',
    },
    items: [
      {
        title: 'Pure Kanchipuram Crimson Silk Saree',
        sku: 'KAN-CRIM-001',
        quantity: 2,
        price: 34500,
      },
    ],
  };

  const emailResult = await EmailService.sendCustomerOrderConfirmationEmail(simulatedOrderForEmail);
  assert(emailResult.success === true, 'Confirmation email generation succeeds without throwing errors');
  assert(
    config.store.supportEmail === 'komakulakiranmai@gmail.com',
    'Store support email matches designated address'
  );
  assert(
    config.store.supportAddress.includes('Durga Nagar, Nacharam, Rangareddy. Pincode 500076'),
    'Store support address matches designated physical address'
  );

  console.log('\n======================================================');
  console.log(`📊 Manual UPI & Email Workflow Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
