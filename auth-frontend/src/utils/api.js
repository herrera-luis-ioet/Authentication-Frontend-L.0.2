import axios from 'axios';
import { getToken, setToken, setUser, logout } from './auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for token handling
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors and token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getToken(); // Assuming refresh token is stored as main token
        const response = await refreshAccessToken(refreshToken);
        
        if (response.data.token) {
          setToken(response.data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// PUBLIC_INTERFACE
/**
 * Login user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} Response from the API
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    setToken(token);
    setUser(user);
    
    return response.data;
  } catch (error) {
    throw transformError(error);
  }
};

// PUBLIC_INTERFACE
/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} Response from the API
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;
    
    setToken(token);
    setUser(user);
    
    return response.data;
  } catch (error) {
    throw transformError(error);
  }
};

// PUBLIC_INTERFACE
/**
 * Refresh the access token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise} Response from the API
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    return await api.post('/auth/refresh', { token: refreshToken });
  } catch (error) {
    throw transformError(error);
  }
};

/**
 * Transform API error responses into a standard format
 * @param {Error} error - The error object from axios
 * @returns {Error} Transformed error object
 */
const transformError = (error) => {
  if (error.response) {
    // Server responded with error
    const { data, status } = error.response;
    const message = data.message || 'An error occurred';
    const transformedError = new Error(message);
    transformedError.status = status;
    transformedError.data = data;
    return transformedError;
  }
  
  if (error.request) {
    // Request was made but no response received
    return new Error('No response received from server');
  }
  
  // Error in request configuration
  return error;
};

export default api;