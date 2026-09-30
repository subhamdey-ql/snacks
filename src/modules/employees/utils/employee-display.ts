import { BadgeTone, EmployeeType } from "@/types/enums";

// Badge tone + short label per employee type: office = blue (info), hybrid = warm (warning).
export const EMPLOYEE_TYPE_BADGE: Readonly<Record<EmployeeType, { readonly tone: BadgeTone; readonly label: string }>> = {
  [EmployeeType.WFO]: { tone: BadgeTone.INFO, label: "WFO" },
  [EmployeeType.HYBRID]: { tone: BadgeTone.WARNING, label: "Hybrid" },
};

// The header's "Import CSV" button opens this file input's picker directly.
export const EMPLOYEE_CSV_INPUT_ID = "employee-csv-file";
