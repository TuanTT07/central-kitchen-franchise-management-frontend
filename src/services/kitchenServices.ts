/**
 * ========================================================================
 * COMPONENT: Kitchen Services
 * DESCRIPTION: Cung cấp các phương thức gọi API cho phía Bếp trung tâm (Central Kitchen)
 *              bao gồm Quản lý Lệnh sản xuất, Lô hàng và Giao dịch kho.
 * ========================================================================
 */

import http from '@/lib/axios';
import type { PaginatedResponse, Response } from '@/Types/utils.type';

/* ========================================================================
   [TYPES] - Định nghĩa các Interface và Type cho dữ liệu API
   ======================================================================== */

/**
 * Định nghĩa các trạng thái của Manufacturing Order
 */

export type ManuOrderStatus = 'PLANNED' | 'COOKING' | 'COMPLETED';

/**
 * Interface cho phản hồi lệnh sản xuất
 */
export interface ManufacturingOrderResponse {
  manuOrderId: number;
  orderCode: string;
  productId: number;
  productName: string;
  unitName: string;
  quantityPlanned: number;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createById: number;
  createByName: string;
}

/**
 * Định nghĩa các trạng thái của Lô hàng (Product Batch)
 */
export type ProductBatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';

/**
 * Interface cho phản hồi danh sách lô hàng
 */
export interface ProductBatchesResponse {
  batchId: number;
  batchCode: string;
  productName: string;
  currentQuantity: number;
  initialQuantity: number;
  unitName: string;
  expiryDate: string;
  status: ProductBatchStatus;
}

/**
 * Type cho các loại giao dịch kho
 */
export type TransactionType = 'IMPORT' | 'EXPORT' | 'ADJUST';

/**
 * Type cho nguồn của giao dịch kho
 */
export type TransactionSource = 'RECEIPT' | 'EXPORT_NOTE' | 'MANUAL';

/**
 * Interface cho phản hồi giao dịch tồn kho
 */
export interface InventoryTransactionResponse {
  transactionId: number;
  productName: string;
  batchCode: string;
  transactionType: TransactionType;
  quantity: number;
  unit: string;
  referenceCode: string;
  transactionDate: string;
  createdByFullName: string;
  note: string;
}

/**
 * Interface cho phản hồi biên lai nhập kho (inventory_receipts)
 * Dùng cho API GET /api/v1/inventory-receipts
 */
export interface InventoryReceiptApi {
  receiptId: number;
  receiptCode: string;
  receiptDate: string | null;
  status: 'DRAFT' | 'COMPLETED';
  createdById: number;
  createdByName: string;
  items?: {
    receiptItemId: number;
    quantity: number;
    batchId: number;
    batchCode: string;
  }[];
}

/* ========================================================================
   [API] - Khai báo các đối tượng dịch vụ API
   ======================================================================== */

export const kitchenServices = {
  /* --- Nhóm API Quản lý Lệnh sản xuất (Manufacturing Orders) --- */

  /**
   * Lấy danh sách tất cả các lệnh sản xuất
   * @returns {Promise<Response<ManufacturingOrderResponse[]>>}
   */
  getAllOrders: async () => {
    const response = await http.get<Response<ManufacturingOrderResponse[]>>('/api/v1/manufacturing-orders');
    return response.data;
  },
  /**
   * Cập nhật trạng thái lệnh sản xuất
   * @param id ID của lệnh sản xuất
   * @returns {Promise<Response<ManufacturingOrderResponse>>}
   */

  updateStatusOrder: async (id: number) => {
    const response = await http.patch<Response<ManufacturingOrderResponse>>(
      `/api/v1/manufacturing-orders/${id}/status`
    );
    return response.data;
  },

  /* --- Nhóm API Quản lý Lô hàng (Product Batches) --- */

  /**
   * Lấy danh sách tất cả các lô sản phẩm
   * @returns {Promise<Response<ProductBatchesResponse[]>>}
   */
  getAllProductBatches: async () => {
    const response = await http.get<Response<ProductBatchesResponse[]>>('/api/v1/product-batches');
    return response.data;
  },

  /* --- Nhóm API Giao dịch Kho (Inventory Transactions) --- */

  /**
   * Lấy danh sách nhật ký giao dịch tồn kho (Sổ cái kho)
   * @returns {Promise<Response<PaginatedResponse<InventoryTransactionResponse>>>}
   */
  getInventoryTransaction: async () => {
    const response =
      await http.get<Response<PaginatedResponse<InventoryTransactionResponse[]>>>('/inventory-transactions');
    return response.data;
  },

  /**
   * Nhập kho thủ công cho lô hàng
   * @param productBatchId ID của lô hàng
   * @param quantity Số lượng cần nhập
   * @returns {Promise<Response<InventoryTransactionResponse>>}
   */
  manualStockIn: async (body: { productBatchId: number; quantity: number }[]) => {
    const response = await http.post<Response<InventoryTransactionResponse>>('/api/v1/inventory-receipts', {items: body});
    return response.data;
  },

  /* --- Nhóm API Biên lai nhập kho (Inventory Receipts) --- */

  /**
   * Lấy danh sách lịch sử phiếu nhập kho
   * GET /api/v1/inventory-receipts
   */
  getInventoryReceipts: async () => {
    const response = await http.get<Response<InventoryReceiptApi[]>>('/api/v1/inventory-receipts');
    return response.data;
  },

  /**
   * Lấy chi tiết một biên lai nhập kho theo ID
   * GET /api/v1/inventory-receipts/:id
   */
  getInventoryReceiptById: async (id: number) => {
    const response = await http.get<Response<InventoryReceiptApi>>(`/api/v1/inventory-receipts/${id}`);
    return response.data;
  },
};
