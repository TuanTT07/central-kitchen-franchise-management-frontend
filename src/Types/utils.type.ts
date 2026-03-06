export interface Response<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: T | null;
}

export interface PaginatedResponse<T> {
  content: T;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
