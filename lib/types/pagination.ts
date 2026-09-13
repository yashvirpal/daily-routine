export interface PageParams {
  q?: string;
  page?: number; // 1-based
  pageSize?: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
