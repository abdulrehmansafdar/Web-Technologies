/**
 * ===========================================
 * API Service Configuration
 * ===========================================
 * 
 * Configures Axios instance for API communication.
 * Sets up base URL, interceptors, and error handling.
 * 
 * @module services/api
 */

import axios from 'axios';

// Get API base URL from environment variable or use relative URL for proxy
// In development with Docker, we use '/api' which Vite proxies to backend
// In production, set VITE_API_URL to the actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Axios Instance
 * 
 * Pre-configured Axios instance with:
 * - Base URL pointing to the backend API
 * - Default headers for JSON requests
 * - Request/response interceptors
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

/**
 * Request Interceptor
 * 
 * Runs before each request is sent:
 * - Adds authorization token if available
 * - Can modify request config
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 
 * Runs after each response is received:
 * - Handles authentication errors (401)
 * - Processes response data
 * - Global error handling
 */
api.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  (error) => {
    // Handle specific error statuses
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - Clear token and redirect to login
          // Only clear if not on login page to avoid infinite loop
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          break;
        
        case 403:
          // Forbidden - User doesn't have permission
          console.error('Access denied:', data.message);
          break;
        
        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;
        
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
        
        default:
          console.error('API error:', data.message);
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error - no response received');
    } else {
      // Other errors
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
