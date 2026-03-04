import http from '@/lib/axios';

export const adminService = {
  registerAccount: async (body: {
    username: string;
    password: string;
    full_name: string;
    email: string;
    role_id: number;
  }) => {
    return await http.post('/admin/user', body);
  },
};
