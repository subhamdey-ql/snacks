// Demo data for the app: `pnpm seed` adds it, `pnpm seed:reset` removes only what it added.
// `pnpm seed` also makes sure two LOGIN accounts exist (an admin and an employee; see LOGIN_ACCOUNTS), gives every
// employee without an email a placeholder one, and sets today's menu. All of that is additive and safe to re-run.
// Every name is invented. Demo employees carry a DEMO- code prefix, which is how reset finds them.
// Allowances are left in place on reset, since the Settings screen is where the real ones get set.
import { EmpType, PrismaClient, UserRole, type Prisma } from "@prisma/client";
import { dayRange, monthRange } from "../src/server/balance";

const db = new PrismaClient();

const DEMO_PREFIX = "DEMO-";

// Accounts you can log in with. Change the emails with SEED_ADMIN_EMAIL / SEED_USER_EMAIL when running the seed
// (use real mailboxes once Resend is configured; example.test addresses cannot receive mail, so in development the
// code is read from the `pnpm dev` terminal). Their codes do not start with DEMO-, so `seed:reset` leaves them alone.
const LOGIN_ACCOUNTS: readonly { code: string; name: string; email: string; role: UserRole }[] = [
  { code: "ADMIN-001", name: "Snacks Admin", email: (process.env.SEED_ADMIN_EMAIL ?? "admin@example.test").toLowerCase(), role: UserRole.ADMIN },
  { code: "USER-001", name: "Demo Employee", email: (process.env.SEED_USER_EMAIL ?? "user@example.test").toLowerCase(), role: UserRole.USER },
];
const MENU_SIZE = 6; // how many active snacks go on today's menu when none is set yet
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;
const MONTHS_OF_HISTORY = 4; // three full months plus the current one, whatever day it is
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

  // Month starts, oldest first, ending with this month.
  const starts: Date[] = [currentStart];
  while (starts.length < MONTHS_OF_HISTORY) starts.unshift(monthRange(new Date(starts[0].getTime() - 1)).start);

  // Only seed allowances for a type that has none in effect yet. If one is already set (in Settings or by an
  // earlier run), every month inherits it, so this never changes what a real user configured.
  for (const type of [EmpType.WFO, EmpType.HYBRID]) {
    if ((await allowanceFor(type, currentStart)) > 0) continue;
    await db.allowance.createMany({
      data: [
        { type, credits: PAST_ALLOWANCE[type], effectiveFrom: starts[0] },
        { type, credits: CURRENT_ALLOWANCE[type], effectiveFrom: currentStart },
      ],
      skipDuplicates: true,
    });
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
    // example.test never resolves to a real mailbox; the app requires an email for every employee.
    email: `${DEMO_PREFIX.toLowerCase()}${String(i + 1).padStart(3, "0")}@example.test`,
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
    const elapsedShare = isCurrent ? Math.max(0.1, Math.min(1, days.length / Math.max(1, monthDays * (5 / 7)))) : 1;
    // Early in the month no working hours may have passed yet (e.g. 00:29 on the 1st). Fall back to spreading
    // entries over [month start, now] so the home tiles are not empty; off-hours, but only for that window.
    const offHours = isCurrent && !days.some((d) => d.getTime() + 9.5 * 3600 * 1000 <= now.getTime());
    const pool = isCurrent ? snackRows.filter((s) => s.active) : snackRows;

    for (const emp of employees) {
      if (isCurrent && !emp.active) continue;
      if (isCurrent && rng() > Math.max(0.5, elapsedShare)) continue; // not everyone has been in yet
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
        // 09:30 to 18:00 IST on a random working day (or anywhere in the elapsed window, see offHours).
        const createdAt = offHours
          ? new Date(start.getTime() + rng() * (now.getTime() - start.getTime()))
          : new Date(days[Math.floor(rng() * days.length)].getTime() + (9.5 + rng() * 8.5) * 3600 * 1000);
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

// Creates/refreshes the two login accounts. Existing rows keep their name and type; email and role are set.
async function seedLoginAccounts(): Promise<void> {
  for (const a of LOGIN_ACCOUNTS) {
    await db.employee.upsert({
      where: { code: a.code },
      update: { email: a.email, role: a.role, active: true },
      create: { code: a.code, name: a.name, type: EmpType.WFO, email: a.email, role: a.role },
    });
  }
  console.log(`Login accounts ready: ${LOGIN_ACCOUNTS.map((a) => `${a.role} ${a.email}`).join(", ")}`);
}

// Employees created before V2 have no email; give them a placeholder so they are valid (and show no "Email missing").
async function backfillEmails(): Promise<void> {
  const missing = await db.employee.findMany({ where: { email: null }, select: { id: true, code: true } });
  for (const e of missing) {
    await db.employee.update({ where: { id: e.id }, data: { email: `${e.code.toLowerCase().replace(/[^a-z0-9-]/g, "")}@example.test` } });
  }
  if (missing.length > 0) console.log(`Gave ${missing.length} employees a placeholder email.`);
}

// Today's menu, only when the uncle has not set one yet.
async function seedTodayMenu(): Promise<void> {
  const { start } = dayRange(new Date());
  if ((await db.dailyMenu.count({ where: { date: start } })) > 0) return;
  const snacks = await db.snack.findMany({ where: { active: true }, orderBy: { id: "asc" }, take: MENU_SIZE, select: { id: true } });
  await db.dailyMenu.createMany({ data: snacks.map((s) => ({ date: start, snackId: s.id })) });
  console.log(`Set today's menu to ${snacks.length} snacks.`);
}

// A few entries on the employee login so their wallet has something to show. Only when they have none this month.
async function seedUserEntries(): Promise<void> {
  const user = await db.employee.findUnique({ where: { code: "USER-001" } });
  if (!user) return;
  const { start, end } = monthRange(new Date());
  if ((await db.consumption.count({ where: { employeeId: user.id, createdAt: { gte: start, lt: end } } })) > 0) return;
  const snacks = await db.snack.findMany({ where: { active: true }, orderBy: { id: "asc" }, take: 3 });
  const now = Date.now();
  await db.consumption.createMany({
    data: snacks.map((snack, i) => ({
      employeeId: user.id, snackId: snack.id, qty: 1, creditsCharged: snack.credits,
      // Spread over the last few hours, never before the month started.
      createdAt: new Date(Math.max(start.getTime(), now - (snacks.length - i) * 2 * 3600 * 1000)),
    })),
  });
  console.log(`Added ${snacks.length} entries for USER-001.`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--reset")) return reset();
  await seedLoginAccounts();
  await backfillEmails();
  await seed();
  await seedTodayMenu();
  await seedUserEntries();
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
