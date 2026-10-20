import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/userModel.js';
import { config } from '../src/config/env.js';

// In-memory simulated storage for hermetic test execution
const simulatedUsers = new Map();

// Setup in-memory mock interceptors for User model when disconnected
const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalFindById = User.findById;

const setupMockStore = () => {
  User._isMocked = true;
  User.findOne = function (query) {
    let email = query.email;
    if (typeof email === 'string') {
      email = email.toLowerCase().trim();
    }
    const found = simulatedUsers.get(email);
    return {
      select: function (fields) {
        if (!found) return Promise.resolve(null);
        return Promise.resolve({
          ...found,
          comparePassword: async function (pwd) {
            return await bcrypt.compare(pwd, found.password);
          },
          toJSON: function () {
            const copy = { ...found };
            delete copy.password;
            return copy;
          },
        });
      },
      then: function (resolve) {
        if (!found) return resolve(null);
        return resolve({
          ...found,
          comparePassword: async function (pwd) {
            return await bcrypt.compare(pwd, found.password);
          },
          toJSON: function () {
            const copy = { ...found };
            delete copy.password;
            return copy;
          },
        });
      },
    };
  };

  User.create = async function (doc) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(doc.password, salt);
    const id = 'mock_id_' + Math.random().toString(36).substring(2, 9);
    const userDoc = {
      _id: id,
      name: doc.name,
      email: doc.email.toLowerCase().trim(),
      phone: doc.phone || '',
      password: hashedPassword,
      role: doc.role || 'customer',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    simulatedUsers.set(userDoc.email, userDoc);
    return {
      ...userDoc,
      comparePassword: async function (pwd) {
        return await bcrypt.compare(pwd, userDoc.password);
      },
      toJSON: function () {
        const copy = { ...userDoc };
        delete copy.password;
        return copy;
      },
    };
  };

  User.findById = function (id) {
    for (const [_, user] of simulatedUsers.entries()) {
      if (user._id === id) {
        return Promise.resolve({
          ...user,
          comparePassword: async function (pwd) {
            return await bcrypt.compare(pwd, user.password);
          },
          toJSON: function () {
            const copy = { ...user };
            delete copy.password;
            return copy;
          },
        });
      }
    }
    return Promise.resolve(null);
  };
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting End-to-End Authentication Security Test Suite');
  console.log('======================================================\n');

  setupMockStore();

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

  try {
    // 1. Successful Customer Registration
    console.log('--- Test 1: Customer Registration ---');
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Deepika Rao',
        email: 'deepika@sareesweb.com',
        phone: '+919876543210',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    assert(regRes.status === 201, `Status code is 201 Created (got ${regRes.status})`);
    assert(Boolean(regRes.body.data?.token), 'Signed JWT token returned');
    assert(regRes.body.data?.user?.role === 'customer', "User role defaults strictly to 'customer'");
    assert(regRes.body.data?.user?.password === undefined, 'Password hash excluded from response');

    const customerToken = regRes.body.data?.token;

    // 2. Prevent Role Escalation via Registration Body
    console.log('\n--- Test 2: Role Escalation Attack Prevention ---');
    const exploitRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker User',
        email: 'hacker@sareesweb.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'admin',
        isAdmin: true,
      });

    assert(exploitRes.status === 201, 'Registration processed');
    assert(
      exploitRes.body.data?.user?.role === 'customer',
      "Attacker's attempt to assign role: 'admin' was ignored and forced to 'customer'"
    );

    // 3. Duplicate Email Registration Handling
    console.log('\n--- Test 3: Duplicate Email Registration ---');
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Deepika Clone',
        email: 'deepika@sareesweb.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    assert(dupRes.status === 409, `Status code is 409 Conflict (got ${dupRes.status})`);
    assert(
      dupRes.body.message.includes('already exists'),
      'Clear conflict message returned without revealing sensitive system details'
    );

    // 4. Registration Validation Errors
    console.log('\n--- Test 4: Registration Input Validation ---');
    const valRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
      });

    assert(valRes.status === 400, `Validation fails with 400 Bad Request (got ${valRes.status})`);
    assert(valRes.body.errors?.length >= 3, 'Reports specific field validation errors');

    // 5. Successful Customer Login
    console.log('\n--- Test 5: Successful Customer Login ---');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'deepika@sareesweb.com',
        password: 'Password123!',
      });

    assert(loginRes.status === 200, `Login returns 200 OK (got ${loginRes.status})`);
    assert(Boolean(loginRes.body.data?.token), 'Signed JWT token returned upon valid login');
    assert(loginRes.body.data?.user?.email === 'deepika@sareesweb.com', 'Matches customer email');

    // 6. Incorrect Password Login
    console.log('\n--- Test 6: Incorrect Password Login ---');
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'deepika@sareesweb.com',
        password: 'WrongPassword!',
      });

    assert(wrongPassRes.status === 401, `Status code is 401 Unauthorized (got ${wrongPassRes.status})`);
    assert(
      wrongPassRes.body.message === 'Invalid email or password.',
      'Generic authentication error prevents password enumeration'
    );

    // 7. Non-existent User Login
    console.log('\n--- Test 7: Non-existent User Login ---');
    const noUserRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@sareesweb.com',
        password: 'Password123!',
      });

    assert(noUserRes.status === 401, `Status code is 401 Unauthorized (got ${noUserRes.status})`);
    assert(
      noUserRes.body.message === 'Invalid email or password.',
      'Generic authentication error prevents account enumeration'
    );

    // 8. Protected Route: GET /api/auth/me with Customer Token
    console.log('\n--- Test 8: Protected Route Access (/api/auth/me) ---');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);

    assert(meRes.status === 200, `Status code is 200 OK (got ${meRes.status})`);
    assert(meRes.body.data?.user?.name === 'Deepika Rao', 'Loads verified user from database');
    assert(meRes.body.data?.user?.role === 'customer', 'User role is customer');

    // 9. Protected Route with Invalid / Tampered Token
    console.log('\n--- Test 9: Tampered Token Access ---');
    const tamperedRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.tampered.token');

    assert(tamperedRes.status === 401, `Rejected with 401 Unauthorized (got ${tamperedRes.status})`);

    // 10. Protected Route with Expired Token
    console.log('\n--- Test 10: Expired Token Access ---');
    const expiredToken = jwt.sign(
      { id: 'mock_id_expired', role: 'customer', email: 'expired@sareesweb.com' },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );
    const expiredRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    assert(expiredRes.status === 401, `Expired token rejected with 401 Unauthorized (got ${expiredRes.status})`);

    // 11. Customer Attempting Admin Login (/api/auth/admin/login)
    console.log('\n--- Test 11: Customer Attempting Admin Login ---');
    const custAdminLogin = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: 'deepika@sareesweb.com',
        password: 'Password123!',
      });

    assert(custAdminLogin.status === 403, `Rejected with 403 Forbidden (got ${custAdminLogin.status})`);
    assert(
      custAdminLogin.body.message.includes('Insufficient administrative privileges'),
      'Customer account explicitly denied administrative login'
    );

    // 12. Bootstrap & Test Admin Login
    console.log('\n--- Test 12: Admin Login & Authorization ---');
    // Pre-create simulated admin user
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashed = await bcrypt.hash('SuperAdminSecretPass123!', adminSalt);
    const adminId = 'mock_admin_1';
    simulatedUsers.set('admin@sareesweb.com', {
      _id: adminId,
      name: 'Store Administrator',
      email: 'admin@sareesweb.com',
      password: adminHashed,
      role: 'admin',
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: 'admin@sareesweb.com',
        password: 'SuperAdminSecretPass123!',
      });

    assert(adminLoginRes.status === 200, `Admin login returns 200 OK (got ${adminLoginRes.status})`);
    assert(adminLoginRes.body.data?.user?.role === 'admin', 'Admin user authenticated with role: admin');
    const adminToken = adminLoginRes.body.data?.token;

    // 13. Customer Accessing Admin-Protected Route (/api/auth/admin-check)
    console.log('\n--- Test 13: Customer Access to requireAdmin Route ---');
    const custAdminCheck = await request(app)
      .get('/api/auth/admin-check')
      .set('Authorization', `Bearer ${customerToken}`);

    assert(custAdminCheck.status === 403, `Customer rejected with 403 Forbidden (got ${custAdminCheck.status})`);
    assert(
      custAdminCheck.body.message.includes('Administrative privileges required'),
      'requireAdmin middleware blocked customer access'
    );

    // 14. Admin Accessing Admin-Protected Route (/api/auth/admin-check)
    console.log('\n--- Test 14: Admin Access to requireAdmin Route ---');
    const adminCheckRes = await request(app)
      .get('/api/auth/admin-check')
      .set('Authorization', `Bearer ${adminToken}`);

    assert(adminCheckRes.status === 200, `Admin permitted with 200 OK (got ${adminCheckRes.status})`);
    assert(adminCheckRes.body.data?.role === 'admin', 'Admin authorization verified');

    console.log('\n======================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Test suite runner error:', error);
    process.exit(1);
  }
};

runTests();
