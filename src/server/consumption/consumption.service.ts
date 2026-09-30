import { getAllowance } from "@/server/allowance/allowance.service";
import { monthRange } from "@/server/balance";
import { db, type Db } from "@/server/db";
import { APP_TYPE } from "@/server/db-enums";
import { HttpError } from "@/server/http";
import type { RecordInput } from "@/server/consumption/consumption.schema";
import type { EmployeeType } from "@/types/enums";

export interface Balance {
  readonly allowance: number;
  readonly used: number;
  readonly remaining: number;
}

// remaining = this month's allowance minus this month's non-voided charges.
// Expiry is implicit: a new month has a new range, so it starts at the full allowance.
export async function getBalance(client: Db, emp: { id: number; type: EmployeeType }, now = new Date()): Promise<Balance> {
  const { start, end } = monthRange(now);
  const [allowance, sum] = await Promise.all([
    getAllowance(client, emp.type, start),
    client.consumption.aggregate({
      _sum: { creditsCharged: true },
      where: { employeeId: emp.id, voidedAt: null, createdAt: { gte: start, lt: end } },
    }),
  ]);
  const used = sum._sum.creditsCharged ?? 0;
  return { allowance, used, remaining: allowance - used };
}

export function recordConsumption(input: RecordInput, now = new Date()): Promise<void> {
  return db.$transaction(async (tx) => {
    // Row lock: concurrent submits for one employee run one at a time, so two
    // tabs can never both pass the balance check and overdraw.
    await tx.$queryRaw`SELECT id FROM "Employee" WHERE id = ${input.employeeId} FOR UPDATE`;
    const emp = await tx.employee.findUnique({ where: { id: input.employeeId } });
    if (!emp || !emp.active) throw new HttpError(404, "Employee not found or inactive");
    const snack = await tx.snack.findUnique({ where: { id: input.snackId } });
    if (!snack || !snack.active) throw new HttpError(404, "Snack not found or inactive");
    const cost = snack.credits * input.qty;
    const { remaining } = await getBalance(tx, { id: emp.id, type: APP_TYPE[emp.type] }, now);
    if (cost > remaining) throw new HttpError(422, `Not enough credits: needs ${cost}, has ${remaining}`);
    await tx.consumption.create({
      data: { employeeId: emp.id, snackId: snack.id, qty: input.qty, creditsCharged: cost, createdAt: now },
    });
  });
}

export async function voidConsumption(id: number, now = new Date()): Promise<void> {
  // Single atomic claim: only a live, current-month entry matches, so a double void
  // can never overwrite the first voidedAt.
  const { count } = await db.consumption.updateMany({
    where: { id, voidedAt: null, createdAt: { gte: monthRange(now).start } },
    data: { voidedAt: now },
  });
  if (count === 1) return;
  const entry = await db.consumption.findUnique({ where: { id } });
  if (!entry) throw new HttpError(404, "Entry not found");
  if (entry.voidedAt) return; // already voided: idempotent
  // Undo is limited to the current month, so past months stay final.
  throw new HttpError(422, "Only this month's entries can be undone");
}

export interface EmployeeMonth {
  readonly employee: { id: number; code: string; name: string; type: EmployeeType; active: boolean };
  readonly balance: Balance;
  readonly entries: readonly {
    id: number; snackName: string; qty: number; creditsCharged: number; createdAt: Date; voidedAt: Date | null;
  }[];
}

export async function getEmployeeMonth(employeeId: number, now = new Date()): Promise<EmployeeMonth> {
  const emp = await db.employee.findUnique({ where: { id: employeeId } });
  if (!emp) throw new HttpError(404, "Employee not found");
  const { start, end } = monthRange(now);
  const type = APP_TYPE[emp.type];
  const [balance, rows] = await Promise.all([
    getBalance(db, { id: emp.id, type }, now),
    db.consumption.findMany({
      where: { employeeId, createdAt: { gte: start, lt: end } },
      include: { snack: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    employee: { id: emp.id, code: emp.code, name: emp.name, type, active: emp.active },
    balance,
    entries: rows.map((r) => ({
      id: r.id, snackName: r.snack.name, qty: r.qty, creditsCharged: r.creditsCharged, createdAt: r.createdAt, voidedAt: r.voidedAt,
    })),
  };
}
