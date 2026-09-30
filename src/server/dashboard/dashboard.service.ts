import { dayRange, monthRange } from "@/server/balance";
import { db } from "@/server/db";

export interface DashboardSummary {
  readonly todayEntries: number;
  readonly monthCredits: number;
  readonly monthEmployees: number;
}

// Home-screen tiles. Voided entries never count. All three run in Postgres on the
// (createdAt, voidedAt) index; only counts/sums come back.
export async function getDashboardSummary(now = new Date()): Promise<DashboardSummary> {
  const today = dayRange(now);
  const month = monthRange(now);
  const inMonth = { voidedAt: null, createdAt: { gte: month.start, lt: month.end } };
  const [todayEntries, credits, employees] = await Promise.all([
    db.consumption.count({ where: { voidedAt: null, createdAt: { gte: today.start, lt: today.end } } }),
    db.consumption.aggregate({ where: inMonth, _sum: { creditsCharged: true } }),
    // Prisma has no COUNT(DISTINCT); one grouped row per employee served is at most the headcount, fine at this scale.
    db.consumption.groupBy({ by: ["employeeId"], where: inMonth }),
  ]);
  return { todayEntries, monthCredits: credits._sum.creditsCharged ?? 0, monthEmployees: employees.length };
}
