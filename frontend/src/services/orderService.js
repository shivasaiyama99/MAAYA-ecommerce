import apiClient from './api';

export const orderService = {
  /**
   * Place a new order (Cart checkout or Buy Now)
   */
  createOrder: async (orderData) => {
    return await apiClient.post('/orders', orderData);
  },

  /**
   * Get all orders belonging to the authenticated customer
   */
  getMyOrders: async () => {
    return await apiClient.get('/orders/my');
  },

  /**
   * Get order details by ID (authenticated customer or admin)
   */
  getOrderById: async (id) => {
    return await apiClient.get(`/orders/${id}`);
  },

  /**
   * Customer or Admin cancel order (restores inventory atomically)
   */
  cancelOrder: async (id) => {
    return await apiClient.patch(`/orders/${id}/cancel`);
  },

  /**
   * Admin: Get all orders with search, filter, and pagination
   */
  getAdminOrders: async (params = {}) => {
    return await apiClient.get('/orders/admin', { params });
  },

  /**
   * Admin: Update order status (with strict transition validation)
   */
  updateOrderStatus: async (id, status, markPaid = false) => {
    return await apiClient.patch(`/orders/${id}/status`, { status, markPaid });
  },

  /**
   * Admin: Update payment status (e.g. mark as Paid or Pending)
   */
  updateOrderPayment: async (id, paymentStatus) => {
    return await apiClient.patch(`/orders/${id}/payment`, { paymentStatus });
  },

  /**
   * Admin: Confirm order after verifying receipt of PhonePe / Google Pay transfer
   */
  confirmOrder: async (id, paymentVerified = true, notes = '') => {
    return await apiClient.post(`/orders/${id}/confirm`, { paymentVerified, notes });
  },

  /**
   * Admin: Resend order email notification (confirmation or placement)
   */
  resendOrderEmail: async (id, type = 'confirmation') => {
    return await apiClient.post(`/orders/${id}/resend-email`, { type });
  },

  /**
   * Fetch store UPI and payment transfer configuration
   */
  getPaymentConfig: async () => {
    return await apiClient.get('/orders/payment-config');
  },
};

export default orderService;
