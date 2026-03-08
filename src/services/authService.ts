import http from '@/lib/axios';
import type { LoginResponse, LoginPayload } from '@/Types/LoginResponse';

/**
 * =========================================================
 * API: Authentication Service (Xác thực người dùng)
 *
 * Endpoints:
 * POST   /auth/login    -> Đăng nhập hệ thống
 * POST   /auth/logout   -> Đăng xuất hệ thống
 * POST   /auth/refresh  -> Làm mới access token
 *
 * Authorization:
 * Bearer Token (cho logout và refresh nếu cần)
 * =========================================================
 */

export const authService = {
  /**
   * Đăng nhập vào hệ thống bằng username và password
   *
   * @param username Tên đăng nhập
   * @param password Mật khẩu
   *
   * @returns Promise<LoginPayload> Thông tin người dùng và token
   */
  signIn: async (username: string, password: string): Promise<LoginPayload> => {
    const response = await http.post<LoginResponse>('/auth/login', { username, password });
    return response.data.data;
  },

  /**
   * Đăng xuất khỏi hệ thống
   *
   * @param refreshToken Refresh token hiện tại để vô hiệu hóa
   *
   * @returns Promise<any>
   */
  logout: async (refreshToken: string | null) => await http.post('/auth/logout', { refreshToken }),

  /**
   * Lấy access token mới bằng refresh token
   *
   * @param refreshToken Refresh token hợp lệ
   *
   * @returns Promise<any>
   */
  refreshToken: async (refreshToken: string) => await http.post('/auth/refresh', { refreshToken }),
};
