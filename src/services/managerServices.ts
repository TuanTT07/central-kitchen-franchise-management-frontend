import http from '../lib/axios';
import type { Response } from '../Types/utils.type';

export interface categoryResponse {
    categoryId: number;
    categoryName: string;
}

export const managerServices = {
    getAllCategories: async () => {
        const res = await http.get<Response<categoryResponse[]>>('/api/v1/categories');
        return res.data;
    }
}
