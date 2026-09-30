import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkToken, makeToken, SESSION_TTL_MS } from "@/server/auth/token";

const COOKIE_NAME = "snacks_session";

export async function isAuthed(): Promise<boolean> {
  return checkToken((await cookies()).get(COOKIE_NAME)?.value);
}

// For server-component layouts/pages.
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/login");
}

export async function startSession(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, makeToken(), {
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
