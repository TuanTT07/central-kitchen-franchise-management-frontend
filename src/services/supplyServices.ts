// ================= IMPORT =================
import http from '@/lib/axios';
import { type OrderResponse, type OrderDetailResponse } from './franchiseServices';
import type { Response, PaginatedResponse } from '@/Types/utils.type';
// ================= TYPES =================
/**
 * Đại diện cho một sản phẩm gộp trong quá trình xử lý đơn hàng chi nhánh.
 */
export interface ConsolidationProduct {
  productId: number;
  productName: string;
  quantity: number;
  orderIds: number[];
}

/**
 * Phản hồi từ API gộp đơn hàng.
 */
export interface ConsolidationResponse {
  consolidatedAt: string;
  consolidatedBy: string;
  totalOrders: number;
  orderIds: number[];
  products: ConsolidationProduct[];
}

/**
 * Đại diện cho một item trong lệnh sản xuất.
 */
export interface ItemsResponse {
  manuOrderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  unitName: string;
  status: string;
  startDate: string;
  createdBy: string;
}

/**
 * Chi tiết sản phẩm trong phiếu xuất kho.
 */
export interface ExportNoteItem {
  productId: number;
  productName: string;
  batchCode: string;
  expiryDate: string;
  quantity: number;
  unitName: string;
}

/**
 * Phản hồi thông tin phiếu xuất kho từ API.
 */
export interface ExportNotesResponse {
  exportId: number;
  exportCode: string;
  storeOrderId: number;
  storeName: string;
  status: string;
  exportDate: string;
  items: ExportNoteItem[];
}

/**
 * =========================================================
 * API: Supply Service (Quản lý Cung ứng)
 *
 * Endpoints:
 * GET    /orders                      -> Danh sách đơn hàng từ chi nhánh
 * POST   /orders/consolidate/auto     -> Gộp đơn hàng tự động
 * POST   /orders/consolidate/manual   -> Gộp đơn hàng thủ công
 * POST   /api/v1/manufacturing-orders -> Tạo lệnh sản xuất
 *
 *
 * GET    /export-notes     -> lấy ra danh sách phiếu xuất kho
 *
 * Authorization:
 * Bearer Token
 * =========================================================
 */

export const supplyServices = {
  /**
   * Lấy danh sách tất cả các đơn hàng từ chi nhánh (Franchise Orders)
   *
   * @returns Promise<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>
   */
  getAllOrders: async () => {
    const response = await http.get<Response<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>>('/orders');
    return response.data;
  },

  /**
   * Thực hiện gộp các đơn hàng đã được phê duyệt một cách tự động
   *
   * @returns Promise<ConsolidationResponse> Kết quả gộp đơn
   */
  consolidateAuto: async () => {
    const response = await http.post<Response<ConsolidationResponse>>('/orders/consolidate/auto');
    return response.data;
  },

  /**
   * Thực hiện gộp các đơn hàng được chỉ định một cách thủ công
   *
   * @param orderIds Danh sách ID các đơn hàng cần gộp
   *
   * @returns Promise<ConsolidationResponse> Kết quả gộp đơn
   */
  consolidateManual: async (orderIds: number[]) => {
    const response = await http.post<Response<ConsolidationResponse>>('/orders/consolidate/manual', { orderIds });
    return response.data;
  },

  /**
   * Hủy gộp đơn hàng
   * @param orderIds Danh sách ID các đơn hàng cần hủy gộp
   * @returns Promise<ConsolidationResponse> Kết quả hủy gộp đơn
   */
  cancelConsolidate: async (orderIds: number[]) => {
    const response = await http.post<Response<ConsolidationResponse>>('/orders/consolidate/cancel', {
      orderIds,
    });
    return response.data;
  },

  /**
   * Tạo lệnh sản xuất mới dựa trên danh sách sản phẩm và số lượng
   *
   * @param body Đối tượng chứa mảng các items (productId, quantity)
   *
   * @returns Promise<ItemsResponse[]> Danh sách các item trong lệnh sản xuất vừa tạo
   */
  createManufacturingOrder: async (body: {
    products: {
      productId: number;
      quantityPlanned: number;
    }[];
  }) => {
    const response = await http.post<Response<ItemsResponse[]>>('/api/v1/manufacturing-orders', body);
    return response.data;
  },

  /**
   * Lấy danh sách tất cả các phiếu xuất kho (Export Notes)
   * Hỗ trợ phân trang và lọc dữ liệu.
   *
   * @returns Promise<Response<PaginatedResponse<ExportNotesResponse[]>>>
   */
  getAllExportNote: async () => {
    return await http.get<Response<PaginatedResponse<ExportNotesResponse[]>>>('/export-notes');
  },
  /**
   * Phê duyệt đơn hàng từ chi nhánh
   *
   * @param id ID của đơn hàng cần duyệt
   * @returns Promise<Response<OrderResponse<OrderDetailResponse[]>>>
   */
  approveOrder: async (id: number) => {
    const response = await http.post<Response<OrderResponse<OrderDetailResponse[]>>>(`/orders/${id}/approve`);
    return response.data;
  },
   /**
   * Tạo phiếu xuất kho từ danh sách các storeOrder đã được phê duyệt
   * 
   * @param orderIds Danh sách ID các storeOrder cần tạo phiếu xuất kho
   * @returns Promise<ExportNotesResponse[]> Danh sách các phiếu xuất kho vừa tạo
   */
  createExportNote: async (orderIds: number[]) => {
    const response = await http.post<Response<ExportNotesResponse[]>>('/export-notes/createAutoNote', orderIds);
    return response.data;
  },


  /**
   * Lấy danh sách các storeOrder đủ điều kiện để tạo lệnh sản xuất
   * 
   * @returns Promise<Response<OrderResponse<OrderDetailResponse[]>[]>>
   */
  getStoreOrderReadyForManufacturing: async () => {
    const response = await http.get<Response<OrderResponse<OrderDetailResponse[]>[]>>('/export-notes/ready-orders');
    return response.data;
  },

 
};
