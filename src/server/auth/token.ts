import { createHmac, timingSafeEqual } from "crypto";
import { requireEnv } from "@/server/env";

export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

const sign = (value: string): string => createHmac("sha256", requireEnv("SESSION_SECRET")).update(value).digest("hex");

// Constant-time compare so timing cannot leak how much of a secret matched.
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function makeToken(now = Date.now()): string {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function checkToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [exp, sig] = parts;
  if (!exp || !sig) return false;
  return safeEqual(sig, sign(exp)) && Number(exp) > now;
}

export function passwordOk(password: string): boolean {
  return safeEqual(password, requireEnv("ADMIN_PASSWORD"));
}
