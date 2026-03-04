import axios, { type AxiosInstance } from 'axios';

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

    // Add interceptor
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
  }
}
const http = new Http().instance;
export default http;
