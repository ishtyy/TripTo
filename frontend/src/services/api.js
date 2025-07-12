import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// This interceptor automatically adds the auth token to every request.
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('tripto_token');
    
    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// This interceptor helps with debugging by logging responses.
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response from', response.config.url, ':', response.data);
    return response;
  },
  (error) => {
    console.error('[API] Response Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
        window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;