import { getAllowance } from "@/server/allowance/allowance.service";
import { monthFromParam, monthLabel, monthRange } from "@/server/balance";
import { db } from "@/server/db";
import { APP_TYPE } from "@/server/db-enums";
import { EmployeeType } from "@/types/enums";

export interface Report {
  readonly month: string;
  readonly perEmployee: readonly { code: string; name: string; allowance: number; used: number; remaining: number }[];
  readonly perSnack: readonly { name: string; qty: number; credits: number }[];
}

export async function getReport(monthParam: string | null): Promise<Report> {
  const { start, end } = monthRange(monthFromParam(monthParam));
  const inMonth = { voidedAt: null, createdAt: { gte: start, lt: end } };

  // Totals are grouped in Postgres; only the grouped rows come back.
  const [byEmployee, bySnack, wfo, hybrid] = await Promise.all([
    db.consumption.groupBy({ by: ["employeeId"], where: inMonth, _sum: { creditsCharged: true } }),
    db.consumption.groupBy({ by: ["snackId"], where: inMonth, _sum: { qty: true, creditsCharged: true } }),
    getAllowance(db, EmployeeType.WFO, start),
    getAllowance(db, EmployeeType.HYBRID, start),
  ]);
  const usedById = new Map(byEmployee.map((r) => [r.employeeId, r._sum.creditsCharged ?? 0]));
  const allowanceByType: Record<EmployeeType, number> = { [EmployeeType.WFO]: wfo, [EmployeeType.HYBRID]: hybrid };

  // Active employees, plus deactivated ones that still have usage this month.
  const [employees, snacks] = await Promise.all([
    db.employee.findMany({
      where: { OR: [{ active: true }, { id: { in: [...usedById.keys()] } }] },
      orderBy: { name: "asc" },
    }),
    db.snack.findMany({ where: { id: { in: bySnack.map((r) => r.snackId) } } }),
  ]);
  const snackName = new Map(snacks.map((s) => [s.id, s.name]));

  return {
    month: monthLabel(start),
    perEmployee: employees.map((e) => {
      const allowance = allowanceByType[APP_TYPE[e.type]];
      const used = usedById.get(e.id) ?? 0;
      return { code: e.code, name: e.name, allowance, used, remaining: allowance - used };
    }),
    perSnack: bySnack
      .map((r) => ({ name: snackName.get(r.snackId) ?? "Unknown", qty: r._sum.qty ?? 0, credits: r._sum.creditsCharged ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
