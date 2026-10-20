import apiClient from './api';

export const authService = {
  /**
   * Register a new customer
   */
  register: async ({ name, email, phone, password, confirmPassword }) => {
    return await apiClient.post('/auth/register', {
      name,
      email,
      phone,
      password,
      confirmPassword,
    });
  },

  /**
   * Customer login
   */
  login: async ({ email, password }) => {
    return await apiClient.post('/auth/login', {
      email,
      password,
    });
  },

  /**
   * Administrative login
   */
  adminLogin: async ({ email, password }) => {
    return await apiClient.post('/auth/admin/login', {
      email,
      password,
    });
  },

  /**
   * Fetch current authenticated user
   */
  getMe: async () => {
    return await apiClient.get('/auth/me');
  },

  /**
   * Logout user and clear session
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
  },
};

export default authService;
