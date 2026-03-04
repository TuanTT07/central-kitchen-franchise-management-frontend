import http from '@/lib/axios';
import type { LoginResponse } from '@/Types/LoginResponse';

export const authService = {
  signIn: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await http.post<LoginResponse>('/auth/login', { username, password });
    return response.data;
  },
  logout: async (refreshToken: string | null) => await http.post('/auth/logout', refreshToken),
  refreshToken: async (token: string) => await http.post('/auth/refresh', token),
};
