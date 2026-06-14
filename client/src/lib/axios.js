import axios from 'axios';
import { store } from '../store/index.js';
import { setCredentials, clearCredentials } from '../features/auth/authSlice.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true, // send httpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Silent Refresh Logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login');

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        // Attempt silent refresh
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data?.data?.accessToken;

        if (newToken) {
          const currentUser = store.getState().auth.user;
          // Dispatch setCredentials preserving current user details
          store.dispatch(
            setCredentials({ user: currentUser, accessToken: newToken })
          );

          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        store.dispatch(clearCredentials());
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
