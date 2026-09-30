import { dayLabel, dayRange } from "@/server/balance";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";

export interface TodayMenu {
  readonly date: string;
  readonly snackIds: readonly number[];
}

// Today (IST) is the only editable day: the uncle sets each morning's menu, and past menus stay as history.
export async function getTodayMenu(now = new Date()): Promise<TodayMenu> {
  const { start } = dayRange(now);
  const rows = await db.dailyMenu.findMany({ where: { date: start, snack: { active: true } }, select: { snackId: true }, orderBy: { snackId: "asc" } });
  return { date: dayLabel(start), snackIds: rows.map((r) => r.snackId) };
}

// Replaces today's menu with exactly these snacks (an empty list clears it).
export async function setTodayMenu(snackIds: readonly number[], now = new Date()): Promise<void> {
  const { start } = dayRange(now);
  const unique = [...new Set(snackIds)];
  await db.$transaction(async (tx) => {
    const valid = await tx.snack.count({ where: { id: { in: unique }, active: true } });
    if (valid !== unique.length) throw new HttpError(422, "Some of those snacks are missing or inactive");
    await tx.dailyMenu.deleteMany({ where: { date: start } });
    await tx.dailyMenu.createMany({ data: unique.map((snackId) => ({ date: start, snackId })) });
  });
}

// Morning shortcut: start from yesterday's menu (snacks deactivated since are skipped).
export async function copyYesterdayMenu(now = new Date()): Promise<void> {
  const today = dayRange(now).start;
  const yesterday = dayRange(new Date(today.getTime() - 1)).start;
  const rows = await db.dailyMenu.findMany({ where: { date: yesterday, snack: { active: true } }, select: { snackId: true } });
  if (rows.length === 0) throw new HttpError(422, "Yesterday had no menu to copy");
  await setTodayMenu(rows.map((r) => r.snackId), now);
}
