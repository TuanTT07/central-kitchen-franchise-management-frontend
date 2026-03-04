export interface Response<T> {
  message: string;
  data: T;
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
