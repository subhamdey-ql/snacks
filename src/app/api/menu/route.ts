import { NextResponse } from "next/server";
import { route, parseBody } from "@/server/http";
import { setMenuSchema } from "@/server/menu/menu.schema";
import { getTodayMenu, setTodayMenu } from "@/server/menu/menu.service";

export const GET = route(async () => NextResponse.json(await getTodayMenu()));

export const PUT = route(async (req) => {
  await setTodayMenu((await parseBody(req, setMenuSchema)).snackIds);
  return NextResponse.json(await getTodayMenu());
});
