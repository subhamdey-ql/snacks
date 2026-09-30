import { z } from "zod";
import { idSchema } from "@/server/ids";

// qty is a whole number 1..20; anything else is rejected before touching the DB.
export const recordSchema = z.object({
  employeeId: idSchema,
  snackId: idSchema,
  qty: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(20, "Quantity can be at most 20"),
});
export type RecordInput = z.infer<typeof recordSchema>;
