import type { CreditBalance } from "@/types/api";
import type { EmployeeType } from "@/types/enums";

export interface MyMenuItem {
  snackId: number;
  name: string;
  credits: number;
  affordable: boolean;
}

export interface MyMenu {
  date: string;
  remaining: number;
  items: MyMenuItem[];
}

// Dates arrive as ISO strings over JSON.
export interface MyEntry {
  id: number;
  snackName: string;
  qty: number;
  creditsCharged: number;
  createdAt: string;
  voidedAt: string | null;
}

export interface MyWallet {
  employee: { id: number; code: string; name: string; type: EmployeeType; active: boolean };
  balance: CreditBalance;
  entries: MyEntry[];
  month: string;
  resetsOn: string;
}
