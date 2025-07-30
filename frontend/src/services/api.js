import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// This interceptor automatically adds the auth token to every request.
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('tripto_token') || sessionStorage.getItem('tripto_token');
    

    // ADD THESE DEBUG CONSOLE LOGS HERE:
    console.log('🔍 DEBUG - Token from localStorage:', localStorage.getItem('tripto_token'));
    console.log('🔍 DEBUG - Token from sessionStorage:', sessionStorage.getItem('tripto_token'));
    console.log('🔍 DEBUG - Final token being used:', token);
    console.log('🔍 DEBUG - Request URL:', config.url);
    console.log('🔍 DEBUG - Request method:', config.method);

    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔍 DEBUG - Authorization header set:', config.headers['Authorization']);
    } else {
      console.log('❌ DEBUG - No token found, Authorization header NOT set');
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

// Hotel API endpoints
export const hotelAPI = {
  searchHotels: (params) => api.get('/hotels/search', { params }),
  getHotelDetails: (id) => api.get(`/hotels/${id}`),
  getPopularHotels: () => api.get('/hotels/popular'),
  bookHotel: (bookingData) => api.post('/hotels/book', bookingData),
};

// Posts API endpoints
export const postsAPI = {
  getTrendingTags: () => api.get('/posts/trending-tags'),
  getTrendingPosts: () => api.get('/posts/trending'),
  addReaction: (postId, reactionType) => api.post(`/posts/${postId}/react`, { reaction_type: reactionType }),
  incrementViewCount: (postId) => api.post(`/posts/${postId}/view`),
};

export default api;