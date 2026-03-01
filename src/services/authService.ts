import http from '@/lib/axios';
import { mockAuthService } from './mockAuthService';
import type { LoginResponse } from '@/Types/LoginResponse';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
export const authService = {
  signIn: async (username: string, password: string): Promise<LoginResponse> => {
    if (USE_MOCK) {
      return await mockAuthService.signIn(username, password);
    } else {
      const response = await http.post('/auth/login', { username, password });
      return {
        token: response.data.token,
        user: response.data.user,
        role: response.data.user.userRoleId,
      };
    }
  },
};
