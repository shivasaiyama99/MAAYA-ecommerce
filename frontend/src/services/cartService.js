import apiClient from './api';

export const cartService = {
  // Get customer's cart
  getCart: async () => {
    return await apiClient.get('/cart');
  },

  // Add single item or merge guest cart items
  addToCart: async (productId, quantity = 1) => {
    return await apiClient.post('/cart/items', { productId, quantity });
  },

  // Merge batch of items (e.g. from guest localStorage upon login)
  mergeCart: async (items) => {
    return await apiClient.post('/cart/items', { items });
  },

  // Update quantity of an item
  updateQuantity: async (productId, quantity) => {
    return await apiClient.patch(`/cart/items/${productId}`, { quantity });
  },

  // Remove single item from cart
  removeItem: async (productId) => {
    return await apiClient.delete(`/cart/items/${productId}`);
  },

  // Clear entire cart
  clearCart: async () => {
    return await apiClient.delete('/cart');
  },
};

export default cartService;
