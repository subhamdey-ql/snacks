import type { CreditBalance } from "@/types/api";
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
  balance: CreditBalance;
  entries: MonthEntry[];
}

export interface RecordDto {
  employeeId: number;
  snackId: number;
  qty: number;
}

export interface DashboardSummary {
  todayEntries: number;
  monthCredits: number;
  monthEmployees: number;
}

