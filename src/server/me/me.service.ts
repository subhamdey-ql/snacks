import { dayLabel, dayRange, monthLabel, monthRange } from "@/server/balance";
import { db } from "@/server/db";
import { APP_TYPE } from "@/server/db-enums";
import { HttpError } from "@/server/http";
import { getBalance, getEmployeeMonth, type EmployeeMonth } from "@/server/consumption/consumption.service";

export interface MyMenuItem {
  readonly snackId: number;
  readonly name: string;
  readonly credits: number;
  // The employee has enough credits left this month for one of it.
  readonly affordable: boolean;
}

export interface MyMenu {
  readonly date: string;
  readonly remaining: number;
  readonly items: readonly MyMenuItem[];
}

export interface MyWallet extends EmployeeMonth {
  readonly month: string;
  // First day of the next IST month, when the credits start fresh.
  readonly resetsOn: string;
}

// Every function here takes the employee id from the verified session, never from the request, so one
// employee can never read another's data.
export async function getMyMenu(employeeId: number, now = new Date()): Promise<MyMenu> {
  const emp = await db.employee.findUnique({ where: { id: employeeId }, select: { id: true, type: true } });
  if (!emp) throw new HttpError(404, "Employee not found");
  const { start } = dayRange(now);
  const [balance, rows] = await Promise.all([
    getBalance(db, { id: emp.id, type: APP_TYPE[emp.type] }, now),
    db.dailyMenu.findMany({
      where: { date: start, snack: { active: true } },
      select: { snack: { select: { id: true, name: true, credits: true } } },
      orderBy: { snack: { name: "asc" } },
    }),
  ]);
  return {
    date: dayLabel(start),
    remaining: balance.remaining,
    items: rows.map(({ snack }) => ({ snackId: snack.id, name: snack.name, credits: snack.credits, affordable: balance.remaining >= snack.credits })),
  };
}

export async function getMyWallet(employeeId: number, now = new Date()): Promise<MyWallet> {
  const month = await getEmployeeMonth(employeeId, now);
  const { start, end } = monthRange(now);
  return { ...month, month: monthLabel(start), resetsOn: dayLabel(end) };
}
