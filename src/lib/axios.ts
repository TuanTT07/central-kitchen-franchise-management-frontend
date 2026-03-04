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
        if (token && config.headers) {
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

        // Chỉ xử lý nếu lỗi là 401 và request này chưa từng được retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const rToken = localStorage.getItem('refreshToken');
            if (!rToken) throw new Error('No refresh token');

            // Gọi API lấy Access Token mới
            // Lưu ý: data.data.access_token vì Backend bọc trong Response Object
            const res = await authService.refreshToken(rToken);
            const { access_token } = res.data.data;

            localStorage.setItem('authToken', access_token);

            // Chạy lại request cũ với token mới
            originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
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
