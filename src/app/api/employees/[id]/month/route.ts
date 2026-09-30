import { NextResponse } from "next/server";
import { parseId } from "@/server/ids";
import { route } from "@/server/http";
import { getEmployeeMonth } from "@/server/consumption/consumption.service";

export const GET = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const id = parseId((await ctx.params).id);
  return NextResponse.json(await getEmployeeMonth(id));
});
