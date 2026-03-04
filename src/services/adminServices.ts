import http from '@/lib/axios';

export const adminService = {
  // Lấy danh sách người dùng
  getAllUsers: async () => {
    return await http.get('/admin/users');
  },

  // Đăng ký tài khoản mới
  registerAccount: async (body: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  }) => {
    return await http.post('/admin/users', body);
  },

  // Cập nhật tài khoản
  updateAccount: async (
    id: number,
    body: {
      fullName?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }
  ) => {
    return await http.put(`/admin/users/${id}`, body);
  },

  // Xóa tài khoản
  deleteAccount: async (id: number) => {
    return await http.delete(`/admin/users/${id}`);
  },
};
