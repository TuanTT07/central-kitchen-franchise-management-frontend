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
 * Interface cho phản hồi lệnh sản xuất
 */
export interface ManufacturingOrderResponse {
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
    const response = await http.get<Response<PaginatedResponse<InventoryTransactionResponse[]>>>(
      '/inventory-transactions'
    );
    return response.data;
  },
};

