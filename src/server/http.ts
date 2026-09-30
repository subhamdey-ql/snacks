import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getSession, type Session } from "@/server/auth/session";
import { FetchSite, HttpMethod, Role } from "@/types/enums";

export class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly headers: Record<string, string> = {}) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;
type SessionHandler<C> = (req: Request, ctx: C, session: Session) => Promise<Response>;

const SAFE_METHODS: ReadonlySet<string> = new Set<string>([HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS]);
export const MAX_JSON_BYTES = 100_000;

// CSRF defence on top of the SameSite=Lax cookie: a state-changing request must come from this same site.
// Browsers always send Sec-Fetch-Site / Origin on such requests, so a cross-site form or fetch is rejected;
// non-browser callers (curl) send neither and are still allowed, they need the session cookie anyway.
function assertSameOrigin(req: Request): void {
  if (SAFE_METHODS.has(req.method)) return;
  const site = req.headers.get("sec-fetch-site");
  if (site === FetchSite.CROSS_SITE || site === FetchSite.SAME_SITE) throw new HttpError(403, "Cross-site request blocked");
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host; // an opaque "null" origin throws and is rejected below
  } catch {}
  if (!host || originHost !== host) throw new HttpError(403, "Cross-site request blocked");
}

// API responses carry private data and must never be cached by the browser, a CDN or a proxy.
function withSecurityHeaders(res: Response): Response {
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

function fail(e: unknown): Response {
  if (e instanceof HttpError) return withSecurityHeaders(NextResponse.json({ message: e.message }, { status: e.status, headers: e.headers }));
  if (e instanceof ZodError) return withSecurityHeaders(NextResponse.json({ message: e.issues[0]?.message ?? "Invalid input" }, { status: 400 }));
  // P2002 = unique constraint (duplicate code/name/email).
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = String(e.meta?.target ?? "");
    return withSecurityHeaders(NextResponse.json({ message: target.includes("email") ? "That email is already used" : "That value already exists" }, { status: 409 }));
  }
  console.error(e);
  return withSecurityHeaders(NextResponse.json({ message: "Something went wrong" }, { status: 500 }));
}

// Wraps every signed-in controller: same-origin check, login + role gate (ADMIN unless told otherwise), then one
// place that turns known errors into { message } JSON. The handler receives the verified session.
export function route<C>(handler: SessionHandler<C>, opts: { role?: Role } = {}): Handler<C> {
  const required = opts.role ?? Role.ADMIN;
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      const session = await getSession();
      if (!session) throw new HttpError(401, "Not logged in");
      if (session.role !== required) throw new HttpError(403, "You don't have access to this");
      return withSecurityHeaders(await handler(req, ctx, session));
    } catch (e) {
      return fail(e);
    }
  };
}

// For the few routes that work without a session (login, logout).
export function publicRoute<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return withSecurityHeaders(await handler(req, ctx));
    } catch (e) {
      return fail(e);
    }
  };
}

// ZodType<Output, Input>: `unknown` input accepts transform/coerce schemas; result is the OUTPUT type.
export async function parseBody<T>(req: Request, schema: ZodType<T, unknown>): Promise<T> {
  // Cap the body before parsing: the declared length first (cheap), then the real length (it can be absent or wrong).
  if (Number(req.headers.get("content-length") ?? 0) > MAX_JSON_BYTES) throw new HttpError(413, "Request is too large");
  const text = await req.text();
  if (text.length > MAX_JSON_BYTES) throw new HttpError(413, "Request is too large");
  let raw: unknown = {};
  try {
    raw = JSON.parse(text);
  } catch {} // an empty or malformed body falls through to schema validation
  return schema.parse(raw);
}

export function parseQuery<T>(req: Request, schema: ZodType<T, unknown>): T {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}
