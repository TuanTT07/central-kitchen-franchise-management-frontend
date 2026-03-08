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
 * =========================================================
 * API: Kitchen Service
 *
 * Endpoints:
 * GET    /api/v1/manufacturing-orders -> Danh sách lệnh sản xuất
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
};
