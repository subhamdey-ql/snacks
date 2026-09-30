import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { APP_ROLE } from "@/server/db-enums";
import { homeFor } from "@/lib/routes";
import { makeToken, readToken, SESSION_TTL_MS, type SessionClaims } from "@/server/auth/token";
import type { Role } from "@/types/enums";

const COOKIE_NAME = "snacks_session";

export type Session = SessionClaims;

// The signed cookie proves who logged in; the employee row decides what they may do RIGHT NOW. Re-reading it on
// every request means deactivating someone, or changing their role in the database, takes effect immediately.
// cache() shares the lookup between a layout and its page within one render.
export const getSession = cache(async (): Promise<Session | null> => {
  const claims = readToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!claims) return null;
  const emp = await db.employee.findUnique({ where: { id: claims.employeeId }, select: { id: true, active: true, role: true } });
  if (!emp?.active) return null;
  return { employeeId: emp.id, role: APP_ROLE[emp.role] };
});

// For server-component layouts/pages: sends a signed-out visitor to /login and a wrong-side visitor to their own home.
export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(homeFor(session.role));
  return session;
}

export async function startSession(claims: SessionClaims): Promise<void> {
  (await cookies()).set(COOKIE_NAME, makeToken(claims), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
