import apiClient from './api';

export const productService = {
  /**
   * Upload an image to Cloudinary via backend memory buffer
   * @param {File} file
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return await apiClient.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Fetch public active sarees for storefront customers
   */
  getPublicProducts: async ({
    search = '',
    category = '',
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all' && category !== 'All Categories') params.append('category', category);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (sort) params.append('sort', sort);
    params.append('page', page);
    params.append('limit', limit);

    return await apiClient.get(`/products?${params.toString()}`);
  },

  /**
   * Fetch admin product catalog with search, filtering, and pagination
   */
  getAdminProducts: async ({
    search = '',
    category = '',
    status = 'all',
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);

    return await apiClient.get(`/products/admin?${params.toString()}`);
  },

  /**
   * Get single product details by ID
   */
  getProductById: async (id) => {
    return await apiClient.get(`/products/${id}`);
  },

  /**
   * Create a new saree listing
   */
  createProduct: async (productData) => {
    return await apiClient.post('/products', productData);
  },

  /**
   * Update an existing product
   */
  updateProduct: async (id, productData) => {
    return await apiClient.patch(`/products/${id}`, productData);
  },

  /**
   * Delete a product and its associated Cloudinary images
   */
  deleteProduct: async (id) => {
    return await apiClient.delete(`/products/${id}`);
  },
};

export default productService;
