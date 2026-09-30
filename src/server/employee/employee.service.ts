import { Prisma, UserRole, type Employee } from "@prisma/client";
import { db } from "@/server/db";
import { DB_TYPE } from "@/server/db-enums";
import { HttpError } from "@/server/http";
import { parseEmployeeCsv } from "@/server/employee/employee.csv";
import type { CreateEmployeeInput, ListEmployeeQuery, UpdateEmployeeInput } from "@/server/employee/employee.schema";
import type { Paginated } from "@/types/api";

const MAX_CSV_BYTES = 1_000_000;
const MAX_CSV_ROWS = 5000;
const IMPORT_CHUNK = 500;

export async function listEmployees(query: ListEmployeeQuery): Promise<Paginated<Employee>> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 10));
  const term = query.q?.trim();
  // Filtering, ordering and paging all happen in Postgres.
  const where: Prisma.EmployeeWhereInput = {
    ...(query.active ? { active: query.active === "true" } : {}),
    ...(term
      ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { code: { contains: term, mode: "insensitive" } }] }
      : {}),
  };
  const [data, total] = await db.$transaction([
    db.employee.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
    db.employee.count({ where }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const type = DB_TYPE[input.type];
  return db.employee.upsert({
    where: { code: input.code },
    update: { name: input.name, type, email: input.email, active: true },
    create: { code: input.code, name: input.name, type, email: input.email },
  });
}

export async function updateEmployee(id: number, input: UpdateEmployeeInput): Promise<Employee> {
  const { type, ...rest } = input;
  // An admin cannot be switched off through the app, so the last admin can never be locked out by a stray click.
  if (input.active === false) {
    const target = await db.employee.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === UserRole.ADMIN) throw new HttpError(422, "An admin cannot be deactivated here");
  }
  const { count } = await db.employee.updateMany({ where: { id }, data: { ...rest, ...(type ? { type: DB_TYPE[type] } : {}) } });
  if (count === 0) throw new HttpError(404, "Employee not found");
  return db.employee.findUniqueOrThrow({ where: { id } });
}

// Upserts good rows in chunks (one round-trip per chunk) and reports bad lines.
export async function importEmployees(file: File): Promise<{ imported: number; errors: string[] }> {
  if (file.size > MAX_CSV_BYTES) throw new HttpError(400, "File is too large (max 1 MB)");
  const parsed = parseEmployeeCsv(await file.text());
  if (parsed.rows.length > MAX_CSV_ROWS) throw new HttpError(400, `Too many rows (max ${MAX_CSV_ROWS})`);
  // An email already held by a DIFFERENT code would fail its whole chunk on the unique index; report those lines instead.
  const taken = await db.employee.findMany({ where: { email: { in: parsed.rows.map((r) => r.email) } }, select: { code: true, email: true } });
  const ownerOf = new Map(taken.map((t) => [t.email, t.code]));
  const errors = [...parsed.errors];
  const rows = parsed.rows.filter((r) => {
    const owner = ownerOf.get(r.email);
    if (owner === undefined || owner === r.code) return true;
    errors.push(`Line ${r.line}: email already belongs to another employee`);
    return false;
  });
  for (let i = 0; i < rows.length; i += IMPORT_CHUNK) {
    await db.$transaction(
      rows.slice(i, i + IMPORT_CHUNK).map((r) =>
        db.employee.upsert({
          where: { code: r.code },
          // Same as POST /api/employees: an imported row re-activates an inactive employee.
          update: { name: r.name, type: DB_TYPE[r.type], email: r.email, active: true },
          create: { code: r.code, name: r.name, type: DB_TYPE[r.type], email: r.email },
        }),
      ),
    );
  }
  return { imported: rows.length, errors };
}
