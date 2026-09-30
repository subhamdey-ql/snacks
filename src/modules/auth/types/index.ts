import type { Role } from "@/types/enums";

export interface RequestOtpDto {
  email: string;
}

// devCode is present only in local development (no email key configured); never on a real deployment.
export interface RequestOtpResult {
  ok: boolean;
  devCode?: string;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
}

export interface VerifyOtpResult {
  role: Role;
}
