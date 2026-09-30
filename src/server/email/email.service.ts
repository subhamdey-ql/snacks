import { BRAND_NAME } from "@/lib/brand";
import { requireEnv } from "@/server/env";
import { HttpMethod } from "@/types/enums";

// Local-development shortcut: with no RESEND_API_KEY and outside production, codes are not emailed. They are
// printed in the server console and the login screen shows them (see the request route). It turns itself off the
// moment a key is configured or NODE_ENV is production, so it can never hand out codes on a real deployment.
export const isDevEmailMode = (): boolean => !process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production";

// Sends the one-time login code through Resend's HTTPS API (no SDK needed for a single call).
// In production a missing key is an error rather than a silent no-send.
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (isDevEmailMode()) {
    console.info(`[dev] login code for ${to}: ${code}`);
    return;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing environment variable RESEND_API_KEY");
  const res = await fetch("https://api.resend.com/emails", {
    method: HttpMethod.POST,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: requireEnv("EMAIL_FROM"),
      to: [to],
      subject: `${code} is your ${BRAND_NAME} login code`,
      text: `Your ${BRAND_NAME} login code is ${code}. It expires in 10 minutes. If you did not ask for it, ignore this email.`,
      html: `<p>Your ${BRAND_NAME} login code is</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you did not ask for it, ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}
