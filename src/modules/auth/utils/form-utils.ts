import { z } from "zod";

export const loginSchema = z.object({ password: z.string().min(1, "Enter the password") });
export type LoginFormType = z.infer<typeof loginSchema>;
export const loginDefaults = (): LoginFormType => ({ password: "" });
