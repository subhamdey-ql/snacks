import { z } from "zod";
import type { Employee } from "@/modules/employees/types";
import type { SelectOption } from "@/types/api";
import { EmployeeType } from "@/types/enums";

export const employeeSchema = z.object({
  code: z.string().trim().min(1, "Enter the employee code").max(30, "At most 30 characters"),
  name: z.string().trim().min(1, "Enter the name").max(100, "At most 100 characters"),
  // The select starts as "" (nothing chosen); the pipe narrows the string to EmployeeType on submit.
  type: z.string().min(1, "Choose a type").pipe(z.enum(EmployeeType)),
});
export type EmployeeFormValues = z.input<typeof employeeSchema>;
export type EmployeeFormType = z.output<typeof employeeSchema>;
export const employeeDefaults = (e?: Employee): EmployeeFormValues => ({
  code: e?.code ?? "",
  name: e?.name ?? "",
  type: e?.type ?? "",
});
export const employeeTypeOptions: SelectOption[] = [
  { label: "Work from office", value: EmployeeType.WFO },
  { label: "Hybrid", value: EmployeeType.HYBRID },
];
