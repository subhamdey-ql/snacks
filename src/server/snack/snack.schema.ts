import { z } from "zod";

export const createSnackSchema = z.object({
  name: z.string().trim().min(1, "Enter a snack name").max(60),
  credits: z.coerce.number().int("Credits must be a whole number").min(1).max(1000),
});
export const updateSnackSchema = createSnackSchema.partial().extend({ active: z.boolean().optional() });
export const listSnackQuerySchema = z.object({ includeInactive: z.enum(["true", "false"]).optional() });
export type CreateSnackInput = z.infer<typeof createSnackSchema>;
export type UpdateSnackInput = z.infer<typeof updateSnackSchema>;
