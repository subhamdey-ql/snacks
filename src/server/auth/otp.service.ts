import { createHmac, randomInt } from "crypto";
import { db } from "@/server/db";
import { APP_ROLE } from "@/server/db-enums";
import { HttpError } from "@/server/http";
import { sendOtpEmail } from "@/server/email/email.service";
import { requireEnv } from "@/server/env";
import { safeEqual, type SessionClaims } from "@/server/auth/token";

const CODE_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
// Per-address send caps, enforced from the OtpCode table itself so one mailbox cannot be flooded.
const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS_PER_HOUR = 5;

const invalid = (): HttpError => new HttpError(401, "Invalid or expired code");

// Keyed hash: a leaked table cannot be used to recover codes, and a code is only valid for the email it was sent to.
const hashCode = (email: string, code: string): string =>
  createHmac("sha256", requireEnv("SESSION_SECRET"))
    .update(`${email}:${code}`)
    .digest("hex");

// Creates and emails a code when the address belongs to an active employee; otherwise does nothing at all.
// Returns the code that was issued (null when nothing was sent) ONLY so the route can show it in local development;
// the route never reveals it otherwise. Callers answer identically either way, so real deployments cannot be used
// to find out who has an account.
export async function requestOtp(
  email: string,
  now = new Date(),
): Promise<string | null> {
  const emp = await db.employee.findUnique({
    where: { email },
    select: { active: true },
  });
  if (!emp?.active) return null;
  const recent = await db.otpCode.findMany({
    where: { email, createdAt: { gt: new Date(now.getTime() - 3_600_000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const last = recent[0];
  if (
    recent.length >= MAX_SENDS_PER_HOUR ||
    (last && now.getTime() - last.createdAt.getTime() < RESEND_COOLDOWN_MS)
  )
    return null;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // One live code at a time: issuing a new one retires the older ones.
  await db.$transaction([
    db.otpCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: now },
    }),
    db.otpCode.create({
      data: {
        email,
        codeHash: hashCode(email, code),
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      },
    }),
  ]);
  await sendOtpEmail(email, code);
  return code;
}

// Checks a code and returns who it logs in. Every failure is the same 401 so the reason is never revealed.
export async function verifyOtp(
  email: string,
  code: string,
  now = new Date(),
): Promise<SessionClaims> {
  const otp = await db.otpCode.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw invalid();
  // Count the attempt first, atomically and only while under the cap, so parallel guesses cannot exceed it.
  const counted = await db.otpCode.updateMany({
    where: { id: otp.id, usedAt: null, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count === 0 || !safeEqual(otp.codeHash, hashCode(email, code)))
    throw invalid();
  // Single use: only one of several parallel correct submissions can claim the code.
  const claimed = await db.otpCode.updateMany({
    where: { id: otp.id, usedAt: null },
    data: { usedAt: now },
  });
  if (claimed.count === 0) throw invalid();
  const emp = await db.employee.findUnique({
    where: { email },
    select: { id: true, active: true, role: true },
  });
  if (!emp?.active) throw invalid();
  return { employeeId: emp.id, role: APP_ROLE[emp.role] };
}
