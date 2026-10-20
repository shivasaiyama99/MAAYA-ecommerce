import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 45000, // 45s to accommodate Render free-tier cold starts gracefully
});

// Helper: Retrieve active auth token from sessionStorage (admin/ephemeral) or localStorage (customer)
export const getAuthToken = () => {
  try {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || null;
  } catch {
    return null;
  }
};

// Request Interceptor: Attach JWT Token if available in sessionStorage or localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error extraction with cold-start detection
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'The server is taking a moment to respond (waking up from standby). Please retry in a few seconds.';
    } else if (!error.response && error.request) {
      message = 'Unable to reach the server. Please check your internet connection or server status.';
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default apiClient;

