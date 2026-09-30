import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { isAuthed } from "@/server/auth/session";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

// Wraps every controller: auth gate (unless public) plus one place that turns
// known errors into { message } JSON with the right status.
export function route<C>(handler: Handler<C>, opts: { public?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (!opts.public && !(await isAuthed())) throw new HttpError(401, "Not logged in");
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ message: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ message: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
      // P2002 = unique constraint (duplicate code/name).
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ message: "That value already exists" }, { status: 409 });
      }
      console.error(e);
      return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
  };
}

// ZodType<Output, Input>: `unknown` input accepts transform/coerce schemas; result is the OUTPUT type.
export async function parseBody<T>(req: Request, schema: ZodType<T, unknown>): Promise<T> {
  const raw: unknown = await req.json().catch(() => ({}));
  return schema.parse(raw);
}

export function parseQuery<T>(req: Request, schema: ZodType<T, unknown>): T {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}
