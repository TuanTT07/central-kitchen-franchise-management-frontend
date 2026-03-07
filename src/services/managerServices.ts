import http from '../lib/axios';
import type { Response } from '../Types/utils.type';

export interface CategoryResponse {
  categoryId: number;
  categoryName: string;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface ProductsResponse {
  productId: number;
  productName: string;
  unit: string;
  imageUrl: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  categoryName: string;
  categoryId?: number;
}
export interface UnitResponse {
  unitId: number;
  unitName: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const managerServices = {
  // API cho Categories
  getAllCategories: async () => {
    const res = await http.get<Response<CategoryResponse[]>>('/api/v1/categories');
    return res.data;
  },
  creatCategory: async (body: { categoryName: string }) => {
    const response = await http.post<Response<CategoryResponse>>('/api/v1/categories', body);
    return response.data;
  },
  updateCategory: async (id: number, body: { categoryName: string }) => {
    const response = await http.put<Response<CategoryResponse>>(`/api/v1/categories/${id}`, body);
    return response.data;
  },
  deleteCategory: async (id: number) => {
    const res = await http.delete<Response<string>>(`/api/v1/categories/${id}`);
    return res.data;
  },

  // API cho Products
  getAllProducts: async () => {
    const response = await http.get<Response<ProductsResponse[]>>('/api/v1/products');
    return response.data;
  },
  createProduct: async (body: {
    productName: string;
    unit: string;
    imageUrl: string;
    description: string;
    categoryId: number;
  }) => {
    const response = await http.post<Response<ProductsResponse>>('/api/v1/products', body);
    return response.data;
  },
  updateProduct: async (
    id: number,
    body: { productName: string; unit: string; imageUrl: string; description: string; categoryId: number }
  ) => {
    const response = await http.patch(`/api/v1/products/${id}`, body);
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await http.delete<Response<null>>(`/api/v1/products/${id}`);
    return response.data;
  },
  // API của Unit
  getAllUnits: async () => {
    const response = await http.get<Response<UnitResponse[]>>('/api/v1/units');
    return response.data;
  },
};
