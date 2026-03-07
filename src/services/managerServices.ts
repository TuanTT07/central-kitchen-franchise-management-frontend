import http from '../lib/axios';
import type { Response } from '../Types/utils.type';

export interface categoryResponse {
  categoryId: number;
  categoryName: string;
}
export interface productsResponse {
  productId: number;
  productName: string;
  unit: string;
  imageUrl: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  categoryName: string;
  categoryID?: number;
}

export const managerServices = {
  // API cho Categories
  getAllCategories: async () => {
    const res = await http.get<Response<categoryResponse[]>>('/api/v1/categories');
    return res.data;
  },
  creatCategory: async (body: { categoryName: string }) => {
    const response = await http.post<Response<categoryResponse>>('/api/v1/categories', body);
    return response.data;
  },
  updateCategory: async (id: number, body: { categoryName: string }) => {
    const response = await http.put<Response<categoryResponse>>(`/api/v1/categories/${id}`, body);
    return response.data;
  },
  deleteCategory: async (id: number) => {
    const res = await http.delete<Response<string>>(`/api/v1/categories/${id}`);
    return res.data;
  },

  // API cho Products
  getAllProducts: async () => {
    const response = await http.get<Response<productsResponse[]>>('/api/v1/products');
    return response.data;
  },
  createProduct: async (body: {
    productName: string;
    unit: string;
    imageUrl: string;
    description: string;
    categoryId: number;
  }) => {
    const response = await http.post<Response<productsResponse>>('/api/v1/products', body);
    return response.data;
  },
};
