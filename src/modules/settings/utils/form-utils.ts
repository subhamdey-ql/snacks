import { z } from "zod";
import { EmployeeType } from "@/types/enums";
import type { AllowanceMap } from "@/modules/settings/types";

// Strings in the form (an empty input must not become 0); the submit handler converts to numbers.
const credit = z
  .string()
  .trim()
  .min(1, "Enter a number")
  .refine((v) => Number.isInteger(Number(v)), "Credits must be a whole number")
  .refine((v) => Number(v) >= 0, "Cannot be negative")
  .refine((v) => Number(v) <= 10000, "Cannot exceed 10000");
export const allowanceSchema = z.object({
  [EmployeeType.WFO]: credit,
  [EmployeeType.HYBRID]: credit,
});
export type AllowanceFormValues = z.input<typeof allowanceSchema>;
export type AllowanceFormType = z.output<typeof allowanceSchema>;
export const allowanceDefaults = (data?: AllowanceMap): AllowanceFormValues => ({
  [EmployeeType.WFO]: data ? String(data[EmployeeType.WFO]) : "",
  [EmployeeType.HYBRID]: data ? String(data[EmployeeType.HYBRID]) : "",
});
