/**
 * ========================================================================
 * COMPONENT: Manager Services
 * DESCRIPTION: Cung cấp các phương thức gọi API cho phía Manager bao gồm
 *              Quản lý Danh mục, Sản phẩm, Đơn vị và Tồn kho.
 * ========================================================================
 */

import http from '../lib/axios';
import type { PaginatedResponse, Response } from '../Types/utils.type';

/* ========================================================================
   [TYPES] - Định nghĩa các Interface và Type cho dữ liệu API
   ======================================================================== */

/**
 * Interface cho thông tin chi tiết của một lô sản phẩm
 */
export interface ProductBatchDetail {
  batchId: number;
  batchCode: string;
  productName: string;
  currentQuantity: number;
  initialQuantity: number;
  unitName: string;
  expiryDate: string;
  status: string;
}

/**
 * Interface cho thông tin báo cáo tồn kho của một sản phẩm
 */
export interface InventoryReportResponse {
  productName: string;
  productId: number;
  batchId: number;
  expiryDate: string;
  warning: string;
  unit: string;
  totalStock: number;
  productBatch: ProductBatchDetail[];
}

/**
 * Interface cho danh mục sản phẩm
 */
export interface CategoryResponse {
  categoryId: number;
  categoryName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Interface cho sản phẩm
 */
export interface ProductsResponse {
  productId: number;
  productName: string;
  unit: number;
  unitName: string | null;
  imageUrl: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  categoryName: string;
  categoryId?: number;
}

/**
 * Interface cho đơn vị tính
 */
export interface UnitResponse {
  unitId: number;
  unitName: string;
  description: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

/* ========================================================================
   [API] - Khai báo các đối tượng dịch vụ API
   ======================================================================== */

export const managerServices = {
  /* --- Nhóm API Quản lý Danh mục (Categories) --- */

  /**
   * Lấy danh sách tất cả các danh mục sản phẩm
   * @returns {Promise<Response<CategoryResponse[]>>}
   */
  getAllCategories: async () => {
    const res = await http.get<Response<CategoryResponse[]>>('/api/v1/categories');
    return res.data;
  },

  /**
   * Tạo một danh mục sản phẩm mới
   * @param {{ categoryName: string }} body
   * @returns {Promise<Response<CategoryResponse>>}
   */
  creatCategory: async (body: { categoryName: string }) => {
    const response = await http.post<Response<CategoryResponse>>('/api/v1/categories', body);
    return response.data;
  },

  /**
   * Cập nhật thông tin danh mục sản phẩm hiện có
   * @param {number} id
   * @param {{ categoryName: string }} body
   * @returns {Promise<Response<CategoryResponse>>}
   */
  updateCategory: async (id: number, body: { categoryName: string }) => {
    const response = await http.patch<Response<CategoryResponse>>(`/api/v1/categories/${id}`, body);
    return response.data;
  },

  /**
   * Xóa một danh mục sản phẩm khỏi hệ thống
   * @param {number} id
   * @returns {Promise<Response<string>>}
   */
  deleteCategory: async (id: number) => {
    const res = await http.delete<Response<string>>(`/api/v1/categories/${id}`);
    return res.data;
  },

  /* --- Nhóm API Quản lý Sản phẩm (Products) --- */

  /**
   * Lấy danh sách tất cả các sản phẩm
   * @returns {Promise<Response<ProductsResponse[]>>}
   */
  getAllProducts: async () => {
    const response = await http.get<Response<ProductsResponse[]>>('/api/v1/products');
    return response.data;
  },

  /**
   * Tạo một sản phẩm mới
   * @param {Object} body
   * @returns {Promise<Response<ProductsResponse>>}
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
   * Cập nhật thông tin sản phẩm (Partial Update)
   * @param {number} id
   * @param {Object} body
   * @returns {Promise<any>}
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
   * @param {number} id
   * @returns {Promise<Response<null>>}
   */
  deleteProduct: async (id: number) => {
    const response = await http.delete<Response<null>>(`/api/v1/products/${id}`);
    return response.data;
  },

  /* --- Nhóm API Quản lý Đơn vị (Units) --- */

  /**
   * Lấy danh sách tất cả các đơn vị tính
   * @returns {Promise<Response<UnitResponse[]>>}
   */
  getAllUnits: async () => {
    const response = await http.get<Response<UnitResponse[]>>('/api/v1/units');
    return response.data;
  },

  /**
   * Tạo một đơn vị tính mới
   * @param {{ unitName: string; description: string }} body
   * @returns {Promise<Response<UnitResponse>>}
   */
  createUnit: async (body: { unitName: string; description: string }) => {
    const response = await http.post<Response<UnitResponse>>('/api/v1/units', body);
    return response.data;
  },

  /**
   * Cập nhật thông tin đơn vị tính
   * @param {number} id
   * @param {{ unitName: string; description: string }} body
   * @returns {Promise<Response<UnitResponse>>}
   */
  updateUnit: async (id: number, body: { unitName: string; description: string }) => {
    const response = await http.patch<Response<UnitResponse>>(`/api/v1/units/${id}`, body);
    return response.data;
  },

  /**
   * Xóa một đơn vị tính khỏi hệ thống
   * @param {number} id
   * @returns {Promise<Response<null>>}
   */
  deleteUnit: async (id: number) => {
    const response = await http.delete<Response<null>>(`/api/v1/units/${id}`);
    return response.data;
  },

  /* --- Nhóm API Báo cáo Tồn kho (Inventory) --- */

  /**
   * Lấy báo cáo tổng quan tồn kho của trung tâm
   * @returns {Promise<Response<PaginatedResponse<InventoryReportResponse>>>}
   */
  getInventoryStock: async () => {
    const response = await http.get<Response<PaginatedResponse<InventoryReportResponse>>>(
      '/inventory-reports/stock-summary'
    );
    return response;
  },
};

