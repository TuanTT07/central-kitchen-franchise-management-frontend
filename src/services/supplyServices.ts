import http from '@/lib/axios';
import { type OrderResponse, type OrderDetailResponse } from './franchiseServices';
import type { Response, PaginatedResponse } from '@/Types/utils.type';

export const supplyServices = {
  getAllOrders: async () => {
    const response = await http.get<Response<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>>('/orders');
    return response.data;
  },
};
