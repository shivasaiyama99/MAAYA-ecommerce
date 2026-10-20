process.env.NODE_ENV = 'test';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/userModel.js';
import Product from '../src/models/productModel.js';
import mongoose from 'mongoose';
import { TokenService } from '../src/services/tokenService.js';
import { CloudinaryService } from '../src/services/cloudinaryService.js';

// In-memory simulated storage for hermetic test execution
const simulatedUsers = new Map();
const simulatedProducts = new Map();

const setupMocks = () => {
  // Mock User
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

  // Mock Product
  Product.findOne = function (query) {
    if (query.sku) {
      for (const [_, prod] of simulatedProducts.entries()) {
        if (prod.sku === query.sku) {
          return Promise.resolve(prod);
        }
      }
      return Promise.resolve(null);
    }
    return Promise.resolve(null);
  };

  Product.create = async function (doc) {
    const id = new mongoose.Types.ObjectId().toString();
    const newDoc = {
      _id: id,
      title: doc.title,
      sku: doc.sku,
      slug: (doc.title + '-' + doc.sku).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: doc.description,
      category: doc.category || 'Silk',
      fabric: doc.fabric || 'Pure Silk',
      price: doc.price,
      stock: doc.stock,
      images: doc.images || [],
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        simulatedProducts.set(this._id, this);
        return this;
      },
      toJSON: function () {
        return { ...this };
      },
    };
    simulatedProducts.set(id, newDoc);
    return newDoc;
  };

  Product.findById = function (id) {
    const prod = simulatedProducts.get(id);
    if (!prod) return Promise.resolve(null);
    return Promise.resolve({
      ...prod,
      save: async function () {
        simulatedProducts.set(this._id, this);
        return this;
      },
      toJSON: function () {
        return { ...this };
      },
    });
  };

  Product.findByIdAndDelete = function (id) {
    const prod = simulatedProducts.get(id);
    simulatedProducts.delete(id);
    return Promise.resolve(prod);
  };

  Product.find = function (query) {
    let list = Array.from(simulatedProducts.values());
    if (query.category) {
      list = list.filter((p) => p.category === query.category);
    }
    if (query.isActive !== undefined) {
      list = list.filter((p) => p.isActive === query.isActive);
    }
    if (query.$or) {
      // Search
      const regex = query.$or[0].title;
      list = list.filter((p) => regex.test(p.title) || regex.test(p.sku));
    }

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

  Product.countDocuments = function (query) {
    let list = Array.from(simulatedProducts.values());
    if (query.category) list = list.filter((p) => p.category === query.category);
    if (query.isActive !== undefined) list = list.filter((p) => p.isActive === query.isActive);
    return Promise.resolve(list.length);
  };

  Product.aggregate = function () {
    let totalStock = 0;
    let activeListings = 0;
    const all = Array.from(simulatedProducts.values());
    for (const p of all) {
      totalStock += p.stock;
      if (p.isActive) activeListings++;
    }
    return Promise.resolve([
      {
        totalProducts: all.length,
        activeListings,
        totalStock,
      },
    ]);
  };
};

const runProductTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting Admin Product Management & CRUD Test Suite');
  console.log('======================================================\n');

  setupMocks();

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

  // Setup customer and admin tokens
  const customerId = 'cust_user_123';
  simulatedUsers.set('customer@sareesweb.com', {
    _id: customerId,
    name: 'Customer User',
    email: 'customer@sareesweb.com',
    role: 'customer',
  });
  const customerToken = TokenService.generateToken({
    id: customerId,
    email: 'customer@sareesweb.com',
    role: 'customer',
  });

  const adminId = 'admin_user_999';
  simulatedUsers.set('admin@sareesweb.com', {
    _id: adminId,
    name: 'Store Administrator',
    email: 'admin@sareesweb.com',
    role: 'admin',
  });
  const adminToken = TokenService.generateToken({
    id: adminId,
    email: 'admin@sareesweb.com',
    role: 'admin',
  });

  try {
    // 1. Unauthenticated Product Creation
    console.log('--- Test 1: Unauthenticated Product Creation Blocked ---');
    const unauthRes = await request(app)
      .post('/api/products')
      .send({ title: 'Test Saree', price: 5000, stock: 2 });

    assert(unauthRes.status === 401, `Status is 401 Unauthorized (got ${unauthRes.status})`);

    // 2. Customer Attempt to Create Product (RBAC)
    console.log('\n--- Test 2: Customer Creation Blocked (RBAC) ---');
    const custCreateRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Unauthorized Saree', price: 5000, stock: 2 });

    assert(custCreateRes.status === 403, `Status is 403 Forbidden (got ${custCreateRes.status})`);
    assert(
      custCreateRes.body.message.includes('Administrative privileges required'),
      'Backend middleware explicitly enforced requireAdmin'
    );

    // 3. Validation Failures (Negative Stock, Bad SKU)
    console.log('\n--- Test 3: Input Validation on Product Creation ---');
    const valRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'AB', // too short
        sku: 'invalid sku spaces',
        description: 'short',
        category: 'InvalidCategory',
        price: -50,
        stock: -2,
      });

    assert(valRes.status === 400, `Rejected with 400 Bad Request (got ${valRes.status})`);
    assert(valRes.body.errors?.length >= 4, 'Reports field validation errors for stock, price, title, SKU');

    // 4. Successful Product Creation
    console.log('\n--- Test 4: Successful Saree Creation by Admin ---');
    const validProduct = {
      title: 'Royal Kanjeevaram Silk Saree in Crimson Gold',
      sku: 'KANJ-CRIMSON-01',
      description: 'Handwoven pure mulberry silk with korvai gold-dipped silver zari borders.',
      category: 'Kanjivaram',
      fabric: 'Mulberry Silk',
      price: 24500,
      stock: 5,
      isActive: true,
      images: [
        {
          publicId: 'sarees/products/sample_kanj_1',
          url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
          isMain: true,
        },
      ],
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProduct);

    assert(createRes.status === 201, `Product created with 201 Created (got ${createRes.status})`);
    assert(createRes.body.data?.sku === 'KANJ-CRIMSON-01', 'SKU saved properly');
    assert(createRes.body.data?.price === 24500, 'Price saved in INR');
    assert(createRes.body.data?.stock === 5, 'Stock quantity saved');

    const createdId = createRes.body.data?._id;

    // 5. Duplicate SKU Prevention
    console.log('\n--- Test 5: Duplicate SKU Rejection ---');
    const dupSkuRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProduct);

    assert(dupSkuRes.status === 409, `Duplicate SKU rejected with 409 Conflict (got ${dupSkuRes.status})`);

    // 6. Create a Second Product for Filtering & Pagination Tests
    const prod2 = {
      title: 'Midnight Blue Banarasi Brocade Saree',
      sku: 'BAN-BLUE-02',
      description: 'Authentic Banarasi katan silk woven with antique golden zari jaal.',
      category: 'Banarasi',
      fabric: 'Katan Silk',
      price: 32000,
      stock: 3,
      isActive: true,
      images: [
        {
          publicId: 'sarees/products/sample_ban_2',
          url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb',
          isMain: true,
        },
      ],
    };

    const create2Res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(prod2);

    assert(create2Res.status === 201, 'Second product created');
    const createdId2 = create2Res.body.data?._id;

    // 7. Admin Product Listing & Dashboard Stats
    console.log('\n--- Test 7: GET /api/products/admin with Summary Stats ---');
    const listRes = await request(app)
      .get('/api/products/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    assert(listRes.status === 200, `Status is 200 OK (got ${listRes.status})`);
    assert(listRes.body.data?.products?.length === 2, 'Returns both created products');
    assert(listRes.body.data?.stats?.totalProducts === 2, 'Stats totalProducts is 2');
    assert(listRes.body.data?.stats?.totalStock === 8, 'Stats totalStock is 8 (5 + 3)');
    assert(listRes.body.data?.stats?.activeListings === 2, 'Stats activeListings is 2');

    // 8. Search & Filtering
    console.log('\n--- Test 8: Catalog Search & Category Filters ---');
    const searchRes = await request(app)
      .get('/api/products/admin?search=Banarasi')
      .set('Authorization', `Bearer ${adminToken}`);

    assert(searchRes.body.data?.products?.length === 1, 'Search query successfully filtered by title');
    assert(searchRes.body.data?.products[0]?.sku === 'BAN-BLUE-02', 'Found the Banarasi saree');

    const catRes = await request(app)
      .get('/api/products/admin?category=Kanjivaram')
      .set('Authorization', `Bearer ${adminToken}`);

    assert(catRes.body.data?.products?.length === 1, 'Category query successfully filtered Kanjivaram');

    // 9. Get Single Product by ID
    console.log('\n--- Test 9: GET /api/products/:id ---');
    const singleRes = await request(app).get(`/api/products/${createdId}`);
    assert(singleRes.status === 200, `Single product fetched with 200 OK (got ${singleRes.status})`);
    assert(singleRes.body.data?.title === validProduct.title, 'Matching product title');

    // 10. Update Product Listing (PATCH)
    console.log('\n--- Test 10: PATCH /api/products/:id ---');
    const updateRes = await request(app)
      .patch(`/api/products/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 26000,
        stock: 4,
        isActive: false,
      });

    assert(updateRes.status === 200, `Product updated with 200 OK (got ${updateRes.status})`);
    assert(updateRes.body.data?.price === 26000, 'Price updated to ₹26,000');
    assert(updateRes.body.data?.stock === 4, 'Stock updated to 4');
    assert(updateRes.body.data?.isActive === false, 'Status toggled to inactive');

    // 11. Image Upload Endpoint (Multer memory buffer to Cloudinary)
    console.log('\n--- Test 11: Image Upload via Backend Buffer ---');
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const uploadRes = await request(app)
      .post('/api/products/upload-image')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', validPngBuffer, {
        filename: 'saree_test.png',
        contentType: 'image/png',
      });

    assert(uploadRes.status === 201, `Image uploaded with 201 Created (got ${uploadRes.status})`);
    assert(Boolean(uploadRes.body.data?.url), 'Returns persistent Cloudinary image URL');
    assert(Boolean(uploadRes.body.data?.publicId), 'Returns persistent image public ID');

    // Clean up test image from Cloudinary if real upload
    if (uploadRes.body.data?.publicId) {
      await CloudinaryService.deleteImage(uploadRes.body.data.publicId).catch(() => {});
    }

    // 12. Delete Product
    console.log('\n--- Test 12: DELETE /api/products/:id ---');
    const deleteRes = await request(app)
      .delete(`/api/products/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert(deleteRes.status === 200, `Product deleted with 200 OK (got ${deleteRes.status})`);

    const verifyDeleted = await request(app).get(`/api/products/${createdId}`);
    assert(verifyDeleted.status === 404, 'Subsequent GET returns 404 Not Found');

    console.log('\n======================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('💥 Test suite runner error:', err);
    process.exit(1);
  }
};

runProductTests();
