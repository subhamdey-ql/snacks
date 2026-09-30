import { after, NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/server/employee/employee.schema";
import { parseBody, publicRoute } from "@/server/http";
import { requestOtp } from "@/server/auth/otp.service";
import { isDevEmailMode } from "@/server/email/email.service";

const requestSchema = z.object({ email: emailSchema });

// Always answers { ok: true } for a well-formed email, whether or not it is registered or the send worked,
// so the screen cannot be used to discover accounts. The lookup and the email run AFTER the response is sent
// (after()), so a registered address does not answer measurably slower than an unknown one. A failed send is
// logged for us, not shown to the caller.
export const POST = publicRoute(async (req) => {
  const { email } = await parseBody(req, requestSchema);
  // Local development only (no Resend key, not production): answer immediately with the code so the login screen
  // can show it. This deliberately reveals whether the address is registered; isDevEmailMode() is false on any
  // real deployment, where the generic path below is the only one.
  if (isDevEmailMode()) {
    let devCode: string | null = null;
    try {
      devCode = await requestOtp(email);
    } catch (e) {
      console.error("Could not create the login code", e);
    }
    return NextResponse.json(devCode ? { ok: true, devCode } : { ok: true });
  }
  after(async () => {
    try {
      await requestOtp(email);
    } catch (e) {
      console.error("Could not send the login code", e);
    }
  });
  return NextResponse.json({ ok: true });
});
