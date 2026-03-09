import http from '@/lib/axios';
import type { Response } from '@/Types/utils.type';

export interface ManufacturingOrderResponse {
  manuOrderId: 0;
  orderCode: string;
  productName: string;
  quantity: 0;
  unitName: string;
  status: string;
  startDate: string;
  createdBy: string;
}

/**
 * Định nghĩa các trạng thái của Lô hàng (Product Batch)
 */
export type ProductBatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';

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
 * =========================================================
 * API: Kitchen Service
 *
 * Endpoints:
 * GET    /api/v1/manufacturing-orders -> Danh sách lệnh sản xuất
 *
 * GET    /api/v1/product-batches  -> lấy danh sách lô hàng
 *
 * Authorization:
 * Bearer Token
 * =========================================================
 */

export const kitchenServices = {
  /**
   * Lấy danh sách tất cả các lệnh sản xuất cho bếp
   *
   * @returns Promise<ManufacturingOrderResponse[]> Dữ liệu trả về từ API
   */
  getAllOrders: async () => {
    const response = await http.get<Response<ManufacturingOrderResponse[]>>('/api/v1/manufacturing-orders');
    return response.data;
  },

  /**
   * Lấy danh sách tất cả các lô sản xuất
   *
   * @returns  Promise<Response<ProductBatchesResponse[]>>
   */

  getAllProductBatches: async () => {
    return await http.get<Response<ProductBatchesResponse[]>>('/api/v1/product-batches');
  },
};
