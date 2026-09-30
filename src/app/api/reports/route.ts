import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { getReport } from "@/server/report/report.service";

export const GET = route(async (req) => NextResponse.json(await getReport(new URL(req.url).searchParams.get("m"))));
