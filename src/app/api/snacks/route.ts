import { NextResponse } from "next/server";
import { route, parseBody, parseQuery } from "@/server/http";
import { createSnackSchema, listSnackQuerySchema } from "@/server/snack/snack.schema";
import { createSnack, listSnacks } from "@/server/snack/snack.service";

export const GET = route(async (req) => {
  const { includeInactive } = parseQuery(req, listSnackQuerySchema);
  return NextResponse.json(await listSnacks(includeInactive === "true"));
});

export const POST = route(async (req) => {
  return NextResponse.json(await createSnack(await parseBody(req, createSnackSchema)));
});
