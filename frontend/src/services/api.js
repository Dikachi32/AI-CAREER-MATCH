import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    const { status, data } = error.response;

    if (status === 401) {
      localStorage.removeItem('token');
      // Don't redirect automatically to avoid loops
    }

    if (status === 429) {
      return Promise.reject(new Error('Too many requests. Please slow down.'));
    }

    if (status >= 500) {
      return Promise.reject(new Error(data?.error || 'Server error. Please try again later.'));
    }

    return Promise.reject(error);
  }
);

// Retry wrapper for transient failures
export async function withRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((res) => setTimeout(res, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// ========== CV & AI PROFILE ==========

export const uploadCV = (data) => {
  if (data instanceof FormData) {
    return api.post('/upload_cv', data);
  } else {
    return api.post('/upload_cv', data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const getAIProfile = () => api.get('/ai_profile');

// ========== RECOMMENDATIONS ==========

export const recommendJobs = (payload) => api.post('/recommend_jobs', payload);

export const getJobLinks = () => api.get('/get_job_links');

// ========== ANALYTICS ==========

export const getAnalytics = (payload) => api.post('/analytics', payload);

export const getStats = () => api.get('/stats');

export const getAdvancedAnalytics = (payload) => api.post('/analytics', payload);

// ========== AUTH ==========

export const getProfile = () => api.get('/profile');

export const updateProfile = (data) => api.put('/profile', data);

export const login = (data) => api.post('/login', data);

export const register = (data) => api.post('/register', data);

// ========== SUBSCRIPTION ==========

export const getSubscription = () => api.get('/subscription');

export const toggleSubscription = (tier) => api.post('/subscription/demo-toggle', { tier });

export default api;

// ========== JOB DETAILS & INTELLIGENCE ==========

export const getJobDetails = (jobId) => api.get(`/job/${jobId}`);

export const getCVMatch = (payload) => api.post('/cv_match', payload);

export const getJobIntelligence = (payload) => api.post('/job_intelligence', payload);

// Phase 3: AI Career Roadmap & Skill Gap Intelligence
export const getCareerRoadmap = (payload) => api.post('/api/v3/ai-career/roadmap', payload);

export const getCombinedIntelligence = (payload) => api.post('/api/v3/ai-career/combined', payload);

export const optimizeCV = (payload) => api.post('/optimize_cv', payload);

// Phase 4: AI CV Optimizer & ATS Enhancement
export const optimizeCV = (payload) => api.post('/optimize_cv', payload);

export const quickATSCheck = (payload) => api.post('/quick_ats_check', payload);