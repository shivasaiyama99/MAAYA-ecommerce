import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

export const isEmailConfigured = () => {
  if (!process.env.EMAIL_PASS) {
    dotenv.config();
  }
  const user = (process.env.EMAIL_USER || config.email.user || '').trim();
  const pass = (process.env.EMAIL_PASS || config.email.pass || '').replace(/\s+/g, '').trim();
  return Boolean(user && pass);
};

const getTransporter = () => {
  if (!process.env.EMAIL_PASS) {
    dotenv.config();
  }
  const user = (process.env.EMAIL_USER || config.email.user || '').trim();
  const pass = (process.env.EMAIL_PASS || config.email.pass || '').replace(/\s+/g, '').trim();

  if (transporter) return transporter;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });
  }
  return transporter;
};

const handleUnconfiguredEmail = (type, orderNumber, recipient) => {
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    logger.info(`✉️ [Test Mode] Simulated ${type} for ${orderNumber} to ${recipient}`);
    return { success: true, simulated: true };
  }
  logger.warn(`⚠️ [Email Not Sent] ${type} for ${orderNumber} to ${recipient}: EMAIL_PASS is empty in backend/.env`);
  return {
    success: false,
    simulated: true,
    error: 'EMAIL_PASS is not configured in backend/.env. Real email could not be delivered to Gmail.',
  };
};

const formatINR = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN');
};

const renderItemsTableHtml = (items = []) => {
  return items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e7e5e4;">
        <td style="padding: 12px 8px; font-size: 13px; color: #1c1917;">
          <strong>${item.title}</strong>
          <br/><span style="color: #78716c; font-size: 11px;">SKU: ${item.sku || 'N/A'}</span>
        </td>
        <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #1c1917;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #1c1917;">
          ₹${formatINR(item.price)}
        </td>
        <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #701a23;">
          ₹${formatINR(Number(item.price) * Number(item.quantity))}
        </td>
      </tr>
    `
    )
    .join('');
};

export class EmailService {
  /**
   * Email A: Send new order alert to store owner / admin
   * Subject: New Order Received – MAAYA | Order #<ORDER_ID>
   */
  static async sendAdminOrderNotification(order) {
    const recipient = config.email.notificationRecipient || config.adminEmail;
    const orderItemsHtml = renderItemsTableHtml(order.items || []);

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f5; margin: 0; padding: 20px; color: #292524; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #701a23; padding: 24px; text-align: center; color: #fef3c7; }
          .header h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
          .header p { margin: 4px 0 0; font-size: 12px; letter-spacing: 1px; color: #fde68a; text-transform: uppercase; }
          .content { padding: 24px; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .action-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #f5f5f4; padding-bottom: 4px; }
          .info-box { background: #fbfbf9; border: 1px solid #f0ede6; border-radius: 10px; padding: 14px; margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #78716c; background: #fafaf9; }
          .total-box { margin-top: 16px; text-align: right; padding-top: 12px; border-top: 2px solid #e7e5e4; font-size: 15px; font-weight: bold; color: #701a23; }
          .footer { text-align: center; padding: 16px; font-size: 11px; color: #a8a29e; background: #fafaf9; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MAYA COLLECTIONS</h1>
            <p>Admin Order Management • New Booking Alert</p>
          </div>
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span class="badge">Awaiting Admin Confirmation</span>
              <span style="font-weight: bold; font-size: 14px; color: #701a23;">#${order.orderNumber}</span>
            </div>

            <!-- Crucial Admin Action Banner -->
            <div class="action-box">
              <strong>⚠️ Verification Required Before Confirmation:</strong><br/>
              Customer selected <strong>PhonePe / Google Pay manual transfer</strong>. Please check your PhonePe or Google Pay business account to verify the actual receipt of <strong>₹${formatINR(order.totalAmount)}</strong> before confirming this order in the admin portal.
            </div>

            <div class="section-title">Order Summary & Status</div>
            <div class="info-box">
              <strong>Order ID:</strong> ${order.orderNumber}<br/>
              <strong>Order Date:</strong> ${orderDate}<br/>
              <strong>Payment Method:</strong> PhonePe / Google Pay manual transfer<br/>
              <strong>Payment Status:</strong> <span style="color: #b45309; font-weight: bold;">Pending verification</span><br/>
              <strong>Order Status:</strong> <span style="color: #701a23; font-weight: bold;">Awaiting admin confirmation</span>
            </div>

            <div class="section-title">Customer Information</div>
            <div class="info-box">
              <strong>Customer Name:</strong> ${order.shippingAddress?.fullName || 'N/A'}<br/>
              <strong>Phone Number:</strong> <span style="font-size: 14px; color: #701a23; font-weight: bold;">${order.shippingAddress?.phone || 'N/A'}</span><br/>
              <strong>Customer Email:</strong> ${order.customerEmail || 'N/A'}
            </div>

            <div class="section-title">Complete Delivery Address</div>
            <div class="info-box">
              ${order.shippingAddress?.addressLine || ''}<br/>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - <strong>${order.shippingAddress?.pincode || ''}</strong><br/>
              ${order.shippingAddress?.deliveryInstructions ? `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e7e5e4; color: #b45309;"><strong>Instructions:</strong> ${order.shippingAddress.deliveryInstructions}</div>` : ''}
            </div>

            <div class="section-title">Ordered Sarees</div>
            <table>
              <thead>
                <tr>
                  <th>Saree / Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <div class="total-box">
              Subtotal: ₹${formatINR(order.subtotal || order.totalAmount)}<br/>
              <span style="font-size: 12px; color: #059669; font-weight: normal;">Handloom Express Shipping: Free</span><br/>
              <span style="font-size: 18px;">Total Payable: ₹${formatINR(order.totalAmount)}</span>
            </div>
          </div>
          <div class="footer">
            Maya Collections Staff Portal • Nacharam, Rangareddy • Support: ${config.store.supportPhone}
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
NEW ORDER RECEIVED – MAAYA | Order #${order.orderNumber}
======================================================
Order ID: ${order.orderNumber}
Date: ${orderDate}
Customer Name: ${order.shippingAddress?.fullName}
Phone: ${order.shippingAddress?.phone}
Email: ${order.customerEmail}
Delivery Address: ${order.shippingAddress?.addressLine}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}
Delivery Instructions: ${order.shippingAddress?.deliveryInstructions || 'None'}

Payment Method: PhonePe / Google Pay manual transfer
Payment Status: Pending verification
Order Status: Awaiting admin confirmation
Total Amount: ₹${formatINR(order.totalAmount)}

ITEMS:
${(order.items || []).map((i) => `- ${i.title} (SKU: ${i.sku || 'N/A'}, Qty: ${i.quantity}) @ ₹${formatINR(i.price)} = ₹${formatINR(Number(i.price) * Number(i.quantity))}`).join('\n')}

ACTION REQUIRED:
Please check your PhonePe or Google Pay account to verify receipt of ₹${formatINR(order.totalAmount)} before confirming this order in the admin portal.
    `.trim();

    if (!isEmailConfigured()) {
      return handleUnconfiguredEmail('Admin Order Alert', order.orderNumber, recipient);
    }

    try {
      const activeTransporter = getTransporter();
      const mailOptions = {
        from: `"MAAYA Collections Orders" <${config.email.user}>`,
        to: recipient,
        subject: `New Order Received – MAAYA | Order #${order.orderNumber}`,
        text: textContent,
        html: htmlContent,
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`✅ Admin order notification email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Failed to send admin order notification for ${order.orderNumber}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email B: Send order placement acknowledgement to customer
   * Subject: Order Placed Successfully – MAAYA | Order #<ORDER_ID>
   */
  static async sendCustomerOrderPlacementEmail(order) {
    const recipient = order.customerEmail;
    if (!recipient) {
      logger.warn(`Cannot send customer order placement email: Order ${order.orderNumber} has no customerEmail`);
      return { success: false, error: 'Customer email missing' };
    }

    const orderItemsHtml = renderItemsTableHtml(order.items || []);
    const upiId = config.payment.upiId;
    const upiName = config.payment.upiName || 'MAAYA Collections';

    const upiInstructionsHtml = upiId
      ? `
        <div style="background: #fdf2f8; border: 2px solid #db2777; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 11px; text-transform: uppercase; color: #9d174d; font-weight: bold; letter-spacing: 1px;">
            PhonePe / Google Pay Transfer Details
          </div>
          <div style="font-size: 16px; font-weight: bold; color: #831843; margin-top: 6px;">
            UPI ID: <span style="font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid #f472b6;">${upiId}</span>
          </div>
          <div style="font-size: 12px; color: #701a23; margin-top: 4px;">
            Payee Name: <strong>${upiName}</strong>
          </div>
          <div style="font-size: 12px; color: #500724; margin-top: 8px; line-height: 1.4;">
            Please transfer exactly <strong>₹${formatINR(order.totalAmount)}</strong> and include Order ID <strong>#${order.orderNumber}</strong> in the payment notes/remarks.
          </div>
        </div>
      `
      : `
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 12px; color: #92400e;">
          <strong>PhonePe / Google Pay Payment Transfer:</strong><br/>
          Please transfer ₹${formatINR(order.totalAmount)} via PhonePe or Google Pay. If you need our verified store UPI ID or QR code, please contact our support directly on WhatsApp at <strong>${config.store.supportPhone}</strong> or Email at <strong>${config.store.supportEmail}</strong>.
        </div>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f5; margin: 0; padding: 20px; color: #292524; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #701a23; padding: 24px; text-align: center; color: #fef3c7; }
          .header h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
          .header p { margin: 4px 0 0; font-size: 11px; letter-spacing: 1px; color: #fde68a; text-transform: uppercase; }
          .content { padding: 24px; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .notice-box { background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 13px; color: #831843; line-height: 1.5; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #f5f5f4; padding-bottom: 4px; }
          .info-box { background: #fbfbf9; border: 1px solid #f0ede6; border-radius: 10px; padding: 14px; margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #78716c; background: #fafaf9; }
          .total-box { margin-top: 16px; text-align: right; padding-top: 12px; border-top: 2px solid #e7e5e4; font-size: 15px; font-weight: bold; color: #701a23; }
          .footer { text-align: center; padding: 16px; font-size: 11px; color: #a8a29e; background: #fafaf9; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MAYA COLLECTIONS</h1>
            <p>Handcrafted Sarees & Royal Jewellery</p>
          </div>
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span class="badge">Order Placed (Pending Confirmation)</span>
              <span style="font-weight: bold; font-size: 14px; color: #701a23;">#${order.orderNumber}</span>
            </div>

            <p style="font-size: 14px; margin-top: 0; line-height: 1.5;">
              Dear <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #44403c;">
              Thank you for choosing Maya Collections. Your order has been placed successfully in our system.
            </p>

            <!-- Important Status Notice -->
            <div class="notice-box">
              <strong>Order Status Notice:</strong><br/>
              Your order has been recorded, but is <strong>not yet confirmed</strong>. Our store administrator will verify receipt of payment in our PhonePe / Google Pay account and send you an official order confirmation email once verified.
            </div>

            <!-- Payment Instructions -->
            ${upiInstructionsHtml}

            <div class="section-title">Delivery Destination</div>
            <div class="info-box">
              <strong>${order.shippingAddress?.fullName}</strong><br/>
              ${order.shippingAddress?.addressLine}<br/>
              ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - <strong>${order.shippingAddress?.pincode}</strong><br/>
              Phone: ${order.shippingAddress?.phone}
            </div>

            <div class="section-title">Product Details</div>
            <table>
              <thead>
                <tr>
                  <th>Saree</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <div class="total-box">
              Subtotal: ₹${formatINR(order.subtotal || order.totalAmount)}<br/>
              <span style="font-size: 12px; color: #059669; font-weight: normal;">Express Handloom Delivery: Free</span><br/>
              <span style="font-size: 18px;">Total Order Amount: ₹${formatINR(order.totalAmount)}</span>
            </div>
          </div>
          <div class="footer">
            <strong>Maya Collections</strong> • Nacharam, Rangareddy<br/>
            Need assistance? WhatsApp: ${config.store.supportPhone} • Email: ${config.store.supportEmail}
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Order Placed Successfully – MAAYA | Order #${order.orderNumber}
============================================================
Dear ${order.shippingAddress?.fullName},

Thank you for choosing Maya Collections. Your order #${order.orderNumber} has been placed.

PLEASE NOTE:
Your order has been placed, but is not yet confirmed.
The store administrator will verify the receipt of your payment in our PhonePe / Google Pay account and send you a confirmation email once verified.

PAYMENT INSTRUCTIONS:
- Amount to transfer: ₹${formatINR(order.totalAmount)}
${upiId ? `- UPI ID: ${upiId}\n- Payee: ${upiName}` : `- Please contact WhatsApp: ${config.store.supportPhone} for UPI payment details`}
- Reference: Please mention Order #${order.orderNumber} in payment remarks.

DELIVERY ADDRESS:
${order.shippingAddress?.fullName}
${order.shippingAddress?.addressLine}
${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}
Phone: ${order.shippingAddress?.phone}

TOTAL AMOUNT: ₹${formatINR(order.totalAmount)}

ITEMS:
${(order.items || []).map((i) => `- ${i.title} (Qty: ${i.quantity}) @ ₹${formatINR(i.price)} = ₹${formatINR(Number(i.price) * Number(i.quantity))}`).join('\n')}

MAAYA Customer Support
Email: ${config.store.supportEmail}
Address: ${config.store.supportAddress}
    `.trim();

    if (!isEmailConfigured()) {
      return handleUnconfiguredEmail('Customer Order Placement Acknowledgement', order.orderNumber, recipient);
    }

    try {
      const activeTransporter = getTransporter();
      const mailOptions = {
        from: `"MAAYA Collections" <${config.email.user}>`,
        to: recipient,
        subject: `Order Placed Successfully – MAAYA | Order #${order.orderNumber}`,
        text: textContent,
        html: htmlContent,
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`✅ Customer placement email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Failed to send customer placement email for ${order.orderNumber}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email C: Send official order confirmation email to customer after payment verification
   * Subject: Your MAAYA Order Is Confirmed – Order #<ORDER_ID>
   */
  static async sendCustomerOrderConfirmationEmail(order) {
    const recipient = order.customerEmail;
    if (!recipient) {
      logger.warn(`Cannot send order confirmation email: Order ${order.orderNumber} has no customerEmail`);
      return { success: false, error: 'Customer email missing' };
    }

    const orderItemsHtml = renderItemsTableHtml(order.items || []);
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })
      : new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f5; margin: 0; padding: 20px; color: #292524; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #701a23; padding: 28px; text-align: center; color: #fef3c7; }
          .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
          .header p { margin: 4px 0 0; font-size: 11px; letter-spacing: 1px; color: #fde68a; text-transform: uppercase; }
          .content { padding: 26px; }
          .confirmed-hero { background: #f0fdf4; border: 2px solid #86efac; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 20px; }
          .confirmed-hero h2 { margin: 0 0 6px; font-size: 18px; color: #166534; }
          .confirmed-hero p { margin: 0; font-size: 13px; color: #15803d; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #f5f5f4; padding-bottom: 4px; }
          .info-box { background: #fbfbf9; border: 1px solid #f0ede6; border-radius: 10px; padding: 14px; margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #78716c; background: #fafaf9; }
          .total-box { margin-top: 16px; text-align: right; padding-top: 12px; border-top: 2px solid #e7e5e4; font-size: 15px; font-weight: bold; color: #701a23; }
          .support-card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 12px; color: #44403c; line-height: 1.6; }
          .footer { text-align: center; padding: 16px; font-size: 11px; color: #a8a29e; background: #fafaf9; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MAYA COLLECTIONS</h1>
            <p>Official Order Confirmation</p>
          </div>
          <div class="content">
            <!-- Confirmed Hero Banner -->
            <div class="confirmed-hero">
              <h2>Your order has been confirmed.</h2>
              <p>We have verified your payment. Your handloom drapes are now being lovingly prepared for dispatch.</p>
            </div>

            <p style="font-size: 14px; margin-top: 0;">
              Dear <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,
            </p>

            <div class="section-title">Order & Payment Verification</div>
            <div class="info-box">
              <strong>Order ID:</strong> #${order.orderNumber}<br/>
              <strong>Order Date:</strong> ${orderDate}<br/>
              <strong>Payment Status:</strong> <span style="color: #16a34a; font-weight: bold;">Verified (Paid via PhonePe / Google Pay)</span><br/>
              <strong>Order Status:</strong> <span style="color: #701a23; font-weight: bold;">Confirmed</span>
            </div>

            <div class="section-title">Delivery Address</div>
            <div class="info-box">
              <strong>${order.shippingAddress?.fullName}</strong> (${order.shippingAddress?.phone})<br/>
              ${order.shippingAddress?.addressLine}<br/>
              ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - <strong>${order.shippingAddress?.pincode}</strong>
            </div>

            <div class="section-title">Confirmed Saree Items</div>
            <table>
              <thead>
                <tr>
                  <th>Saree / Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <div class="total-box">
              Subtotal: ₹${formatINR(order.subtotal || order.totalAmount)}<br/>
              <span style="font-size: 12px; color: #059669; font-weight: normal;">Handloom Express Shipping: Free</span><br/>
              <span style="font-size: 18px;">Total Amount Paid: ₹${formatINR(order.totalAmount)}</span>
            </div>

            <!-- Mandatory Store Contact Details -->
            <div class="support-card">
              <strong style="font-size: 13px; color: #701a23;">MAAYA Customer Support</strong><br/>
              <strong>Email:</strong> komakulakiranmai@gmail.com<br/>
              <strong>Address:</strong> H.no:4-6-158/31A, Durga Nagar, Nacharam, Rangareddy. Pincode 500076<br/>
              <strong>WhatsApp:</strong> ${config.store.supportPhone}
            </div>
          </div>
          <div class="footer">
            Thank you for preserving India's royal handloom heritage with Maya Collections.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Your MAAYA Order Is Confirmed – Order #${order.orderNumber}
==========================================================
Dear ${order.shippingAddress?.fullName},

Your order has been confirmed.
We have verified your payment via PhonePe / Google Pay. Your handloom drape is being prepared for dispatch.

ORDER DETAILS:
Order ID: #${order.orderNumber}
Order Date: ${orderDate}
Payment Status: Verified (Paid via PhonePe / Google Pay)
Order Status: Confirmed

DELIVERY ADDRESS:
${order.shippingAddress?.fullName}
${order.shippingAddress?.addressLine}
${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}
Phone: ${order.shippingAddress?.phone}

ITEMS CONFIRMED:
${(order.items || []).map((i) => `- ${i.title} (Qty: ${i.quantity}) @ ₹${formatINR(i.price)} = ₹${formatINR(Number(i.price) * Number(i.quantity))}`).join('\n')}

Total Amount Paid: ₹${formatINR(order.totalAmount)}

MAAYA Customer Support
Email: komakulakiranmai@gmail.com
Address: H.no:4-6-158/31A, Durga Nagar, Nacharam, Rangareddy. Pincode 500076
WhatsApp: ${config.store.supportPhone}
    `.trim();

    if (!isEmailConfigured()) {
      return handleUnconfiguredEmail('Customer Order Confirmation', order.orderNumber, recipient);
    }

    try {
      const activeTransporter = getTransporter();
      const mailOptions = {
        from: `"MAAYA Collections" <${config.email.user}>`,
        to: recipient,
        subject: `Your MAAYA Order Is Confirmed – Order #${order.orderNumber}`,
        text: textContent,
        html: htmlContent,
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`✅ Customer confirmation email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Failed to send customer confirmation email for ${order.orderNumber}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Backward compatibility alias
   */
  static async sendOrderNotification(order) {
    return this.sendAdminOrderNotification(order);
  }

  /**
   * Send notification to store owner when a new customer registers
   */
  static async sendRegistrationNotification(user) {
    const recipient = config.email.notificationRecipient || config.adminEmail;
    const formattedDate = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f5; margin: 0; padding: 20px; color: #292524; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #701a23; padding: 24px; text-align: center; color: #fef3c7; }
          .header h1 { margin: 0; font-size: 20px; letter-spacing: 2px; }
          .header p { margin: 4px 0 0; font-size: 11px; letter-spacing: 1px; color: #fde68a; text-transform: uppercase; }
          .content { padding: 24px; }
          .phone-highlight { background: #fdf2f8; border: 2px solid #f472b6; border-radius: 12px; padding: 14px; text-align: center; margin: 20px 0; }
          .phone-number { font-size: 22px; font-weight: bold; color: #831843; letter-spacing: 1px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 13px; }
          .info-label { color: #78716c; font-weight: 600; text-transform: uppercase; font-size: 11px; }
          .info-value { color: #1c1917; font-weight: bold; }
          .footer { text-align: center; padding: 16px; font-size: 11px; color: #a8a29e; background: #fafaf9; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MAYA COLLECTIONS</h1>
            <p>New Customer Registration Alert</p>
          </div>
          <div class="content">
            <p style="font-size: 14px; line-height: 1.5; margin-top: 0;">
              A new customer has just created an account on Maya Collections!
            </p>

            <div class="phone-highlight">
              <div style="font-size: 11px; text-transform: uppercase; color: #9d174d; font-weight: bold; margin-bottom: 4px;">
                Customer Phone Number
              </div>
              <div class="phone-number">
                ${user.phone || 'No Phone Provided'}
              </div>
              ${
                user.phone
                  ? `<div style="margin-top: 8px;">
                      <a href="https://wa.me/91${user.phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: bold;">
                        Message on WhatsApp
                      </a>
                    </div>`
                  : ''
              }
            </div>

            <div class="info-row">
              <span class="info-label">Customer Name:</span>
              <span class="info-value">${user.name}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Customer Email:</span>
              <span class="info-value">${user.email}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Registration Time:</span>
              <span class="info-value" style="font-size: 12px;">${formattedDate}</span>
            </div>
          </div>
          <div class="footer">
            Maya Collections Store Management • Nacharam, Rangareddy
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
NEW CUSTOMER REGISTRATION - MAYA COLLECTIONS
Name: ${user.name}
Phone: ${user.phone || 'N/A'}
Email: ${user.email}
Time: ${formattedDate}
    `.trim();

    if (!isEmailConfigured()) {
      logger.info(
        `✉️ [Simulated Email] New registration alert for ${user.name} (Phone: ${user.phone}) to ${recipient} (EMAIL_PASS not configured in env)`
      );
      return { success: true, simulated: true };
    }

    try {
      const activeTransporter = getTransporter();
      const mailOptions = {
        from: `"MAAYA Collections Alerts" <${config.email.user}>`,
        to: recipient,
        subject: `✨ New Customer: ${user.name} - Phone: ${user.phone || 'N/A'}`,
        text: textContent,
        html: htmlContent,
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`✅ Registration alert email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Failed to send registration alert email for ${user.email}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
