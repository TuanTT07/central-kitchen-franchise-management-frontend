import http from '@/lib/axios';
import type { Response } from '@/Types/utils.type';

export interface OrderDetailResponse {
  orderDetailId: number;
  productId: number;
  productName: string;
  unit: string;
  quantity: number;
}

export interface OrderResponse<T> {
  orderId: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  orderDate: string;
  deliveryDate: string;
  status: 'PENDING' | 'APPROVED' | 'CONSOLIDATED' | 'CANCELLED';
  details: T;
}

export const franchiseServices = {
  // Đơn hàng
  getAllOrders: async () => {
    const response = await http.get<Response<OrderResponse<OrderDetailResponse[]>[]>>('/orders');
    return response.data;
  },
};
