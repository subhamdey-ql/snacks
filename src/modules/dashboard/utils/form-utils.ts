import { z } from "zod";

export const recordSchema = z.object({
  snackId: z.string().min(1, "Pick a snack"),
  qty: z.coerce.number().int().min(1, "At least 1").max(20, "At most 20"),
});
// z.coerce makes the input type `unknown` for qty; the form holds a string, submit receives the number.
export type RecordValues = z.input<typeof recordSchema>;
export type RecordType = z.output<typeof recordSchema>;
export const recordDefaults = (): RecordValues => ({ snackId: "", qty: 1 });
