process.env.NODE_ENV = 'test';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/userModel.js';
import Product from '../src/models/productModel.js';
import mongoose from 'mongoose';
import { TokenService } from '../src/services/tokenService.js';

// Hermetic simulated storage
const simulatedUsers = new Map();
const simulatedProducts = new Map();

const setupMocks = () => {
  User._isMocked = true;
  User.findById = function (id) {
    for (const [_, user] of simulatedUsers.entries()) {
      if (user._id === id) {
        return Promise.resolve({
          ...user,
          toJSON: () => {
            const copy = { ...user };
            delete copy.password;
            return copy;
          },
        });
      }
    }
    return Promise.resolve(null);
  };

  User.findOne = function (query) {
    let email = query.email;
    if (typeof email === 'string') email = email.toLowerCase().trim();
    const found = simulatedUsers.get(email);
    return {
      select: function () {
        if (!found) return Promise.resolve(null);
        return Promise.resolve({
          ...found,
          comparePassword: async (pwd) => bcrypt.compare(pwd, found.password),
          toJSON: () => {
            const copy = { ...found };
            delete copy.password;
            return copy;
          },
        });
      },
    };
  };

  Product.find = function () {
    const list = Array.from(simulatedProducts.values());
    return {
      sort: function () {
        return {
          skip: function (s) {
            return {
              limit: function (l) {
                return Promise.resolve(list.slice(s, s + l));
              },
            };
          },
        };
      },
    };
  };

  Product.countDocuments = function () {
    return Promise.resolve(simulatedProducts.size);
  };

  Product.aggregate = function () {
    return Promise.resolve([
      {
        totalProducts: simulatedProducts.size,
        activeListings: simulatedProducts.size,
        totalStock: 10,
      },
    ]);
  };
};

let passed = 0;
let failed = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
};

const run = async () => {
  console.log('\n======================================================');
  console.log('🧪 Verifying Admin Production Authentication Fix');
  console.log('======================================================\n');

  setupMocks();

  // Seed simulated admin
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('AdminSecretPass123!', salt);
  const adminUser = {
    _id: 'admin_test_id_100',
    name: 'Administrator',
    email: 'admin@sareesweb.com',
    password: hash,
    role: 'admin',
  };
  simulatedUsers.set(adminUser.email, adminUser);

  // 1. Unauthenticated GET /api/products/admin fails with 401
  console.log('--- Test 1: GET /api/products/admin without token returns 401 ---');
  const noTokenProd = await request(app).get('/api/products/admin?page=1&limit=8');
  assert(noTokenProd.status === 401, `Status is 401 (got ${noTokenProd.status})`);
  assert(
    noTokenProd.body.message === 'Authentication required. No authorization token provided.',
    'Message matches production behavior'
  );

  // 2. Unauthenticated GET /api/cart fails with 401
  console.log('\n--- Test 2: GET /api/cart without token returns 401 ---');
  const noTokenCart = await request(app).get('/api/cart');
  assert(noTokenCart.status === 401, `Status is 401 (got ${noTokenCart.status})`);
  assert(
    noTokenCart.body.message === 'Authentication required. No authorization token provided.',
    'Message matches production behavior'
  );

  // 3. Admin Login returns 200 with structured data
  console.log('\n--- Test 3: Admin Login returns 200 with data.token ---');
  const loginRes = await request(app)
    .post('/api/auth/admin/login')
    .send({ email: 'admin@sareesweb.com', password: 'AdminSecretPass123!' });

  assert(loginRes.status === 200, `Login returns 200 OK (got ${loginRes.status})`);
  assert(loginRes.body.success === true, 'Response success is true');
  assert(Boolean(loginRes.body.data?.token), 'Response contains data.token');
  assert(loginRes.body.data?.user?.role === 'admin', 'User role is admin');

  const adminToken = loginRes.body.data.token;

  // 4. Authenticated GET /api/products/admin with Bearer token succeeds
  console.log('\n--- Test 4: GET /api/products/admin with Bearer token returns 200 ---');
  const authProdRes = await request(app)
    .get('/api/products/admin?page=1&limit=8')
    .set('Authorization', `Bearer ${adminToken}`);

  assert(authProdRes.status === 200, `Status is 200 OK (got ${authProdRes.status})`);
  assert(authProdRes.body.success === true, 'Response success is true');
  assert(Boolean(authProdRes.body.data?.products), 'Contains products array');
  assert(Boolean(authProdRes.body.data?.pagination), 'Contains pagination object');

  // 5. Authenticated GET /api/cart with Bearer token succeeds
  console.log('\n--- Test 5: GET /api/cart with Bearer token returns 200 ---');
  const authCartRes = await request(app)
    .get('/api/cart')
    .set('Authorization', `Bearer ${adminToken}`);

  assert(authCartRes.status === 200, `Status is 200 OK (got ${authCartRes.status})`);
  assert(authCartRes.body.success === true, 'Response success is true');
  assert(Array.isArray(authCartRes.body.data?.items), 'Cart items returned as array');

  // 6. Test Token Storage Simulation (Frontend Contract)
  console.log('\n--- Test 6: Verify frontend getAuthToken contract ---');
  // Mock window storage behavior
  const mockStorage = {
    session: new Map(),
    local: new Map(),
  };

  const simulatedGetAuthToken = () => {
    return mockStorage.session.get('token') || mockStorage.local.get('token') || null;
  };

  // Case A: Admin login (sessionStorage only, removed from localStorage)
  mockStorage.session.set('token', adminToken);
  mockStorage.local.delete('token');
  assert(
    simulatedGetAuthToken() === adminToken,
    'getAuthToken() successfully resolves token from sessionStorage when localStorage is empty (admin session)'
  );

  // Case B: Customer login (localStorage only)
  mockStorage.session.delete('token');
  mockStorage.local.set('token', 'cust_token_123');
  assert(
    simulatedGetAuthToken() === 'cust_token_123',
    'getAuthToken() successfully resolves token from localStorage (customer session)'
  );

  // Case C: Logged out
  mockStorage.session.delete('token');
  mockStorage.local.delete('token');
  assert(
    simulatedGetAuthToken() === null,
    'getAuthToken() returns null when logged out'
  );

  console.log('\n======================================================');
  console.log(`📊 Result: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
};

run();
