import http from '@/lib/axios';
import type { Role } from '@/Types';
import type { PaginatedResponse, Response } from '@/Types/utils.type';

export interface UserResponse {
  userId: number;
  username: string;
  fullName: string;
  password?: string;
  email: string;
  role: Role;
  storeId: number;
  storeName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StoreResponse {
  storeId: number;
  storeName: string;
  address: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * =========================================================
 * API: Admin Service
 *
 * Endpoints:
 * GET    /admin/users          -> Danh sách người dùng (phân trang)
 * POST   /admin/users          -> Đăng ký tài khoản mới
 * PATCH    /admin/users/{id}     -> Cập nhật thông tin tài khoản
 * DELETE /admin/users/{id} -> Xóa/Ngừng kích hoạt tài khoản
 *
 * GET    /admin/stores         -> Danh sách cửa hàng (phân trang)
 * POST   /admin/stores         -> Tạo cửa hàng mới
 * PATCH  /admin/stores/{id}    -> cập nhật thông tin cửa hàng và nó có thể điều chỉnh được trạng thái
 * DELETE /admin/stores/{id}    -> chuyển về trạng thái ngừng hạot động
 *
 * Authorization:
 * Bearer Token
 * =========================================================
 */

export const adminService = {
  /**
   * Lấy danh sách người dùng có phân trang
   *
   * @param page Trang hiện tại (bắt đầu từ 0)
   * @param size Số lượng item trên mỗi trang
   *
   * @returns Promise<Response<PaginatedResponse<UserResponse[]>>>
   */
  getAllUsers: async (page: number = 0, size: number = 10) => {
    return await http.get<Response<PaginatedResponse<UserResponse[]>>>('/admin/users', {
      params: { page, size },
    });
  },

  /**
   * Đăng ký tài khoản mới vào hệ thống
   *
   * @param body Thông tin tài khoản (username, password, fullName, email, role, isActive)
   *
   * @returns Promise<any>
   */
  registerAccount: async (body: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    role: Role;
    storeId: number;
  }) => {
    return await http.post('/admin/users', body);
  },

  /**
   * Cập nhật thông tin tài khoản hiện có
   *
   * @param id ID của người dùng cần cập nhật
   * @param body Các trường thông tin cần thay đổi
   *
   * @returns Promise<any>
   */
  updateAccount: async (
    id: number,
    body: {
      fullName: string;
      email: string;
      role: Role;
      storeId: number;
      status: 'ACTIVE' | 'INACTIVE';
      password?: string;
    }
  ) => {
    return await http.patch(`/admin/users/${id}`, body);
  },

  /**
   * Xóa hoặc ngừng kích hoạt tài khoản người dùng
   *
   * @param id ID của người dùng
   *
   * @returns Promise<any>
   */
  deleteAccount: async (id: number) => {
    return await http.delete(`/admin/users/${id}`);
  },

  /**
   * Lấy danh sách tất cả các cửa hàng có phân trang
   *
   * @param page Trang hiện tại (bắt đầu từ 0)
   * @param size Số lượng cửa hàng mỗi trang
   *
   * @returns Promise<Response<PaginatedResponse<StoreResponse[]>>>
   */
  getStoreById: async (id: number) => {
    return await http.get<Response<StoreResponse>>(`/admin/stores/${id}`);
  },

  getAllStores: async (page: number = 0, size: number = 10) => {
    return await http.get<Response<PaginatedResponse<StoreResponse[]>>>('/admin/stores', {
      params: { page, size },
    });
  },

  /**
   * Tạo mới một cửa hàng trong hệ thống
   *
   * @param body Thông tin cửa hàng (storeName, address, phone, status)
   *
   * @returns Promise<any>
   */
  createStore: async (body: { storeName: string; address: string; phone: string; status: 'ACTIVE' | 'INACTIVE' }) => {
    return await http.post('/admin/stores', body);
  },

  /**
   * Cập nhật thông tin cửa hàng trong hệ thống
   *
   * @param id ID của cửa hàng, body thông tin cửa hàng (storeName, address, phone, status)
   *
   * @return Promise<Response<StoreResponse>>
   */
  updateStore: async (
    id: number,
    body: { storeName: string; address: string; phone: string; status: 'ACTIVE' | 'INACTIVE' }
  ) => {
    return await http.patch<Response<StoreResponse>>(`/admin/stores/${id}`, body);
  },

  /**
   * Chuyển trạng thái về ngừng hoạt động
   *
   * @param id ID của cửa hàng
   *
   * @returns Promise<Response<StoreResponse>>
   */
  deleteStore: async (id: number) => {
    return await http.delete<Response<StoreResponse>>(`/admin/stores/${id}`);
  },
};
