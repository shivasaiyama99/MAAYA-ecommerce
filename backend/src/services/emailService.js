import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
};

export const isEmailConfigured = () => {
  return Boolean(config.email.user && config.email.pass);
};

export class EmailService {
  /**
   * Send notification to store owner when an order is placed
   */
  static async sendOrderNotification(order) {
    const recipient = config.email.notificationRecipient || config.adminEmail;
    const orderItemsHtml = (order.items || [])
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
            ₹${Number(item.price).toLocaleString('en-IN')}
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #831843;">
            ₹${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
          </td>
        </tr>
      `
      )
      .join('');

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
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #f5f5f4; padding-bottom: 4px; }
          .info-box { background: #fbfbf9; border: 1px solid #f0ede6; border-radius: 10px; padding: 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #78716c; background: #fafaf9; }
          .total-box { margin-top: 16px; text-align: right; padding-top: 12px; border-top: 2px solid #e7e5e4; font-size: 16px; font-weight: bold; color: #701a23; }
          .footer { text-align: center; padding: 16px; font-size: 11px; color: #a8a29e; background: #fafaf9; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MAYA COLLECTIONS</h1>
            <p>Sarees & Royal Jewellery • New Order Notification</p>
          </div>
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span class="badge">Order Placed</span>
              <span style="font-weight: bold; font-size: 14px; color: #701a23;">#${order.orderNumber}</span>
            </div>

            <div class="section-title">Customer Contact Details</div>
            <div class="info-box">
              <strong>Name:</strong> ${order.shippingAddress?.fullName || 'N/A'}<br/>
              <strong>Phone:</strong> <span style="font-size: 15px; color: #831843; font-weight: bold;">${order.shippingAddress?.phone || 'N/A'}</span><br/>
              <strong>Email:</strong> ${order.customerEmail || 'N/A'}
            </div>

            <div class="section-title">Delivery Address</div>
            <div class="info-box">
              ${order.shippingAddress?.addressLine || ''}<br/>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - <strong>${order.shippingAddress?.pincode || ''}</strong><br/>
              ${order.deliveryInstructions ? `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e7e5e4; color: #b45309;"><strong>Instructions:</strong> ${order.deliveryInstructions}</div>` : ''}
            </div>

            <div class="section-title">Items Ordered</div>
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
              Subtotal: ₹${Number(order.subtotal || order.totalAmount).toLocaleString('en-IN')}<br/>
              <span style="font-size: 12px; color: #059669; font-weight: normal;">Pan-India Delivery: Free Express</span><br/>
              <span style="font-size: 18px;">Total Payable: ₹${Number(order.totalAmount).toLocaleString('en-IN')}</span><br/>
              <span style="font-size: 12px; color: #d97706; font-weight: 600;">Payment Method: ${order.paymentMethod || 'Cash on Delivery (COD)'} (Pending)</span>
            </div>
          </div>
          <div class="footer">
            Maya Collections • Nacharam, Rangareddy • Customer Contact: +91 97016 07651
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
NEW ORDER RECEIVED - MAYA COLLECTIONS
Order Number: ${order.orderNumber}
Customer: ${order.shippingAddress?.fullName}
Phone: ${order.shippingAddress?.phone}
Email: ${order.customerEmail}
Address: ${order.shippingAddress?.addressLine}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}
Delivery Instructions: ${order.deliveryInstructions || 'None'}

Total Amount: ₹${order.totalAmount} (${order.paymentMethod})
Items:
${(order.items || []).map((i) => `- ${i.title} (Qty: ${i.quantity}) @ ₹${i.price}`).join('\n')}
    `;

    if (!isEmailConfigured()) {
      logger.info(
        `✉️ [Simulated Email] Order notification for ${order.orderNumber} to ${recipient} (EMAIL_PASS not configured in env)`
      );
      return { success: true, simulated: true };
    }

    try {
      const activeTransporter = getTransporter();
      const mailOptions = {
        from: `"Maya Collections Orders" <${config.email.user}>`,
        to: recipient,
        subject: `🛍️ New Order: ${order.orderNumber} from ${order.shippingAddress?.fullName} (₹${Number(order.totalAmount).toLocaleString('en-IN')})`,
        text: textContent,
        html: htmlContent,
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`✅ Order notification email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Failed to send order notification email for ${order.orderNumber}: ${error.message}`);
      return { success: false, error: error.message };
    }
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

            <!-- Prominent Phone Number Highlight -->
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
    `;

    if (!isEmailConfigured()) {
      logger.info(
        `✉️ [Simulated Email] New registration alert for ${user.name} (Phone: ${user.phone}) to ${recipient} (EMAIL_PASS not configured in env)`
      );
      return { success: true, simulated: true };
    }

    try {
      const activeTransporter = getTransporter();
      const mailOptions = {
        from: `"Maya Collections Alerts" <${config.email.user}>`,
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
