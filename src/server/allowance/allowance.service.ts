import type { Db } from "@/server/db";
import { db } from "@/server/db";
import { DB_TYPE } from "@/server/db-enums";
import { monthRange } from "@/server/balance";
import { EmployeeType } from "@/types/enums";

// The latest allowance row on or before the month start applies; none means 0.
export async function getAllowance(client: Db, type: EmployeeType, monthStart: Date): Promise<number> {
  const row = await client.allowance.findFirst({
    where: { type: DB_TYPE[type], effectiveFrom: { lte: monthStart } },
    orderBy: { effectiveFrom: "desc" },
  });
  return row?.credits ?? 0;
}

export async function getCurrentAllowances(now = new Date()): Promise<Record<EmployeeType, number>> {
  const { start } = monthRange(now);
  const [wfo, hybrid] = await Promise.all([
    getAllowance(db, EmployeeType.WFO, start),
    getAllowance(db, EmployeeType.HYBRID, start),
  ]);
  return { [EmployeeType.WFO]: wfo, [EmployeeType.HYBRID]: hybrid };
}

// Append-only history: saving writes a row effective from this month, so past months keep their old value.
export async function saveAllowances(input: Record<EmployeeType, number>, now = new Date()): Promise<void> {
  const effectiveFrom = monthRange(now).start;
  await db.$transaction(
    Object.values(EmployeeType).map((type) =>
      db.allowance.upsert({
        where: { type_effectiveFrom: { type: DB_TYPE[type], effectiveFrom } },
        update: { credits: input[type] },
        create: { type: DB_TYPE[type], credits: input[type], effectiveFrom },
      }),
    ),
  );
}
