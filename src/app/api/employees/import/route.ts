import { NextResponse } from "next/server";
import { HttpError, route } from "@/server/http";
import { importEmployees } from "@/server/employee/employee.service";

export const POST = route(async (req) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a CSV file");
  return NextResponse.json(await importEmployees(file));
});
