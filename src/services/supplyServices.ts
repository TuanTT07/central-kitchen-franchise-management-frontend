import http from '@/lib/axios';
import { type OrderResponse, type OrderDetailResponse } from './franchiseServices';
import type { Response, PaginatedResponse } from '@/Types/utils.type';
export interface ConsolidationProduct {
  productId: number;
  productName: string;
  quantity: number;
  orderIds: number[];
}

export interface ConsolidationResponse {
  consolidatedAt: string;
  consolidatedBy: string;
  totalOrders: number;
  orderIds: number[];
  products: ConsolidationProduct[];
}
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

export const supplyServices = {
  getAllOrders: async () => {
    const response = await http.get<Response<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>>('/orders');
    return response.data;
  },
  consolidateAuto: async () => {
    const response = await http.post<Response<ConsolidationResponse>>('orders/consolidate/auto');
    return response.data;
  },
  consolidateManual: async (orderIds: number[]) => {
    const response = await http.post<Response<ConsolidationResponse>>('orders/consolidate/manual', { orderIds });
    return response.data;
  },

  // Tạo lệnh sản xuất
  createManufacturingOrder: async (body: {
    items: {
      productId: number;
      quantity: number;
    }[];
  }) => {
    const response = await http.post<Response<ItemsResponse[]>>('/api/v1/manufacturing-orders', body);
    return response.data;
  },
};
