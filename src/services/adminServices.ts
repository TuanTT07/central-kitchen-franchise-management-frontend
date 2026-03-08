import http from '@/lib/axios';
import type { PaginatedResponse, Response, SpringPageResponse } from '@/Types/utils.type';

export interface UserResponse {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface StoreResponse {
  storeId: number;
  storeName: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export const adminService = {
  /**
   * Lấy danh sách người dùng có phân trang
   * @param page Trang hiện tại (bắt đầu từ 0)
   * @param size Số lượng item trên mỗi trang
   * @returns PaginatedResponse chứa danh sách UserResponse
   */
  getAllUsers: async (page: number = 0, size: number = 10) => {
    return await http.get<SpringPageResponse<UserResponse[]>>('/admin/users', {
      params: { page, size },
    });
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
    return await http.delete(`/admin/users/${id}/active`);
  },

  // lấy ra tất cả các cửa hàng
  getAllStores: async (page: number = 0, size: number = 10) => {
    return await http.get<Response<PaginatedResponse<StoreResponse[]>>>('/admin/stores', {
      params: { page, size },
    });
  },
  createStore: async (body: {
    storeName: string;
    address: string;
    phone: string;
    managerUserId: number;
    isActive: boolean;
  }) => {
    return await http.post('/admin/stores', body);
  },
};
