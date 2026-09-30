import { z } from "zod";
import type { Snack } from "@/modules/snacks/types";

export const snackSchema = z.object({
  name: z.string().trim().min(1, "Enter a snack name").max(60, "At most 60 characters"),
  credits: z.coerce.number().int().min(1, "At least 1 credit"),
});
// z.coerce makes the input type `unknown` for credits; the form holds a string, submit receives the number.
export type SnackFormValues = z.input<typeof snackSchema>;
export type SnackFormType = z.output<typeof snackSchema>;
export const snackDefaults = (snack?: Snack): SnackFormValues => ({ name: snack?.name ?? "", credits: snack?.credits ?? "" });
