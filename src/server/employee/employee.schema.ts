import { z } from "zod";
import { EmployeeType } from "@/types/enums";

export const normCode = (s: string): string => s.trim().toUpperCase();
export const normEmail = (s: string): string => s.trim().toLowerCase();

// Login identity: validated as an email, then stored lowercase so lookups and the unique index are case-blind.
export const emailSchema = z.string().trim().min(1, "Enter the email").max(254, "Email is too long").pipe(z.email("Enter a valid email")).transform(normEmail);

export const createEmployeeSchema = z.object({
  code: z.string().min(1, "Enter the employee code").max(30).transform(normCode),
  name: z.string().trim().min(1, "Enter the name").max(100),
  type: z.enum(EmployeeType),
  email: emailSchema,
});
export const updateEmployeeSchema = createEmployeeSchema.partial().extend({ active: z.boolean().optional() });

export const listEmployeeQuerySchema = z.object({
  q: z.string().max(100, "Search is too long").optional(),
  page: z.coerce.number().int().max(100_000, "Page is out of range").optional(),
  limit: z.coerce.number().int().optional(),
  active: z.enum(["true", "false"]).optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeeQuery = z.infer<typeof listEmployeeQuerySchema>;
