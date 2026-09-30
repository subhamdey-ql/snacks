import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { getMyWallet } from "@/server/me/me.service";
import { Role } from "@/types/enums";

export const GET = route(async (_req, _ctx, session) => NextResponse.json(await getMyWallet(session.employeeId)), { role: Role.USER });
