import { NextResponse } from "next/server";
import { parseId } from "@/server/ids";
import { route, parseBody } from "@/server/http";
import { updateEmployeeSchema } from "@/server/employee/employee.schema";
import { updateEmployee } from "@/server/employee/employee.service";

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const id = parseId((await ctx.params).id);
  return NextResponse.json(await updateEmployee(id, await parseBody(req, updateEmployeeSchema)));
});
