import type { EmployeeType } from "@/types/enums";

export interface Employee {
  id: number;
  code: string;
  name: string;
  type: EmployeeType;
  active: boolean;
}

export interface SaveEmployeeDto {
  id?: number;
  code: string;
  name: string;
  type: EmployeeType;
  active?: boolean;
}

export interface EmployeeListQuery {
  q?: string;
  page: number;
  limit: number;
}

export interface ImportResult {
  imported: number;
  errors: string[];
}
