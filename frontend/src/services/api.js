// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging and AUTH
api.interceptors.request.use(
  (config) => {
    // This is the key change: get the token and add it to the header
    const token = localStorage.getItem('tripto_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    // NEW: Listen for 401 errors, which might mean the token is expired.
    // Dispatch a global event that App.jsx can listen for to trigger a logout.
    if (error.response?.status === 401) {
        console.warn("[API] Received 401 Unauthorized. Dispatching 'auth-expired' event.");
        window.dispatchEvent(new CustomEvent("auth-expired"));
    }
    console.error('[API] Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;