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
  /** Đơn giá dòng (BE mới) */
  unitPrice?: number;
  /** Thành tiền dòng (BE mới) */
  lineTotal?: number;
  /** Ghi chú theo dòng */
  note?: string;
}

// Thông tin đơn hàng chi nhánh (Giữ tên cũ cho các page khác)
export interface OrderResponse<T> {
  orderId: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  /** Mã chi nhánh (BE mới) */
  storeCode?: string;
  orderDate: string;
  deliveryDate?: string;
  /** Cho phép mọi trạng thái API (AWAITING_DELIVERY, DELIVERY_ISSUE_PENDING, …) */
  status: string;
  details: T;
  /** Cập nhật lần cuối */
  updatedAt?: string;
  /** Thời điểm duyệt (supply) */
  approvedAt?: string;
  /** Người duyệt — username hoặc tên hiển thị */
  approvedByUsername?: string;
  /** Ghi chú đơn */
  note?: string;
  /** Lý do hủy (khi CANCELLED) */
  cancelReason?: string;
}

/**
 * Chuẩn hóa object đơn từ API (Jackson camelCase hoặc snake_case từ Supabase/Spring).
 */
export function normalizeSupplyOrder<T>(order: OrderResponse<T>): OrderResponse<T> {
  const r = order as OrderResponse<T> & Record<string, unknown>;
  return {
    ...order,
    orderDate: order.orderDate ?? (r.order_date as string | undefined) ?? '',
    storeCode: order.storeCode ?? (r.store_code as string | undefined),
    deliveryDate: order.deliveryDate ?? (r.delivery_date as string | undefined),
    updatedAt: order.updatedAt ?? (r.updated_at as string | undefined),
    approvedAt: order.approvedAt ?? (r.approved_at as string | undefined),
    approvedByUsername: order.approvedByUsername ?? (r.approved_by_username as string | undefined),
    note: order.note ?? (r.notes as string | undefined) ?? (r.order_note as string | undefined),
    cancelReason: order.cancelReason ?? (r.cancel_reason as string | undefined),
  };
}

export function normalizeOrderDetailLine(d: OrderDetailResponse): OrderDetailResponse {
  const r = d as OrderDetailResponse & Record<string, unknown>;
  return {
    ...d,
    unitName: d.unitName ?? d.unit ?? (r.unit_name as string | undefined),
    unitPrice: d.unitPrice ?? (r.unit_price as number | undefined),
    lineTotal: d.lineTotal ?? (r.line_total as number | undefined),
    note: d.note ?? (r.line_note as string | undefined),
  };
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

