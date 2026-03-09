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
  unit: number;
  unitName: String | null;
  imageUrl: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  categoryName: string;
  categoryId?: number;
}
export interface UnitResponse {
  unitId: number;
  unitName: string;
  description: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

/**
 * =========================================================
 * API: Manager Service (Quản lý Danh mục, Sản phẩm, Đơn vị)
 *
 * Endpoints:
 * Categories: GET, POST, PUT, DELETE /api/v1/categories
 * Products:   GET, POST, PATCH, DELETE /api/v1/products
 * Units:      GET, POST, PATCH, DELETE /api/v1/units
 *
 * Authorization:
 * Bearer Token
 * =========================================================
 */

export const managerServices = {
  // API cho Categories
  /**
   * Lấy danh sách tất cả các danh mục sản phẩm (Categories)
   *
   * @returns Promise<CategoryResponse[]>
   */
  getAllCategories: async () => {
    const res = await http.get<Response<CategoryResponse[]>>('/api/v1/categories');
    return res.data;
  },

  /**
   * Tạo một danh mục sản phẩm mới
   *
   * @param body Thông tin danh mục (categoryName)
   *
   * @returns Promise<CategoryResponse>
   */
  creatCategory: async (body: { categoryName: string }) => {
    const response = await http.post<Response<CategoryResponse>>('/api/v1/categories', body);
    return response.data;
  },

  /**
   * Cập nhật thông tin danh mục sản phẩm hiện có
   *
   * @param id ID của danh mục
   * @param body Thông tin cập nhật (categoryName)
   *
   * @returns Promise<CategoryResponse>
   */
  updateCategory: async (id: number, body: { categoryName: string }) => {
    const response = await http.patch<Response<CategoryResponse>>(`/api/v1/categories/${id}`, body);
    return response.data;
  },

  /**
   * Xóa một danh mục sản phẩm khỏi hệ thống
   *
   * @param id ID của danh mục
   *
   * @returns Promise<string> Thông báo kết quả
   */
  deleteCategory: async (id: number) => {
    const res = await http.delete<Response<string>>(`/api/v1/categories/${id}`);
    return res.data;
  },

  // API cho Products
  /**
   * Lấy danh sách tất cả các sản phẩm (Products)
   *
   * @returns Promise<ProductsResponse[]>
   */
  getAllProducts: async () => {
    const response = await http.get<Response<ProductsResponse[]>>('/api/v1/products');
    return response.data;
  },

  /**
   * Tạo một sản phẩm mới trong hệ thống
   *
   * @param body Thông tin sản phẩm (name, unit, image, desc, category)
   *
   * @returns Promise<ProductsResponse>
   */
  createProduct: async (body: {
    productName: string;
    unitId: number;
    imageUrl: string;
    description: string;
    categoryId: number;
  }) => {
    const response = await http.post<Response<ProductsResponse>>('/api/v1/products', body);
    return response.data;
  },

  /**
   * Cập nhật thông tin sản phẩm hiện có (Partial Update)
   *
   * @param id ID của sản phẩm
   * @param body Các trường thông tin cần cập nhật
   *
   * @returns Promise<any>
   */
  updateProduct: async (
    id: number,
    body: { productName: string; unitId: number; imageUrl: string; description: string; categoryId: number }
  ) => {
    const response = await http.patch(`/api/v1/products/${id}`, body);
    return response.data;
  },

  /**
   * Xóa một sản phẩm khỏi hệ thống
   *
   * @param id ID của sản phẩm
   *
   * @returns Promise<null>
   */
  deleteProduct: async (id: number) => {
    const response = await http.delete<Response<null>>(`/api/v1/products/${id}`);
    return response.data;
  },

  // API của Unit
  /**
   * Lấy danh sách tất cả các đơn vị tính (Units)
   *
   * @returns Promise<UnitResponse[]>
   */
  getAllUnits: async () => {
    const response = await http.get<Response<UnitResponse[]>>('/api/v1/units');
    return response.data;
  },

  /**
   * Tạo một đơn vị tính mới
   *
   * @param body Thông tin đơn vị (unitName, description)
   *
   * @returns Promise<UnitResponse>
   */
  createUnit: async (body: { unitName: string; description: string }) => {
    const response = await http.post<Response<UnitResponse>>('/api/v1/units', body);
    return response.data;
  },

  /**
   * Cập nhật thông tin đơn vị tính (Partial Update)
   *
   * @param id ID của đơn vị
   * @param body Thông tin cập nhật (unitName, description)
   *
   * @returns Promise<UnitResponse>
   */
  updateUnit: async (id: number, body: { unitName: string; description: string }) => {
    const response = await http.patch<Response<UnitResponse>>(`/api/v1/units/${id}`, body);
    return response.data;
  },

  /**
   * Xóa một đơn vị tính khỏi hệ thống
   *
   * @param id ID của đơn vị
   *
   * @returns Promise<null>
   */
  deleteUnit: async (id: number) => {
    const response = await http.delete<Response<null>>(`/api/v1/units/${id}`);
    return response.data;
  },
};
