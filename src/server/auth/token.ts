import { createHmac, timingSafeEqual } from "crypto";
import { requireEnv } from "@/server/env";
import { Role } from "@/types/enums";

export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

export interface SessionClaims {
  readonly employeeId: number;
  readonly role: Role;
}

const sign = (value: string): string => createHmac("sha256", requireEnv("SESSION_SECRET")).update(value).digest("hex");

// Constant-time compare so timing cannot leak how much of a secret matched.
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const isRole = (v: string): v is Role => Object.values<string>(Role).includes(v);

// Token = "<role>.<employeeId>.<expiresAtMs>.<hmac of the first three parts>".
// The role inside is only a hint for routing; every request re-reads the employee (see session.ts getSession).
export function makeToken(claims: SessionClaims, now = Date.now()): string {
  const body = `${claims.role}.${claims.employeeId}.${now + SESSION_TTL_MS}`;
  return `${body}.${sign(body)}`;
}

export function readToken(token: string | undefined, now = Date.now()): SessionClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [role = "", id = "", exp = "", sig = ""] = parts;
  if (!isRole(role) || !/^\d{1,10}$/.test(id) || !/^\d{1,16}$/.test(exp) || !sig) return null;
  if (!safeEqual(sig, sign(`${role}.${id}.${exp}`)) || Number(exp) <= now) return null;
  return { role, employeeId: Number(id) };
}
