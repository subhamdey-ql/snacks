import { NextResponse } from "next/server";
import { parseId } from "@/server/ids";
import { route, parseBody } from "@/server/http";
import { updateSnackSchema } from "@/server/snack/snack.schema";
import { updateSnack } from "@/server/snack/snack.service";

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const id = parseId((await ctx.params).id);
  return NextResponse.json(await updateSnack(id, await parseBody(req, updateSnackSchema)));
});
