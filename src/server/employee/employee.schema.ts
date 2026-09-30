import { z } from "zod";
import { EmployeeType } from "@/types/enums";

export const normCode = (s: string): string => s.trim().toUpperCase();

export const createEmployeeSchema = z.object({
  code: z.string().min(1, "Enter the employee code").max(30).transform(normCode),
  name: z.string().trim().min(1, "Enter the name").max(100),
  type: z.enum(EmployeeType),
});
export const updateEmployeeSchema = createEmployeeSchema.partial().extend({ active: z.boolean().optional() });

export const listEmployeeQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
  active: z.enum(["true", "false"]).optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeeQuery = z.infer<typeof listEmployeeQuerySchema>;
