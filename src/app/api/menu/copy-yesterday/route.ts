import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { copyYesterdayMenu, getTodayMenu } from "@/server/menu/menu.service";

export const POST = route(async () => {
  await copyYesterdayMenu();
  return NextResponse.json(await getTodayMenu());
});
