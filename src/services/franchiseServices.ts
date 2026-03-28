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
  /** BE có thể trả thêm */
  unitPrice?: number;
  lineTotal?: number;
  note?: string;
}

/** Trạng thái đơn từ API (mở rộng theo BE / supply). */
type StoreOrderStatusExtended =
  | 'PENDING'
  | 'APPROVED'
  | 'CONSOLIDATED'
  | 'CANCELLED'
  | 'IN_TRANSIT'
  | 'DONE'
  | 'AWAITING_DELIVERY'
  | 'DELIVERY_ISSUE_PENDING';

// Thông tin đơn hàng chi nhánh (Giữ tên cũ cho các page khác)
export interface OrderResponse<T> {
  orderId: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  /** Mã cửa hàng / chi nhánh (BE mới) */
  storeCode?: string;
  orderDate: string;
  deliveryDate?: string;
  /** ISO — BE có thể tách với orderDate */
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedByUsername?: string;
  /** Ghi chú đơn (BE có thể dùng orderNote hoặc note) */
  orderNote?: string;
  note?: string;
  /** Tổng tiền ước tính (nếu BE tính) */
  totalAmount?: number;
  status: StoreOrderStatusExtended;
  details: T;
}

/** Ngày đặt hiển thị: ưu tiên orderDate, sau đó createdAt. */
export function resolveOrderPlacedAt(order: Pick<OrderResponse<unknown>, 'orderDate' | 'createdAt'>): string | undefined {
  return order.orderDate?.trim() || order.createdAt?.trim() || undefined;
}

/** Ghi chú đơn: BE có thể gửi orderNote hoặc note. */
export function getOrderNoteText(order: Pick<OrderResponse<unknown>, 'orderNote' | 'note'>): string | undefined {
  const t = (order.orderNote ?? order.note)?.trim();
  return t || undefined;
}

/**
 * franchiseServices — đơn hàng chi nhánh (phiếu xuất dùng `supplyServices`).
 */
export const franchiseServices = {
  // ================= API =================

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

