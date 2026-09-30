// Demo data for the app: `pnpm seed` adds it, `pnpm seed:reset` removes only what it added.
// Every name is invented. Demo employees carry a DEMO- code prefix, which is how reset finds them.
// Allowances are left in place on reset, since the Settings screen is where the real ones get set.
import { EmpType, PrismaClient, type Prisma } from "@prisma/client";
import { monthRange } from "../src/server/balance";

const db = new PrismaClient();

const DEMO_PREFIX = "DEMO-";
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;
const MONTHS_OF_HISTORY = 3;
const EMPLOYEE_COUNT = 40;
const INACTIVE_EMPLOYEES = 4; // the last few; they "left" before the current month

interface EntryRow {
  employeeId: number; snackId: number; qty: number; creditsCharged: number; createdAt: Date; voidedAt?: Date;
}

interface SnackSeed { name: string; credits: number; active: boolean; weight: number }

// weight = how often it gets picked; cheap staples dominate, like a real snacks counter.
const SNACKS: readonly SnackSeed[] = [
  { name: "Masala Chai", credits: 1, active: true, weight: 12 },
  { name: "Filter Coffee", credits: 2, active: true, weight: 8 },
  { name: "Biscuit Pack", credits: 1, active: true, weight: 7 },
  { name: "Samosa", credits: 2, active: true, weight: 7 },
  { name: "Vada Pav", credits: 2, active: true, weight: 5 },
  { name: "Veg Puff", credits: 2, active: true, weight: 5 },
  { name: "Namkeen Packet", credits: 2, active: true, weight: 4 },
  { name: "Potato Chips", credits: 2, active: true, weight: 4 },
  { name: "Poha", credits: 3, active: true, weight: 3 },
  { name: "Cold Drink", credits: 3, active: true, weight: 4 },
  { name: "Dark Chocolate", credits: 3, active: true, weight: 2 },
  { name: "Veg Sandwich", credits: 4, active: true, weight: 3 },
  { name: "Maggi Noodles", credits: 4, active: true, weight: 3 },
  { name: "Protein Bar", credits: 5, active: true, weight: 1 },
  // Discontinued: only appears in earlier months, never in the current one.
  { name: "Cup Noodles", credits: 4, active: false, weight: 2 },
  { name: "Sweet Lassi", credits: 3, active: false, weight: 2 },
];

const FIRST_NAMES = ["Aarav", "Diya", "Vihaan", "Ananya", "Kabir", "Ishita", "Rohan", "Meera", "Arjun", "Kavya",
  "Nikhil", "Sanya", "Rahul", "Tara", "Yash", "Naina", "Dev", "Riya", "Karan", "Pooja"];
const LAST_NAMES = ["Verma", "Nair", "Iyer", "Kulkarni", "Reddy", "Bose", "Malhotra", "Pillai", "Desai", "Chopra"];

// Allowance history: a past value, then a raise effective this month.
const PAST_ALLOWANCE: Record<EmpType, number> = { WFO: 25, HYBRID: 15 };
const CURRENT_ALLOWANCE: Record<EmpType, number> = { WFO: 30, HYBRID: 20 };

// Seeded PRNG (mulberry32) so a re-seed after a reset produces the same shape of data.
function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same rule as getAllowance in the app: the latest row on or before the month start applies.
async function allowanceFor(type: EmpType, monthStart: Date): Promise<number> {
  const row = await db.allowance.findFirst({
    where: { type, effectiveFrom: { lte: monthStart } },
    orderBy: { effectiveFrom: "desc" },
  });
  return row?.credits ?? 0;
}

async function reset(): Promise<void> {
  const demo = { employee: { code: { startsWith: DEMO_PREFIX } } };
  const entries = await db.consumption.deleteMany({ where: demo });
  const employees = await db.employee.deleteMany({ where: { code: { startsWith: DEMO_PREFIX } } });
  // Only drop a demo snack nothing else refers to, so real entries are never orphaned.
  const snacks = await db.snack.deleteMany({
    where: { name: { in: SNACKS.map((s) => s.name) }, consumptions: { none: {} } },
  });
  console.log(`Removed ${entries.count} entries, ${employees.count} employees, ${snacks.count} snacks.`);
}

async function seed(): Promise<void> {
  if ((await db.employee.count({ where: { code: { startsWith: DEMO_PREFIX } } })) > 0) {
    console.log("Demo data already present. Run `pnpm seed:reset` first to regenerate it.");
    return;
  }
  const rng = makeRng(20260930);
  const now = new Date();
  const currentStart = monthRange(now).start;

  // Month starts, oldest first: [two months ago, last month, this month].
  const starts: Date[] = [currentStart];
  while (starts.length < MONTHS_OF_HISTORY) starts.unshift(monthRange(new Date(starts[0].getTime() - 1)).start);

  // Allowances are only created when missing, so a value already set in Settings is never overwritten.
  for (const type of [EmpType.WFO, EmpType.HYBRID]) {
    for (const [effectiveFrom, credits] of [[starts[0], PAST_ALLOWANCE[type]], [currentStart, CURRENT_ALLOWANCE[type]]] as const) {
      await db.allowance.upsert({
        where: { type_effectiveFrom: { type, effectiveFrom } },
        update: {},
        create: { type, credits, effectiveFrom },
      });
    }
  }

  await db.snack.createMany({
    data: SNACKS.map(({ name, credits, active }) => ({ name, credits, active })),
    skipDuplicates: true,
  });
  const snackRows = await db.snack.findMany({ where: { name: { in: SNACKS.map((s) => s.name) } } });
  const weightByName = new Map(SNACKS.map((s) => [s.name, s.weight]));

  const employeeInputs: Prisma.EmployeeCreateManyInput[] = Array.from({ length: EMPLOYEE_COUNT }, (_, i) => ({
    code: `${DEMO_PREFIX}${String(i + 1).padStart(3, "0")}`,
    // The second pass through the first names shifts the surname, so all 40 pairs are unique.
    name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length) * 3) % LAST_NAMES.length]}`,
    type: rng() < 0.55 ? EmpType.WFO : EmpType.HYBRID,
    active: i < EMPLOYEE_COUNT - INACTIVE_EMPLOYEES,
  }));
  await db.employee.createMany({ data: employeeInputs, skipDuplicates: true });
  const employees = await db.employee.findMany({ where: { code: { startsWith: DEMO_PREFIX } } });

  const rows: EntryRow[] = [];
  const pickSnack = (pool: typeof snackRows) => {
    let roll = rng() * pool.reduce((sum, s) => sum + (weightByName.get(s.name) ?? 1), 0);
    return pool.find((s) => (roll -= weightByName.get(s.name) ?? 1) < 0) ?? pool[0];
  };

  for (const start of starts) {
    const isCurrent = start.getTime() === currentStart.getTime();
    const end = monthRange(new Date(start.getTime() + 15 * DAY_MS)).end;
    // Weekday start-of-day instants (IST) already elapsed this month; the counter is closed on weekends.
    const days: Date[] = [];
    for (let t = start.getTime(); t < Math.min(end.getTime(), now.getTime()); t += DAY_MS) {
      if (new Date(t + IST_OFFSET_MS).getUTCDay() % 6 !== 0) days.push(new Date(t));
    }
    const monthDays = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    // Part-way through the current month, people have only used part of their allowance.
    const elapsedShare = isCurrent ? Math.min(1, days.length / Math.max(1, monthDays * (5 / 7))) : 1;
    const pool = isCurrent ? snackRows.filter((s) => s.active) : snackRows;

    for (const emp of employees) {
      if (isCurrent && !emp.active) continue;
      const allowance = await allowanceFor(emp.type, start);
      // Spending personas: a few heavy users near the cap, most in the middle, some barely use it.
      const persona = rng();
      const ratio = persona < 0.15 ? 0.85 + rng() * 0.15 : persona < 0.75 ? 0.35 + rng() * 0.45 : 0.05 + rng() * 0.25;
      const target = allowance * ratio * elapsedShare;

      let used = 0;
      for (let attempt = 0; attempt < 200 && used < target; attempt++) {
        const snack = pickSnack(pool);
        const qty = rng() < 0.8 ? 1 : rng() < 0.75 ? 2 : 3;
        const cost = snack.credits * qty;
        if (used + cost > allowance) continue; // never overdraw: same rule the record form enforces
        // 09:30 to 18:00 IST on a random working day.
        const day = days[Math.floor(rng() * days.length)];
        const createdAt = new Date(day.getTime() + (9.5 + rng() * 8.5) * 3600 * 1000);
        if (createdAt > now) continue;
        used += cost;
        rows.push({ employeeId: emp.id, snackId: snack.id, qty, creditsCharged: cost, createdAt });
      }
    }
  }

  // Void a few current-month entries. The app only allows undo within the current month, and voiding
  // can only lower a balance's usage, so no month can end up over its allowance.
  for (const row of rows) {
    if (row.createdAt >= currentStart && rng() < 0.05) {
      row.voidedAt = new Date(Math.min(now.getTime(), row.createdAt.getTime() + (1 + rng() * 29) * 60 * 1000));
    }
  }

  // Insert oldest first so auto-increment ids follow time order, like real data would.
  rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  await db.consumption.createMany({ data: rows });
  console.log(`Seeded ${employees.length} employees, ${snackRows.length} snacks, ${rows.length} entries over ${starts.length} months.`);
}

(process.argv.includes("--reset") ? reset() : seed())
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
