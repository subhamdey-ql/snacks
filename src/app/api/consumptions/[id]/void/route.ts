import { NextResponse } from "next/server";
import { parseId } from "@/server/ids";
import { route } from "@/server/http";
import { voidConsumption } from "@/server/consumption/consumption.service";

export const POST = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const id = parseId((await ctx.params).id);
  await voidConsumption(id);
  return NextResponse.json({ ok: true });
});
