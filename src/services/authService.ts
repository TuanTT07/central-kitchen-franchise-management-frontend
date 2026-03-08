import http from '@/lib/axios';
import type { LoginResponse, LoginPayload } from '@/Types/LoginResponse';

export const authService = {
  signIn: async (username: string, password: string): Promise<LoginPayload> => {
    const response = await http.post<LoginResponse>('/auth/login', { username, password });
    return response.data.data;
  },
  logout: async (refreshToken: string | null) => await http.post('/auth/logout', { refreshToken }),
  refreshToken: async (refreshToken: string) => await http.post('/auth/refresh', { refreshToken }),
};
