import { z } from "zod";
import { HttpError } from "@/server/http";

const INT4_MAX = 2147483647;

// Postgres Int is int4: larger ids would surface as a 500 from the driver, so reject them as 400 here.
export const idSchema = z.number().int().positive().max(INT4_MAX);

// Parses a path segment; strict digits only ("1e1", "0x5", "" are rejected).
export function parseId(raw: string): number {
  const parsed = /^\d+$/.test(raw) ? idSchema.safeParse(Number(raw)) : null;
  if (!parsed?.success) throw new HttpError(400, "Invalid id");
  return parsed.data;
}
