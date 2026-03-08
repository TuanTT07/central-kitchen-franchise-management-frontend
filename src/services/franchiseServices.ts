import http from '@/lib/axios';
import type { Response } from '@/Types/utils.type';

export interface OrderDetailResponse {
  orderDetailId: number;
  productId: number;
  productName: string;
  unit?: string;
  unitName?: string;
  quantity: number;
}

export interface OrderResponse<T> {
  orderId: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'PENDING' | 'APPROVED' | 'CONSOLIDATED' | 'CANCELLED';
  details: T;
}

/**
 * =========================================================
 * API: Franchise Service (Quản lý đơn hàng Chi nhánh)
 *
 * Endpoints:
 * GET    /orders  -> Lấy danh sách tất cả đơn hàng
 * POST   /orders  -> Tạo đơn hàng mới từ chi nhánh
 *
 * Authorization:
 * Bearer Token
 * =========================================================
 */

export const franchiseServices = {
  /**
   * Lấy danh sách tất cả các đơn hàng trong hệ thống (dành cho chi nhánh hoặc quản lý)
   *
   * @returns Promise<OrderResponse<OrderDetailResponse[]>[]>
   */
  getAllOrders: async () => {
    const response = await http.get<Response<OrderResponse<OrderDetailResponse[]>[]>>('/orders');
    return response.data;
  },

  /**
   * Tạo đơn hàng mới từ chi nhánh gửi về bếp trung tâm
   *
   * @param body Thông tin đơn hàng (storeId, deliveryDate, details)
   *
   * @returns Promise<OrderResponse<OrderDetailResponse[]>[]>
   */
  createOrders: async (body: {
    storeId: number;
    deliveryDate: string;
    details: {
      productId: number;
      quantity: number;
    }[];
  }) => {
    const response = await http.post<Response<OrderResponse<OrderDetailResponse[]>[]>>('/orders', body);
    return response.data;
  },
};
