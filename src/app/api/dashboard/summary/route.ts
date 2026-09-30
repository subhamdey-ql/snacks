import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { getDashboardSummary } from "@/server/dashboard/dashboard.service";

export const GET = route(async () => NextResponse.json(await getDashboardSummary()));
