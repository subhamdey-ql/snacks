import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordOk } from "@/server/auth/token";
import { startSession } from "@/server/auth/session";
import { HttpError, parseBody, route } from "@/server/http";

const loginSchema = z.object({ password: z.string().min(1, "Enter the password") });

export const POST = route(async (req) => {
  const { password } = await parseBody(req, loginSchema);
  if (!passwordOk(password)) throw new HttpError(401, "Wrong password");
  await startSession();
  return NextResponse.json({ ok: true });
}, { public: true });
