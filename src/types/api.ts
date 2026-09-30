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

// A month's credit position; drives the credit meter (shared by the admin dashboard and the employee wallet).
export interface CreditBalance {
  readonly allowance: number;
  readonly used: number;
  readonly remaining: number;
}
