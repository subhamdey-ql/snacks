import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/server/employee/employee.schema";
import { parseBody, publicRoute } from "@/server/http";
import { verifyOtp } from "@/server/auth/otp.service";
import { startSession } from "@/server/auth/session";

const verifySchema = z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

export const POST = publicRoute(async (req) => {
  const { email, code } = await parseBody(req, verifySchema);
  const claims = await verifyOtp(email, code);
  await startSession(claims);
  return NextResponse.json({ role: claims.role });
});
