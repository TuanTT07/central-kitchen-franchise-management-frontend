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
export const kitchenServices = {
  getAllOrders: async () => {
    const response = await http.get<Response<ManufacturingOrderResponse[]>>('/api/v1/manufacturing-orders');
    return response.data;
  },
};
