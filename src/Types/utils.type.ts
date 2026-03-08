export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
  error: string;
}

export interface PaginatedResponse<T> {
  items: T;
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
// bởi vì backend trả về content là 1 object chứa các thông tin phân trang
export interface SpringPageResponse<T> {
  data: T;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
