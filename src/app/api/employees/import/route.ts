import { NextResponse } from "next/server";
import { HttpError, route } from "@/server/http";
import { importEmployees } from "@/server/employee/employee.service";

// Slightly above the 1 MB file cap to allow multipart overhead; stops a huge upload being buffered at all.
const MAX_UPLOAD_BYTES = 1_100_000;

export const POST = route(async (req) => {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) throw new HttpError(413, "File is too large (max 1 MB)");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a CSV file");
  return NextResponse.json(await importEmployees(file));
});
