import { EmpType, UserRole } from "@prisma/client";
import { EmployeeType, Role } from "@/types/enums";

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

export const DB_ROLE: Record<Role, UserRole> = {
  [Role.ADMIN]: UserRole.ADMIN,
  [Role.USER]: UserRole.USER,
};

export const APP_ROLE: Record<UserRole, Role> = {
  [UserRole.ADMIN]: Role.ADMIN,
  [UserRole.USER]: Role.USER,
};
