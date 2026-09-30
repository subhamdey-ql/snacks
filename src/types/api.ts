export interface Pagination {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface Paginated<T> {
  readonly data: readonly T[];
  readonly pagination: Pagination;
}

export interface SelectOption {
  label: string;
  value: string;
}
