import { NextResponse } from "next/server";
import { route, parseBody, parseQuery } from "@/server/http";
import { createEmployeeSchema, listEmployeeQuerySchema } from "@/server/employee/employee.schema";
import { createEmployee, listEmployees } from "@/server/employee/employee.service";

export const GET = route(async (req) => {
  return NextResponse.json(await listEmployees(parseQuery(req, listEmployeeQuerySchema)));
});

export const POST = route(async (req) => {
  return NextResponse.json(await createEmployee(await parseBody(req, createEmployeeSchema)));
});
