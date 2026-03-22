/**
 * File: franchiseServices.ts
 * Description: Dịch vụ quản lý các hoạt động của chi nhánh (Franchise)
 * Author: Tuan Tran
 */

// ================= IMPORTS =================

import http from '@/lib/axios';
import type { PaginatedResponse, Response } from '@/Types/utils.type';

// ================= TYPES =================

/**
 * Interface Section
 * Định nghĩa cấu trúc dữ liệu cho đơn hàng và phiếu xuất kho của chi nhánh
 */

// Chi tiết sản phẩm trong đơn hàng (Giữ tên cũ cho các page khác)
export interface OrderDetailResponse {
  orderDetailId: number;
  productId: number;
  productName: string;
  unit?: string;
  unitName?: string;
  quantity: number;
}

// Thông tin đơn hàng chi nhánh (Giữ tên cũ cho các page khác)
export interface OrderResponse<T> {
  orderId: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'PENDING' | 'APPROVED' | 'CONSOLIDATED' | 'CANCELLED' | 'IN_TRANSIT' | 'DONE';
  details: T;
}

// Chi tiết sản phẩm trong phiếu xuất kho (Dựa trên JSON mới)
export interface ExportNoteItem {
  productId: number;
  productName: string;
  batchCode: string;
  expiryDate: string;
  quantity: number;
  unitName: string;
}

// Thông tin phiếu xuất kho (Dựa trên JSON mới - Phân trang)
export interface ExportNotesResponse {
  items: ExportNoteItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Trạng thái đơn hàng (Legacy)
export type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';
export type ExportStatus = 'READY' | 'SHIPPED' | 'CANCEL';

/**
 * franchiseServices
 * - Quản lý đơn hàng (Lấy danh sách, tạo mới)
 * - Quản lý phiếu xuất kho
 */

export const franchiseServices = {
  // ================= API =================

  /**
   * Lấy danh sách tất cả các đơn hàng trong hệ thống (Legacy - trả về mảng)
   */
  getAllOrders: async () => {
    const response = await http.get<Response<OrderResponse<OrderDetailResponse[]>[]>>('/orders');
    return response.data;
  },

  /**
   * Lấy danh sách đơn hàng chi nhánh (hỗ trợ phân trang)
   */
  getOrders: async (page: number = 0, size: number = 50) => {
    const response = await http.get<Response<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>>('/orders', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Tạo đơn hàng mới từ chi nhánh gửi về bếp trung tâm
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

    /**
   * Huỷ đơn hàng
   * @param id ID của lệnh sản xuất
   * @returns {Promise<Response<OrderResponse<OrderDetailResponse[]>[]>>}
   */

  cancelOrder: async (id: number, body: {cancelReason: string}) => {
    return (await http.post<Response<OrderResponse<OrderDetailResponse[]>[]>>(`/orders/${id}/cancel`, body)).data;
  },
  
  /**
   * Xác nhận đã nhận đủ hàng cho đơn
   * POST /orders/{id}/receive
   */
  receiveOrder: async (id: number) => {
    return (await http.post<Response<unknown>>(`/orders/${id}/receive`)).data;
  },

  /**
   * Lấy chi tiết một đơn hàng theo ID
   * GET /orders/{id}
   */
  getOrderById: async (id: number) => {
    const response = await http.get<Response<OrderResponse<OrderDetailResponse[]>>>(`/orders/${id}`);
    return response.data;
  },
  /**
   * Lấy danh sách phiếu xuất kho và thông tin lô hàng
   * @returns {Promise<Response<ExportNotesResponse>>}
   */
  getExportNote: async () => {
    const response = await http.get<Response<ExportNotesResponse>>('/export-notes');
    return response.data;
  },

  /**
   * Tạo báo cáo vấn đề giao hàng (Delivery Issue)
   * POST /orders/{id}/reject-delivery
   */
  createDeliveryIssue: async (id: number, formData: FormData) => {
    const response = await http.post<Response<unknown>>(`/orders/${id}/reject-delivery`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

