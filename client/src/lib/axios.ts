import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, 
});


api.defaults.headers.post['Content-Type'] = 'application/json';
api.interceptors.request.use((config) => {
  
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});



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
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;


    const skipUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
      '/admin/auth/login',
      '/admin/auth/refresh',
      '/admin/auth/logout',
    ];
    if (skipUrls.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const isAdminRequest = originalRequest.url?.includes('/admin');
      const refreshEndpoint = isAdminRequest ? '/admin/auth/refresh' : '/auth/refresh';
      await api.post(refreshEndpoint);
      processQueue(null);
      return api(originalRequest); 
    } catch (refreshError) {
      processQueue(refreshError);
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

