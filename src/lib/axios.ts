import { authService } from '@/services/authService';
import axios, { type AxiosInstance } from 'axios';

// Helper function để xử lý logout hoàn toàn
const handleFullLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

class Http {
  instance: AxiosInstance;
  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL?.trim(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh');

        if (token && config.headers && !isAuthRoute) {
          const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          config.headers.set('Authorization', authHeader);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

        // Chỉ xử lý nếu lỗi là 401, không phải route auth và request này chưa từng được retry
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
          originalRequest._retry = true;

          try {
            const rToken = localStorage.getItem('refreshToken');
            if (!rToken) throw new Error('No refresh token');

            // Gọi API lấy Access Token mới
            const res = await authService.refreshToken(rToken);
            
            // Cấu trúc JSON: res.data.data.access_token và res.data.data.refresh_token (nếu có bọc data)
            const { access_token, refresh_token } = res.data.data || res.data;

            if (!access_token) throw new Error('Refresh token failed');

            localStorage.setItem('authToken', access_token);
            if (refresh_token) {
              localStorage.setItem('refreshToken', refresh_token);
            }

            // Chạy lại request cũ với token mới
            const authHeader =  (access_token.startsWith("Bearer"))? access_token : `Bearer ${access_token}`;
            originalRequest.headers.set('Authorization', authHeader);
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Nếu Refresh cũng lỗi (hết hạn hoàn toàn) -> Logout
            handleFullLogout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }
}
const http = new Http().instance;
export default http;
