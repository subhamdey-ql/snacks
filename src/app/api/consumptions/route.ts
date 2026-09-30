import { NextResponse } from "next/server";
import { route, parseBody } from "@/server/http";
import { recordSchema } from "@/server/consumption/consumption.schema";
import { recordConsumption } from "@/server/consumption/consumption.service";

export const POST = route(async (req) => {
  await recordConsumption(await parseBody(req, recordSchema));
  return NextResponse.json({ ok: true }, { status: 201 });
});
