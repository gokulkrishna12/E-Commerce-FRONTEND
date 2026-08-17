import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auto-refresh expired access tokens ──
let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  pendingRequests = [];
};

// Automatically clean hardcoded EC2 IP URLs from responses so they route safely over CloudFront HTTPS
API.interceptors.response.use(
  (response) => {
    const fixUrl = (url) => typeof url === 'string' && url.includes('http://54.235.58.181:8080') 
      ? url.replace('http://54.235.58.181:8080', '') 
      : url;

    if (response.data) {
      if (Array.isArray(response.data)) {
        response.data = response.data.map(item => {
          if (item?.imageUrl) item.imageUrl = fixUrl(item.imageUrl);
          if (item?.product?.imageUrl) item.product.imageUrl = fixUrl(item.product.imageUrl);
          if (item?.cartItems) {
            item.cartItems = item.cartItems.map(ci => {
              if (ci?.product?.imageUrl) ci.product.imageUrl = fixUrl(ci.product.imageUrl);
              return ci;
            });
          }
          return item;
        });
      } else if (typeof response.data === 'object') {
        if (response.data.imageUrl) response.data.imageUrl = fixUrl(response.data.imageUrl);
        if (response.data.product?.imageUrl) response.data.product.imageUrl = fixUrl(response.data.product.imageUrl);
        if (response.data.cartItems) {
          response.data.cartItems = response.data.cartItems.map(ci => {
            if (ci?.product?.imageUrl) ci.product.imageUrl = fixUrl(ci.product.imageUrl);
            return ci;
          });
        }
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post('/api/auth/refresh-token', {
          refreshToken,
        });
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);

        API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;

export const fixImageUrl = (url) => {
  if (!url) return "";
  return url.replace("http://54.235.58.181:8080", "");
};