import { NextResponse } from "next/server";
import { endSession } from "@/server/auth/session";
import { publicRoute } from "@/server/http";

export const POST = publicRoute(async () => {
  await endSession();
  return NextResponse.json({ ok: true });
});
