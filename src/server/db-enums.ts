import { EmpType } from "@prisma/client";
import { EmployeeType } from "@/types/enums";

// The one place the app enum meets Prisma's generated enum.
export const DB_TYPE: Record<EmployeeType, EmpType> = {
  [EmployeeType.WFO]: EmpType.WFO,
  [EmployeeType.HYBRID]: EmpType.HYBRID,
};

// Reverse mapping; Record<EmpType, ...> makes it exhaustive at compile time.
export const APP_TYPE: Record<EmpType, EmployeeType> = {
  [EmpType.WFO]: EmployeeType.WFO,
  [EmpType.HYBRID]: EmployeeType.HYBRID,
};
