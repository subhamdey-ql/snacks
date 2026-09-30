import { z } from "zod";

export const emailFormSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").max(254, "At most 254 characters").pipe(z.email("Enter a valid email")),
});
export type EmailFormType = z.infer<typeof emailFormSchema>;
export const emailFormDefaults = (): EmailFormType => ({ email: "" });

export const codeFormSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });
export type CodeFormType = z.infer<typeof codeFormSchema>;
export const codeFormDefaults = (): CodeFormType => ({ code: "" });

// A fresh code can be requested this many seconds after the last one (the server enforces the same 60 s).
export const RESEND_SECONDS = 60;
