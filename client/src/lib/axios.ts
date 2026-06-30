import axios from 'axios';
import toast from 'react-hot-toast';

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
      const isSilentEndpoint = originalRequest.url?.includes('/refresh') || originalRequest.url?.includes('/logout');
      if (!isSilentEndpoint) {
        let errorMsg = "An unexpected error occurred";
        if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map((e: { message?: string } | string) => (typeof e === 'string' ? e : e?.message || String(e))).join(", ");
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      console.log(error)

        toast.error(errorMsg,{
          style: {
              background: "#18181b",
              color: "#e4e4e7",
              border: "1px solid #3f3f46",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
            },
        });
      }

    

      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      let errorMsg = "An unexpected error occurred";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map((e: { message?: string } | string) => (typeof e === 'string' ? e : e?.message || String(e))).join(", ");
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      toast.error(errorMsg,{
        style: {
            background: "#18181b",
            color: "#e4e4e7",
            border: "1px solid #3f3f46",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
          },
      });
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
      const isAdminRequest = originalRequest.url?.includes('/admin');
      const eventName = isAdminRequest ? 'admin-auth:session-expired' : 'auth:session-expired';
      window.dispatchEvent(new CustomEvent(eventName));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

