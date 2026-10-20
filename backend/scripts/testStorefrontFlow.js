/**
 * End-to-End Storefront Flow & Live Catalog Integration Test
 * Verifies:
 * 1. Admin login & product listing creation
 * 2. Immediate appearance of newly added product on public customer storefront without redeployment
 * 3. Customer registration, product discovery & PDP retrieval
 * 4. Shopping cart checkout, order confirmation, and order history
 * 5. Automatic inventory deduction reflecting on PDP & storefront
 * 6. Admin status toggle (isActive: false) instantly hiding product from storefront
 */

import request from 'supertest';
import app from '../src/app.js';
import dotenv from 'dotenv';
dotenv.config();

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

async function runStorefrontFlowTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Storefront & Admin End-to-End Integration Suite');
  console.log('======================================================\n');

  // --- Step 1: Admin Authentication ---
  console.log('--- Step 1: Admin Authentication ---');
  const adminRes = await request(app)
    .post('/api/auth/admin/login')
    .send({
      email: process.env.ADMIN_EMAIL || 'admin@sareesweb.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@Sarees2026',
    });

  assert(adminRes.status === 200, `Admin logged in with 200 OK (got ${adminRes.status})`);
  const adminToken = adminRes.body?.data?.token;
  assert(!!adminToken, 'Admin JWT token received');

  // --- Step 2: Admin Creates a New Saree Listing ---
  console.log('\n--- Step 2: Admin Creates a New Saree Listing ---');
  const newSareePayload = {
    title: 'Emerald Green Floral Tissue Organza Drape',
    sku: `ORG-FLOW-${Date.now().toString().slice(-4)}`,
    description: 'Lightweight pure organza silk with intricate scalloped floral embroidery and gold badla zari border.',
    category: 'Organza',
    fabric: 'Pure Organza Silk',
    price: 22400,
    stock: 5,
    isActive: true,
    images: [
      {
        publicId: 'sarees/org_test_1',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        alt: 'Emerald Green Organza Saree',
        isMain: true,
      },
    ],
  };

  const createRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(newSareePayload);

  assert(createRes.status === 201, `Saree created with 201 Created (got ${createRes.status})`);
  const createdSaree = createRes.body?.data;
  const createdId = createdSaree?._id;
  assert(!!createdId, `Product created with ID: ${createdId}`);
  assert(createdSaree?.price === 22400, 'Price saved accurately as ₹22,400');
  assert(createdSaree?.stock === 5, 'Initial stock saved as 5 units');

  // --- Step 3: Immediate Live Appearance on Public Customer Storefront ---
  console.log('\n--- Step 3: Immediate Live Appearance on Public Storefront ---');
  const publicShopRes = await request(app)
    .get('/api/products?category=Organza');

  assert(publicShopRes.status === 200, `Public /api/products returns 200 OK (got ${publicShopRes.status})`);
  const publicProducts = publicShopRes.body?.data?.products || [];
  const foundInPublic = publicProducts.find((p) => p._id.toString() === createdId.toString());

  assert(!!foundInPublic, 'Newly uploaded saree appears IMMEDIATELY in public storefront without redeployment');
  assert(foundInPublic?.title === newSareePayload.title, 'Matching public product title');
  assert(foundInPublic?.category === 'Organza', 'Matching category filter');
  assert(foundInPublic?.stock === 5, 'Available stock is 5');

  // --- Step 4: Customer Registration & PDP Retrieval ---
  console.log('\n--- Step 4: Customer Registration & PDP Retrieval ---');
  const customerEmail = `customer_${Date.now()}@shoppers.com`;
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Priya Mukherjee',
      email: customerEmail,
      phone: '9830012345',
      password: 'CustomerPass123!',
      confirmPassword: 'CustomerPass123!',
    });

  assert(registerRes.status === 201, `Customer registered with 201 Created (got ${registerRes.status})`);
  const customerToken = registerRes.body?.data?.token;
  assert(!!customerToken, 'Customer JWT token received');

  // Fetch PDP
  const pdpRes = await request(app)
    .get(`/api/products/${createdId}`);

  assert(pdpRes.status === 200, `Product Details Page (PDP) loads with 200 OK (got ${pdpRes.status})`);
  assert(pdpRes.body?.data?.fabric === 'Pure Organza Silk', 'Fabric specifications returned');
  assert(pdpRes.body?.data?.images?.length >= 1, 'Product imagery gallery present');

  // --- Step 5: Customer Places an Order ---
  console.log('\n--- Step 5: Customer Places an Order (2 units) ---');
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      items: [
        {
          product: createdId,
          title: newSareePayload.title,
          sku: newSareePayload.sku,
          price: 22400,
          quantity: 2,
          image: newSareePayload.images[0].url,
        },
      ],
      shippingAddress: {
        fullName: 'Priya Mukherjee',
        phone: '9830012345',
        addressLine: 'Flat 4B, Heritage Mansions, Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
      },
      paymentMethod: 'COD',
    });

  assert(orderRes.status === 201, `Order placed with 201 Created (got ${orderRes.status})`);
  const orderData = orderRes.body?.data;
  assert(!!orderData?.orderNumber, `Order Number generated: ${orderData?.orderNumber}`);
  assert(orderData?.totalAmount === 44800, `Total amount calculated correctly: ₹44,800 (2 × ₹22,400)`);
  assert(orderData?.orderStatus === 'Placed' || orderData?.orderStatus === 'Confirmed', 'Order status is Placed or Confirmed');

  // --- Step 6: Customer Order History Verification ---
  console.log('\n--- Step 6: Customer Order History Verification ---');
  const historyRes = await request(app)
    .get('/api/orders/my-orders')
    .set('Authorization', `Bearer ${customerToken}`);

  assert(historyRes.status === 200, `My Orders fetched with 200 OK (got ${historyRes.status})`);
  const myOrders = historyRes.body?.data || [];
  const foundOrder = myOrders.find((o) => o.orderNumber === orderData.orderNumber);
  assert(!!foundOrder, 'Confirmed order appears in Customer Order History');
  assert(foundOrder?.items?.[0]?.title === newSareePayload.title, 'Order contains the correct saree title');

  // --- Step 7: Live Inventory Deduction on PDP ---
  console.log('\n--- Step 7: Live Inventory Deduction on PDP ---');
  const updatedPdpRes = await request(app)
    .get(`/api/products/${createdId}`);

  assert(updatedPdpRes.status === 200, 'PDP re-queried successfully');
  const updatedStock = updatedPdpRes.body?.data?.stock;
  assert(updatedStock === 3, `Stock decremented from 5 to 3 after purchasing 2 units (got ${updatedStock})`);

  // --- Step 8: Admin Toggles Status to Inactive ---
  console.log('\n--- Step 8: Admin Inactivates Listing & Verifies Storefront Removal ---');
  const deactivateRes = await request(app)
    .patch(`/api/products/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isActive: false });

  assert(deactivateRes.status === 200, `Product updated to isActive: false with 200 OK (got ${deactivateRes.status})`);

  const publicShopAfterDeactivate = await request(app)
    .get('/api/products?category=Organza');

  const afterProducts = publicShopAfterDeactivate.body?.data?.products || [];
  const stillInPublic = afterProducts.find((p) => p._id.toString() === createdId.toString());
  assert(!stillInPublic, 'Inactive product is immediately hidden from customer-facing storefront');

  // Clean up: delete test product
  await request(app)
    .delete(`/api/products/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  console.log('\n======================================================');
  console.log(`📊 Storefront Flow Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStorefrontFlowTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
