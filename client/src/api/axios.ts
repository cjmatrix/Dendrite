import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Crucial for sending cookies (access/refresh tokens)
});

// Set JSON header by default, but allow FormData to override for multipart uploads
api.defaults.headers.post['Content-Type'] = 'application/json';
api.interceptors.request.use((config) => {
  // If data is FormData, don't set Content-Type (let browser set multipart/form-data with boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// --- Silent Refresh Interceptor ---
// When a request gets a 401, automatically call /auth/refresh and retry.
// Uses a queue so that if multiple requests fail at the same time,
// only ONE refresh call is made and the rest wait for it.

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response, // Success — pass through
  async (error) => {
    const originalRequest = error.config;

    // Skip interceptor for auth endpoints to avoid infinite loops
    const skipUrls = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
    if (skipUrls.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    // Only intercept 401 (expired access token), and only retry once
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh'); // Cookies are sent/set automatically
      processQueue(null);
      return api(originalRequest); // Retry the original request
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh failed — token is invalid/expired, force logout
      // Dispatch a window event so Redux can clear state
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

