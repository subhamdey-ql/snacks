import type { EmployeeType } from "@/types/enums";

export interface EmployeeHit {
  id: number;
  code: string;
  name: string;
  type: EmployeeType;
}

export interface SnackOption {
  id: number;
  name: string;
  credits: number;
}

export interface Balance {
  allowance: number;
  used: number;
  remaining: number;
}

// Dates arrive as ISO strings over JSON.
export interface MonthEntry {
  id: number;
  snackName: string;
  qty: number;
  creditsCharged: number;
  createdAt: string;
  voidedAt: string | null;
}

export interface EmployeeMonth {
  employee: EmployeeHit & { active: boolean };
  balance: Balance;
  entries: MonthEntry[];
}

export interface RecordDto {
  employeeId: number;
  snackId: number;
  qty: number;
}
