// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This interceptor adds the auth token to every outgoing request
api.interceptors.request.use(
  (config) => {
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

// This interceptor watches for responses from the backend
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    // If the error is a 401, dispatch a global 'auth-expired' event
    if (error.response?.status === 401) {
        console.warn("[API] Received 401 Unauthorized. Dispatching 'auth-expired' event.");
        window.dispatchEvent(new CustomEvent("auth-expired"));
    }
    console.error('[API] Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;