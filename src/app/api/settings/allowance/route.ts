import { NextResponse } from "next/server";
import { route, parseBody } from "@/server/http";
import { saveAllowanceSchema } from "@/server/allowance/allowance.schema";
import { getCurrentAllowances, saveAllowances } from "@/server/allowance/allowance.service";

export const GET = route(async () => NextResponse.json(await getCurrentAllowances()));

export const PUT = route(async (req) => {
  await saveAllowances(await parseBody(req, saveAllowanceSchema));
  return NextResponse.json(await getCurrentAllowances());
});
