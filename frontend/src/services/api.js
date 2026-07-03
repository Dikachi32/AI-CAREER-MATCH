import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 second timeout
});

// Add token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // CRITICAL FIX: Remove accidental surrounding quotes from JSON.stringify
    let cleanToken = token.trim();
    if (
      (cleanToken.startsWith('"') && cleanToken.endsWith('"')) ||
      (cleanToken.startsWith("'") && cleanToken.endsWith("'"))
    ) {
      try {
        cleanToken = JSON.parse(cleanToken);
      } catch (e) {
        cleanToken = cleanToken.slice(1, -1);
      }
    }
    config.headers.Authorization = `Bearer ${cleanToken}`;
    console.log('[API] Token attached:', cleanToken.substring(0, 20) + '...');
  } else {
    console.warn('[API] No token found in localStorage!');
  }
  return config;
});

// Handle token expiration globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      console.error('[API] 422 Error Details:', error.response.data);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const uploadCV = (data) => {
  if (data instanceof FormData) {
    // Do NOT set Content-Type manually for FormData — browser sets the multipart boundary automatically
    return api.post('/upload_cv', data);
  } else {
    return api.post('/upload_cv', data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const recommendJobs = (payload) =>
  api.post('/recommend_jobs', payload);

export const getJobLinks = () =>
  api.get('/get_job_links');

export const getStats = () =>
  api.get('/stats');

export const getAnalytics = (payload) =>
  api.post('/analytics', payload);

export const getProfile = () =>
  api.get('/profile');

export const updateProfile = (data) =>
  api.put('/profile', data);

export const login = (data) =>
  api.post('/login', data);

export const register = (data) =>
  api.post('/register', data);

export default api;