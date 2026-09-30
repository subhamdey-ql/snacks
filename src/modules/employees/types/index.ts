import type { EmployeeType } from "@/types/enums";

export interface Employee {
  id: number;
  code: string;
  name: string;
  type: EmployeeType;
  // Null only for employees created before V2; they cannot log in until an email is added.
  email: string | null;
  active: boolean;
}

export interface SaveEmployeeDto {
  id?: number;
  code: string;
  name: string;
  type: EmployeeType;
  email?: string;
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
