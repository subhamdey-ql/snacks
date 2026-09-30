# Snacks Credit Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking. **Read [CLAUDE.md](CLAUDE.md) and [DESIGN.md](DESIGN.md) before starting; CLAUDE.md rules apply to every task.**

**Goal:** A single-admin web app where the snacks uncle searches an employee, records snacks against a monthly credit balance, and sees balances reset each IST calendar month.

**Architecture:** One Next.js App Router app in the repo root. The "backend" is Next.js route handlers (`src/app/api/**`) that stay thin and call services in `src/server/<feature>/`. The "frontend" follows the module layout in CLAUDE.md (`src/modules/<feature>/{components,templates,hooks,types,utils}`), with React Query hooks calling `/api/*` through `apiFetch`. Postgres via Prisma. The balance is computed per month, so there is no expiry job.

**Tech Stack:** Next.js (TypeScript, App Router), Tailwind, shadcn/ui, TanStack React Query, Axios, react-hook-form + zod, nuqs, react-hot-toast, Prisma 6, Postgres, pnpm.

**Spec:** [DESIGN.md](DESIGN.md), [PRD.md](PRD.md)

## Global Constraints

Product:
- Month = calendar month in IST, fixed offset +05:30 (no DST).
- Insufficient credits **block** the entry (HTTP 422). Quantity is a whole number 1 to 20.
- Undo only voids entries from the **current** IST month; voided rows are never deleted.
- Allowance rows are append-only per (type, month); the latest row on or before the month applies. No allowance row means 0 credits.
- `creditsCharged` is stored on each entry; snack price changes never alter history.
- **All data lives in the database.** No `.json`/seed files for snacks, employees or allowances. The uncle enters snacks in the app, and sets allowances in Settings. Only `ADMIN_PASSWORD`, `SESSION_SECRET` and `DATABASE_URL` come from env.

Process (from CLAUDE.md):
- **Never run any git command** (no add/commit/branch). The user commits. Repo root only, **no wrapper/nested app folder**.
- **Tests are paused** per CLAUDE.md: write no tests and no test runner config. Verify with `pnpm type-check`, `pnpm lint`, `pnpm build` and the manual checks in each task.
- `pnpm type-check` (`tsc --noEmit`) must be clean after every task.
- TypeScript: no `any`, no `!` non-null assertions, no `as Type` except at external boundaries; explicit return types on functions; `unknown` + narrowing/zod for untrusted data.
- **Closed sets are TS `enum`s**, never raw string literals or literal unions. Shared enums live in `src/types/enums.ts` (used by 3+ modules); module-only enums go in that module's `types/enums.ts`. Prisma's generated `EmpType` is mapped to the TS enum in one place (`src/server/db-enums.ts`).
- Hooks: a `useXxxAPI()` factory file may call **only** `useQuery`/`useMutation`. Toasts and `invalidateQueries` live in a second orchestrating hook file (`useXxxActions.ts`). Consume `isPending`/`isLoading`/`isError` straight from the query/mutation; no shadow `useState`.
- No duplicate API calls; no reflexive `invalidateQueries`; do not import across modules; no relative imports (`@/` only); no barrel files except each module's `types/index.ts`.
- UI: shadcn/ui for every visual element; primary buttons via `CommonButton`; tables via `CommonTable` with `DataEmptyHandler`; long lists in `ScrollableList`; debounce with `useDebounce`; inputs via the form kit (`FormInputWrapper`/`RenderFormInput`); `cn()` for classes; extract components at ~30-40 lines into the module's own `components/`.
- **Mobile first**: base Tailwind classes are the phone layout; check every screen at 375px width before calling a task done.
- Backend: filter/sort/aggregate in Postgres (`where`, `aggregate`, `groupBy`), never `findMany()` then JS filter/reduce. Every field a query filters or sorts on is indexed (compound where queried together). List responses use `{ data, pagination: { total, page, limit, totalPages } }` with `limit` clamped to 1..100.
- Comment non-trivial blocks (why, not what). Skip comments on self-evident lines.
- End every reply to the user with the status checklist from CLAUDE.md (`Tests: paused, not writing tests for now`).
- Docs: PRD.md and DESIGN.md are the docs. Update them in the same task when behavior, endpoints or schema change (Task 11 does the final pass).

## Review Focus

Failure modes the spec implies; each is verified by the manual check named in brackets.
- Employee code typed lowercase or with spaces must still find the employee, and CSV codes are normalized on import [Task 7, Task 9 manual checks].
- Quantity `0`, negative, decimal or huge must be rejected and never charged [Task 8].
- A CSV with BOM, CRLF, blank lines or a bad type imports the good rows and reports the bad ones [Task 7].
- A deactivated snack or employee keeps its history in balances and reports [Task 8, Task 10].
- Two simultaneous submits for one employee must never overdraw [Task 8 concurrency check with two parallel curls].
- An entry at 23:59 IST on the last day belongs to that month; 00:00 IST on the 1st starts the next [Task 3 `monthRange` check via a scratch script].
- No allowance configured yet: the employee card must say so instead of silently showing 0 [Task 9].

## File Structure

```
package.json, tsconfig.json, next.config.ts, components.json     (scaffold, shadcn)
.env, .env.example
prisma/schema.prisma
src/types/enums.ts, src/types/api.ts
src/lib/api.ts, src/lib/utils.ts
src/hooks/useDebounce.ts
src/components/providers/app-providers.tsx
src/components/ui/*                                               (shadcn)
src/components/common/{common-button,common-table,data-empty-handler,common-loader,pagination,scrollable-list,toast}.tsx|ts
src/components/common/form/*, Input/*, select-field.tsx           (form kit, trimmed)
src/server/{env,db,db-enums,balance,http}.ts
src/server/auth/{token,session}.ts
src/server/{snack,allowance,employee,consumption,report}/*.service.ts, *.schema.ts
src/app/api/**/route.ts                                           (thin controllers)
src/modules/{auth,snacks,settings,employees,dashboard,reports}/{components,templates,hooks,types,utils}
src/app/login/page.tsx, src/app/(desk)/layout.tsx, src/app/(desk)/{page,employees,snacks,settings,reports}/...
```

---

### Task 1: Scaffold, shadcn, Prisma schema

**Files:** scaffold output, `.env`, `.env.example`, `prisma/schema.prisma`, `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:** Produces Prisma models `Employee`, `Snack`, `Allowance`, `Consumption` and enum `EmpType`; CSS tokens `--gos-blue`, `--gos-blue-dark`, `--gos-blue-light`, `--gos-page-bg`, `--gos-neutral-darker`, `--gos-red`, `--gos-green`, `--gos-r-card`, `--gos-r-btn`.

- [ ] **Step 1: Postgres and scaffold into the root**

```bash
docker run -d --name snacks-pg -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres:16
docker exec snacks-pg psql -U postgres -c "CREATE DATABASE snacks;"
cd /Users/subhamdey/snacks
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
pnpm add @prisma/client@6 @tanstack/react-query axios react-hook-form zod @hookform/resolvers nuqs react-hot-toast lucide-react
pnpm add -D prisma@6 tsx
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input table card badge dialog
pnpm approve-builds   # allow prisma, @prisma/client, @prisma/engines
```

If `create-next-app` refuses because the folder is not empty, move PRD.md, DESIGN.md, PLAN.md and CLAUDE.md out, scaffold, then move them back. Never scaffold into a subfolder. Add to `package.json` scripts: `"type-check": "tsc --noEmit"`.

- [ ] **Step 2: Env**

`.env`:
```
DATABASE_URL="postgresql://postgres:pw@localhost:5432/snacks"
ADMIN_PASSWORD="change-me"
SESSION_SECRET="change-me-to-a-long-random-string"
```
`.env.example`: same keys with placeholder values. Confirm `.gitignore` ignores `.env` but not `.env.example`.

- [ ] **Step 3: Schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum EmpType {
  HYBRID
  WFO
}

model Employee {
  id           Int           @id @default(autoincrement())
  code         String        @unique
  name         String
  type         EmpType
  active       Boolean       @default(true)
  consumptions Consumption[]

  // Search/list filters on active and orders by name.
  @@index([active, name])
}

model Snack {
  id           Int           @id @default(autoincrement())
  name         String        @unique
  credits      Int
  active       Boolean       @default(true)
  consumptions Consumption[]

  @@index([active, name])
}

// Append-only history: the row with the latest effectiveFrom <= a month's start applies to that month.
model Allowance {
  id            Int      @id @default(autoincrement())
  type          EmpType
  credits       Int
  effectiveFrom DateTime

  @@unique([type, effectiveFrom])
}

model Consumption {
  id             Int       @id @default(autoincrement())
  employeeId     Int
  snackId        Int
  qty            Int
  creditsCharged Int
  createdAt      DateTime  @default(now())
  voidedAt       DateTime?
  employee       Employee  @relation(fields: [employeeId], references: [id])
  snack          Snack     @relation(fields: [snackId], references: [id])

  // Balance: one employee, not voided, within a month.
  @@index([employeeId, voidedAt, createdAt])
  // Reports: all employees, not voided, within a month.
  @@index([createdAt, voidedAt])
}
```

Run: `pnpm prisma migrate dev --name init` → migration created.

- [ ] **Step 4: Design tokens and font**

Append to `src/app/globals.css` (inside `:root`, after the shadcn variables):
```css
  /* Growth OS design-system tokens used by CommonButton and the shell. */
  --gos-blue: #094ed2;
  --gos-blue-dark: #073b9e;
  --gos-blue-light: #e6edfb;
  --gos-page-bg: #f0f2f7;
  --gos-neutral-darker: #393b42;
  --gos-green: #12b76a;
  --gos-red: #dc2626;
  --gos-r-card: 12px;
  --gos-r-btn: 8px;
```
In `src/app/layout.tsx` use `Inter` from `next/font/google` (single font family, no other typeface), set `<body className={cn(inter.className, "bg-[var(--gos-page-bg)] text-[var(--gos-neutral-darker)]")}>`, title "Snacks Tracker".

- [ ] **Step 5: Verify**

Run: `pnpm type-check` (clean) and `pnpm build` (succeeds on the scaffold page).

---

### Task 2: Shared foundation (client)

**Files:**
- Create: `src/types/enums.ts`, `src/types/api.ts`, `src/lib/api.ts`, `src/hooks/useDebounce.ts`, `src/components/providers/app-providers.tsx`, `src/components/common/{common-button,common-table,data-empty-handler,common-loader,pagination,scrollable-list}.tsx`, `src/components/common/toast.ts`
- Copy (trimmed): form kit from `~/.claude/skills/nextjs-module-architecture/assets/form-components/`
- Modify: `src/app/layout.tsx` (wrap children in `AppProviders`)

**Interfaces:**
- Produces: `enum EmployeeType { WFO = "WFO", HYBRID = "HYBRID" }`; `interface Pagination { total; page; limit; totalPages }`; `interface Paginated<T> { data: T[]; pagination: Pagination }`; `apiFetch.get<T>(url, params?)`, `.post<T>(url, body?)`, `.patch<T>(url, body?)`, `.put<T>(url, body?)`; `openSuccessToast({message})`, `openErrorToast({error})`; `useDebounce<T>(value: T, delay = 500): T`; `CommonButton`; `CommonTable` (`columns: {key,label,align?}[]`, `data: Record<string, ReactNode>[]`); `DataEmptyHandler` (`data: readonly unknown[]`, `emptyMessage`, `children`); `CommonLoader`; `Pagination` (`page`, `totalPages`, `onPageChange`); `ScrollableList` (`className`, `children`).

- [ ] **Step 1: Types**

`src/types/enums.ts`:
```ts
// Employee category; decides which monthly allowance applies.
export enum EmployeeType {
  WFO = "WFO",
  HYBRID = "HYBRID",
}
```
`src/types/api.ts`:
```ts
export interface Pagination {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface Paginated<T> {
  readonly data: readonly T[];
  readonly pagination: Pagination;
}
```

- [ ] **Step 2: API client and toasts**

`src/lib/api.ts`:
```ts
import axios, { type AxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
}

// Same-origin API: the httpOnly session cookie rides along automatically.
export const apiClient = axios.create({ baseURL: "/api", withCredentials: true });

// A 401 anywhere except the login screen means the session expired: go to login.
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const onLogin = typeof window !== "undefined" && window.location.pathname.startsWith("/login");
    if (error.response?.status === 401 && typeof window !== "undefined" && !onLogin) {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export const apiFetch = {
  get: <T>(url: string, params?: object): Promise<T> => apiClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown): Promise<T> => apiClient.post<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown): Promise<T> => apiClient.patch<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown): Promise<T> => apiClient.put<T>(url, body).then((r) => r.data),
};
```
`src/components/common/toast.ts`:
```ts
import axios from "axios";
import toast from "react-hot-toast";

// Pulls the server's { message } out of an unknown error without casting.
function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
    return error.message;
  }
  return "Something went wrong";
}

export const openSuccessToast = ({ message }: { message: string }): string => toast.success(message);
export const openErrorToast = ({ error }: { error: unknown }): string => toast.error(errorMessage(error));
```

- [ ] **Step 3: Providers and hook**

`src/components/providers/app-providers.tsx`:
```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // One client per browser session; useState keeps it stable across renders.
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
```
`src/hooks/useDebounce.ts`:
```ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

- [ ] **Step 4: Common components**

`common-button.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Primary/submit button in the brand blue (shadcn's default variant would use --primary instead).
export function CommonButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button className={cn("bg-[var(--gos-blue)] text-white hover:bg-[var(--gos-blue-dark)]", className)} {...props} />;
}
```
`common-table.tsx`:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface CommonTableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: "left" | "right";
}

interface CommonTableProps {
  readonly columns: readonly CommonTableColumn[];
  readonly data: readonly Record<string, React.ReactNode>[];
}

// Config-driven table; shadcn's Table already scrolls horizontally on narrow screens.
export function CommonTable({ columns, data }: CommonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c.key} className={cn(c.align === "right" && "text-right")}>{c.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i}>
            {columns.map((c) => (
              <TableCell key={c.key} className={cn(c.align === "right" && "text-right")}>{row[c.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```
`data-empty-handler.tsx`:
```tsx
interface Props {
  readonly data: readonly unknown[];
  readonly emptyMessage: string;
  readonly children: React.ReactNode;
}

export function DataEmptyHandler({ data, emptyMessage, children }: Props) {
  if (data.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  return <>{children}</>;
}
```
`common-loader.tsx`:
```tsx
import { Loader2 } from "lucide-react";

export function CommonLoader() {
  return (
    <div className="flex justify-center py-8" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--gos-blue)]" />
    </div>
  );
}
```
`scrollable-list.tsx`:
```tsx
import { cn } from "@/lib/utils";

// Caps height and scrolls internally so a long list never turns into a full-page scroll.
export function ScrollableList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("max-h-[calc(100vh-320px)] overflow-y-auto", className)}>{children}</div>;
}
```
`pagination.tsx`:
```tsx
import { Button } from "@/components/ui/button";

interface Props {
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
      <span className="text-sm">Page {page} of {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  );
}
```
Wrap `{children}` in `<AppProviders>` in `src/app/layout.tsx`.

- [ ] **Step 5: Form kit (trimmed copy)**

Copy from `~/.claude/skills/nextjs-module-architecture/assets/form-components/` into `src/components/common/`: `form/form.tsx`, `form/form-input-wrapper.tsx`, `form/renderFormInput.tsx`, `Input/Input.tsx`, `Input/NumberInput.tsx`, `select-field.tsx`, and `ui/dropdown-menu.tsx` into `src/components/ui/` (needs `pnpm add @radix-ui/react-dropdown-menu`, or use `pnpm dlx shadcn@latest add dropdown-menu`). Then trim so it compiles with only what we use:
- In `renderFormInput.tsx` keep only the variants `input`, `passwordInput`, `numberInput`, `selectField`; delete every other variant's interface, `case`, import and union member (and the imports for packages we do not install).
- `select-field.tsx` imports `hasValue` from a foreign module: replace with an inline `value !== undefined && value !== ""` check. Define `SelectOption` as `{ label: string; value: string }` in `src/types/api.ts` and fix the import.
- Read `NumberInput.tsx` before using it: it must hand back a `number` (or a digit string that zod's `z.coerce.number()` accepts). If it formats with commas or a currency symbol, switch our number fields to `input` with `type="number"` handled in `Input.tsx`.
- Run `pnpm type-check` until clean.

- [ ] **Step 6: Verify**

`pnpm type-check` and `pnpm lint` clean; `pnpm build` succeeds.

---

### Task 3: Server core (env, db, month math, session, route wrapper)

**Files:** Create `src/server/{env,db,db-enums,balance,http}.ts`, `src/server/auth/{token,session}.ts`

**Interfaces:**
- Produces:
  - `requireEnv(name: string): string`
  - `db: PrismaClient`; `type Db = PrismaClient | Prisma.TransactionClient`
  - `DB_TYPE: Record<EmployeeType, EmpType>`
  - `monthRange(d: Date): { start: Date; end: Date }` (IST month, end exclusive); `monthLabel(d: Date): string` (`YYYY-MM` in IST); `monthFromParam(m: string | null, now?: Date): Date`
  - `makeToken(now?: number): string`, `checkToken(t: string | undefined, now?: number): boolean`, `passwordOk(p: string): boolean`
  - `startSession(): Promise<void>`, `endSession(): Promise<void>`, `isAuthed(): Promise<boolean>`, `requireAuth(): Promise<void>` (page guard, redirects to `/login`)
  - `class HttpError(status: number, message: string)`; `route(handler, opts?: { public?: boolean })`; `parseBody<T>(req: Request, schema: ZodType<T>): Promise<T>`; `parseQuery<T>(req: Request, schema: ZodType<T>): T`

- [ ] **Step 1: env, db, enums**

`src/server/env.ts`:
```ts
// Fails loudly at first use instead of passing `undefined` around.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}
```
`src/server/db.ts`:
```ts
import { PrismaClient, type Prisma } from "@prisma/client";

// Reuse one client across dev hot-reloads so we do not exhaust connections.
const g = globalThis as { db?: PrismaClient };
export const db: PrismaClient = g.db ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.db = db;

export type Db = PrismaClient | Prisma.TransactionClient;
```
`src/server/db-enums.ts`:
```ts
import { EmpType } from "@prisma/client";
import { EmployeeType } from "@/types/enums";

// The one place the app enum meets Prisma's generated enum.
export const DB_TYPE: Record<EmployeeType, EmpType> = {
  [EmployeeType.WFO]: EmpType.WFO,
  [EmployeeType.HYBRID]: EmpType.HYBRID,
};
```

- [ ] **Step 2: Month math**

`src/server/balance.ts`:
```ts
// India has no DST, so a fixed +05:30 offset is exact.
const IST_OFFSET_MS = 330 * 60 * 1000;

// [start, end) of the IST calendar month containing `d`.
export function monthRange(d: Date): { start: Date; end: Date } {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS),
    end: new Date(Date.UTC(y, m + 1, 1) - IST_OFFSET_MS),
  };
}

// "YYYY-MM" of the IST month containing `d`.
export function monthLabel(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 7);
}

// Any instant inside the requested IST month; falls back to `now` for a missing/invalid value.
export function monthFromParam(m: string | null, now = new Date()): Date {
  const hit = m ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(m) : null;
  if (!hit) return now;
  // Mid-month noon UTC is far from any IST month boundary.
  return new Date(Date.UTC(Number(hit[1]), Number(hit[2]) - 1, 15, 12));
}
```

- [ ] **Step 3: Session**

`src/server/auth/token.ts`:
```ts
import { createHmac, timingSafeEqual } from "crypto";
import { requireEnv } from "@/server/env";

export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

const sign = (value: string): string => createHmac("sha256", requireEnv("SESSION_SECRET")).update(value).digest("hex");

// Constant-time compare so timing cannot leak how much of a secret matched.
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function makeToken(now = Date.now()): string {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function checkToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  return safeEqual(sig, sign(exp)) && Number(exp) > now;
}

export function passwordOk(password: string): boolean {
  return safeEqual(password, requireEnv("ADMIN_PASSWORD"));
}
```
`src/server/auth/session.ts`:
```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkToken, makeToken, SESSION_TTL_MS } from "@/server/auth/token";

const COOKIE_NAME = "snacks_session";

export async function isAuthed(): Promise<boolean> {
  return checkToken((await cookies()).get(COOKIE_NAME)?.value);
}

// For server-component layouts/pages.
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/login");
}

export async function startSession(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
```

- [ ] **Step 4: Route wrapper**

`src/server/http.ts`:
```ts
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { isAuthed } from "@/server/auth/session";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

// Wraps every controller: auth gate (unless public) plus one place that turns
// known errors into { message } JSON with the right status.
export function route<C>(handler: Handler<C>, opts: { public?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (!opts.public && !(await isAuthed())) throw new HttpError(401, "Not logged in");
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ message: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ message: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
      // P2002 = unique constraint (duplicate code/name).
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ message: "That value already exists" }, { status: 409 });
      }
      console.error(e);
      return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const raw: unknown = await req.json().catch(() => ({}));
  return schema.parse(raw);
}

export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}
```

- [ ] **Step 5: Verify month boundaries (scratch, not committed)**

Create `scratch.ts` in the scratchpad dir (not in the repo) that imports nothing from the app; paste the `monthRange` body and assert with `node:assert`:
- `monthRange(new Date("2026-09-30T18:29:00Z")).start.toISOString() === "2026-08-31T18:30:00.000Z"` (23:59 IST Sep 30 is still September)
- `monthRange(new Date("2026-09-30T18:30:00Z")).start.toISOString() === "2026-09-30T18:30:00.000Z"` (00:00 IST Oct 1 starts October)
- `monthLabel(new Date("2026-09-15T10:00:00Z")) === "2026-09"`

Run with `pnpm tsx <scratch path>`. Then `pnpm type-check` and `pnpm lint`.

---

### Task 4: Auth (API, module, login page, desk layout)

**Files:**
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/modules/auth/{types/index.ts,utils/form-utils.ts,hooks/useAuthAPI.ts,hooks/useAuthActions.ts,templates/login-template.tsx}`, `src/app/login/page.tsx`, `src/app/(desk)/layout.tsx`, `src/components/common/desk-nav.tsx`

**Interfaces:**
- Consumes: `route`, `parseBody`, `HttpError`, `passwordOk`, `startSession`, `endSession`, `requireAuth`, `apiFetch`, `openErrorToast`, `CommonButton`, `FormInputWrapper`.
- Produces: `POST /api/auth/login {password}` → `{ ok: true }` (401 on wrong password); `POST /api/auth/logout`; hooks `useAuthAPI()` → `{ useLoginMutation, useLogoutMutation }`, `useLogin()` → `{ login, isPending }`, `useLogout()`.

- [ ] **Step 1: Controllers**

`src/app/api/auth/login/route.ts`:
```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordOk } from "@/server/auth/token";
import { startSession } from "@/server/auth/session";
import { HttpError, parseBody, route } from "@/server/http";

const loginSchema = z.object({ password: z.string().min(1, "Enter the password") });

export const POST = route(async (req) => {
  const { password } = await parseBody(req, loginSchema);
  if (!passwordOk(password)) throw new HttpError(401, "Wrong password");
  await startSession();
  return NextResponse.json({ ok: true });
}, { public: true });
```
`src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from "next/server";
import { endSession } from "@/server/auth/session";
import { route } from "@/server/http";

export const POST = route(async () => {
  await endSession();
  return NextResponse.json({ ok: true });
}, { public: true });
```

- [ ] **Step 2: Module**

`types/index.ts`: `export interface LoginDto { password: string }`.
`utils/form-utils.ts`:
```ts
import { z } from "zod";

export const loginSchema = z.object({ password: z.string().min(1, "Enter the password") });
export type LoginFormType = z.infer<typeof loginSchema>;
export const loginDefaults = (): LoginFormType => ({ password: "" });
```
`hooks/useAuthAPI.ts` (only `useMutation`):
```ts
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { LoginDto } from "@/modules/auth/types";

export const useAuthAPI = () => {
  const useLoginMutation = useMutation({
    mutationFn: (dto: LoginDto) => apiFetch.post<{ ok: boolean }>("/auth/login", dto),
  });
  const useLogoutMutation = useMutation({
    mutationFn: () => apiFetch.post<{ ok: boolean }>("/auth/logout"),
  });
  return { useLoginMutation, useLogoutMutation };
};
```
`hooks/useAuthActions.ts` (orchestrating; router + toast):
```ts
import { useRouter } from "next/navigation";
import { openErrorToast } from "@/components/common/toast";
import { useAuthAPI } from "@/modules/auth/hooks/useAuthAPI";
import type { LoginDto } from "@/modules/auth/types";

export const useLogin = () => {
  const router = useRouter();
  const mutation = useAuthAPI().useLoginMutation;
  const login = (dto: LoginDto): void =>
    mutation.mutate(dto, {
      onSuccess: () => router.replace("/"),
      onError: (error) => openErrorToast({ error }),
    });
  return { login, isPending: mutation.isPending };
};

export const useLogout = () => {
  const router = useRouter();
  const mutation = useAuthAPI().useLogoutMutation;
  const logout = (): void => mutation.mutate(undefined, { onSuccess: () => router.replace("/login") });
  return { logout, isPending: mutation.isPending };
};
```
`templates/login-template.tsx` ("use client"): `useForm<LoginFormType>({ resolver: zodResolver(loginSchema), defaultValues: loginDefaults() })`; local `showPassword` state (`useState`); render `<FormInputWrapper form={form} fieldConfig={{ name: "password", fieldVariant: "passwordInput", label: "Password", showPassword, handlePasswordVisibility: () => setShowPassword((v) => !v) }} />` and `<CommonButton type="submit" disabled={isPending}>Log in</CommonButton>` inside a `Card` (`mx-auto mt-16 w-full max-w-sm`), title "Snacks Tracker".

`src/app/login/page.tsx`: thin, renders `<LoginTemplate />`.

- [ ] **Step 3: Desk layout and nav**

`src/app/(desk)/layout.tsx` (Server Component):
```tsx
import { DeskNav } from "@/components/common/desk-nav";
import { requireAuth } from "@/server/auth/session";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(); // redirects to /login without a valid session
  return (
    <div className="mx-auto max-w-4xl p-4">
      <DeskNav />
      {children}
    </div>
  );
}
```
`desk-nav.tsx` ("use client"): links Dashboard `/`, Employees, Snacks, Settings, Reports in `nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-3"`, active link highlighted via `usePathname()`, plus a "Log out" `Button variant="ghost"` calling `useLogout().logout` pushed right (`ml-auto`).

- [ ] **Step 4: Verify**

`pnpm type-check`, `pnpm lint`. Manual: `pnpm dev`; `/` redirects to `/login`; a wrong password shows a red toast, `change-me` reaches `/` (404 until Task 9 is fine); reload keeps the session; Log out returns to `/login`. Check `/login` at 375px.

---

### Task 5: Snacks (API + module)

**Files:**
- Create: `src/server/snack/{snack.schema,snack.service}.ts`, `src/app/api/snacks/route.ts`, `src/app/api/snacks/[id]/route.ts`, `src/modules/snacks/{types/index.ts,utils/form-utils.ts,hooks/useSnackAPI.ts,hooks/useSnackActions.ts,components/snack-form-dialog.tsx,components/snack-table.tsx,templates/snacks-template.tsx}`, `src/app/(desk)/snacks/page.tsx`

**Interfaces:**
- Produces: `GET /api/snacks?includeInactive=true|false` → `Snack[]` (`{id,name,credits,active}`); `POST /api/snacks {name,credits}` (re-activates and re-prices an existing name) → `Snack`; `PATCH /api/snacks/:id {name?,credits?,active?}` → `Snack`.
- Module: `useSnackAPI()` → `{ useGetSnacksQuery(includeInactive), useSaveSnackMutation }`; `useSnackActions()` → `{ saveSnack, isSaving }`. Query key `["snacks", "manage", includeInactive]`.

- [ ] **Step 1: Server**

`snack.schema.ts`:
```ts
import { z } from "zod";

export const createSnackSchema = z.object({
  name: z.string().trim().min(1, "Enter a snack name").max(60),
  credits: z.coerce.number().int("Credits must be a whole number").min(1).max(1000),
});
export const updateSnackSchema = createSnackSchema.partial().extend({ active: z.boolean().optional() });
export const listSnackQuerySchema = z.object({ includeInactive: z.enum(["true", "false"]).optional() });
export type CreateSnackInput = z.infer<typeof createSnackSchema>;
export type UpdateSnackInput = z.infer<typeof updateSnackSchema>;
```
`snack.service.ts`:
```ts
import type { Snack } from "@prisma/client";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import type { CreateSnackInput, UpdateSnackInput } from "@/server/snack/snack.schema";

export function listSnacks(includeInactive: boolean): Promise<Snack[]> {
  return db.snack.findMany({ where: includeInactive ? {} : { active: true }, orderBy: { name: "asc" } });
}

// Adding a name that already exists re-activates it with the new cost instead of failing.
export function createSnack(input: CreateSnackInput): Promise<Snack> {
  return db.snack.upsert({ where: { name: input.name }, update: { credits: input.credits, active: true }, create: input });
}

export async function updateSnack(id: number, input: UpdateSnackInput): Promise<Snack> {
  const { count } = await db.snack.updateMany({ where: { id }, data: input });
  if (count === 0) throw new HttpError(404, "Snack not found");
  return db.snack.findUniqueOrThrow({ where: { id } });
}
```
Controllers (`route(...)` + `parseQuery`/`parseBody`, `NextResponse.json`). `[id]/route.ts` handler signature: `route(async (req, ctx: { params: Promise<{ id: string }> }) => { const id = Number((await ctx.params).id); ... })`; reject a non-integer `id` with `HttpError(400, "Invalid id")`.

- [ ] **Step 2: Module**

`types/index.ts`: `Snack { id: number; name: string; credits: number; active: boolean }`, `SaveSnackDto { id?: number; name: string; credits: number; active?: boolean }`.
`utils/form-utils.ts`: `snackSchema = z.object({ name: z.string().trim().min(1, "Enter a snack name"), credits: z.coerce.number().int().min(1, "At least 1 credit") })`, `SnackFormType`, `snackDefaults(snack?: Snack)`. Note: with `z.coerce`, use `z.input`/`z.output` types per the resolver's version so `useForm` types line up; if types fight, type the form as the schema's input type.
`hooks/useSnackAPI.ts`: query `useGetSnacksQuery(includeInactive: boolean)` with `queryKey: ["snacks", "manage", includeInactive]`, `queryFn: () => apiFetch.get<Snack[]>("/snacks", { includeInactive })`; mutation `useSaveSnackMutation` with `mutationFn: (dto: SaveSnackDto) => dto.id ? apiFetch.patch<Snack>(`/snacks/${dto.id}`, dto) : apiFetch.post<Snack>("/snacks", dto)`. Nothing else in the file.
`hooks/useSnackActions.ts`: `useQueryClient`; `saveSnack(dto, onDone?)` → mutate with `onSuccess: () => { invalidateQueries({ queryKey: ["snacks"] }); openSuccessToast({ message: "Snack saved" }); onDone?.(); }`, `onError: openErrorToast`. Invalidate the `["snacks"]` prefix (covers the dashboard's snack dropdown too).
`components/snack-form-dialog.tsx`: shadcn `Dialog` holding the RHF form (fields `name` → `input`, `credits` → `numberInput`), submit `CommonButton`; used for Add (no snack) and Edit (snack prop). Fields stack to one column on mobile.
`components/snack-table.tsx`: `CommonTable` with columns Name, Credits, Status (`Badge`), Actions (Edit, Activate/Deactivate `Button` `variant="outline"` size sm); rows built with `useMemo`.
`templates/snacks-template.tsx` ("use client"): header row (`flex flex-wrap`) with "Add snack" `CommonButton` and a "Show inactive" checkbox (shadcn `Checkbox`: `pnpm dlx shadcn@latest add checkbox`), `isLoading` → `CommonLoader`, else `DataEmptyHandler` (message "No snacks yet. Add your first snack.") around `SnackTable`. `page.tsx` is a thin wrapper.

- [ ] **Step 3: Verify**

`pnpm type-check`, `pnpm lint`. Manual: add "Lays chips" with 2 credits; add the same name with 3 → one row, cost 3; deactivate hides it until "Show inactive"; empty name and credits `0`/`2.5` are rejected. Check at 375px.

---

### Task 6: Settings (monthly allowance)

**Files:**
- Create: `src/server/allowance/{allowance.schema,allowance.service}.ts`, `src/app/api/settings/allowance/route.ts`, `src/modules/settings/{types/index.ts,utils/form-utils.ts,hooks/useAllowanceAPI.ts,hooks/useAllowanceActions.ts,templates/settings-template.tsx}`, `src/app/(desk)/settings/page.tsx`

**Interfaces:**
- Consumes: `monthRange`, `DB_TYPE`, `db`, `Db`, `EmployeeType`.
- Produces: `GET /api/settings/allowance` → `{ WFO: number; HYBRID: number }` for the current month; `PUT /api/settings/allowance {WFO,HYBRID}` (applies from the current month; same-month re-save replaces); server function `getAllowance(db: Db, type: EmployeeType, monthStart: Date): Promise<number>` (0 when none), used by Tasks 8 and 10.

- [ ] **Step 1: Server**

`allowance.service.ts`:
```ts
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
```
`allowance.schema.ts`: `z.object({ [EmployeeType.WFO]: credit, [EmployeeType.HYBRID]: credit })` where `credit = z.coerce.number().int().min(0).max(10000)`. Controller: `GET` and `PUT` with `route(...)`.

- [ ] **Step 2: Module**

`types/index.ts`: `type AllowanceMap = Record<EmployeeType, number>`. `form-utils.ts`: `allowanceSchema` with the same two keys (`z.coerce.number().int().min(0, "Cannot be negative")`), `AllowanceFormType`, `allowanceDefaults()`. `useAllowanceAPI`: `useGetAllowanceQuery` (key `["allowance"]`) and `useSaveAllowanceMutation` (`apiFetch.put`). `useAllowanceActions`: `saveAllowance(dto)` → on success invalidate `["allowance"]` **and** `["employee-month"]` (balances depend on it), success toast "Monthly credits saved". `settings-template.tsx`: `useForm({ resolver, values: data })` (so the form fills from the query), two `numberInput` fields labelled "Work from office (credits per month)" and "Hybrid (credits per month)", helper text "Applies from this month onward. Past months keep their old value.", `CommonButton` Save. Thin `page.tsx`.

- [ ] **Step 3: Verify**

`pnpm type-check`, `pnpm lint`. Manual: set WFO 20 / Hybrid 10, reload, values persist; save again with new numbers → still one row per type for the month (check with `pnpm prisma studio`); `-1` is rejected. Check at 375px.

---

### Task 7: Employees (API + module + CSV import)

**Files:**
- Create: `src/server/employee/{employee.schema,employee.csv,employee.service}.ts`, `src/app/api/employees/route.ts`, `src/app/api/employees/[id]/route.ts`, `src/app/api/employees/import/route.ts`, `src/modules/employees/{types/index.ts,utils/form-utils.ts,hooks/useEmployeeAPI.ts,hooks/useEmployeeActions.ts,components/{employee-form-dialog,employee-table,employee-csv-import}.tsx,templates/employees-template.tsx}`, `src/app/(desk)/employees/page.tsx`

**Interfaces:**
- Consumes: `db`, `DB_TYPE`, `EmployeeType`, `Paginated`, `Pagination`, `route`, `parseQuery`, `parseBody`, `HttpError`.
- Produces:
  - `GET /api/employees?q&page&limit&active` → `Paginated<Employee>`; `Employee { id; code; name; type: EmployeeType; active }`
  - `POST /api/employees {code,name,type}` (upsert by normalized code, re-activates) → `Employee`
  - `PATCH /api/employees/:id {code?,name?,type?,active?}` → `Employee`
  - `POST /api/employees/import` (multipart `file`) → `{ imported: number; errors: string[] }`
  - `normCode(s: string): string` (trim + uppercase); `parseEmployeeCsv(text: string): { rows: { code; name; type: EmployeeType }[]; errors: string[] }`

- [ ] **Step 1: Server schema, CSV, service**

`employee.schema.ts`:
```ts
import { z } from "zod";
import { EmployeeType } from "@/types/enums";

export const normCode = (s: string): string => s.trim().toUpperCase();

export const createEmployeeSchema = z.object({
  code: z.string().min(1, "Enter the employee code").max(30).transform(normCode),
  name: z.string().trim().min(1, "Enter the name").max(100),
  type: z.enum(EmployeeType),
});
export const updateEmployeeSchema = createEmployeeSchema.partial().extend({ active: z.boolean().optional() });

export const listEmployeeQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
  active: z.enum(["true", "false"]).optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeeQuery = z.infer<typeof listEmployeeQuerySchema>;
```
(If the installed zod is v3, use `z.nativeEnum(EmployeeType)`.)

`employee.csv.ts`:
```ts
import { EmployeeType } from "@/types/enums";
import { normCode } from "@/server/employee/employee.schema";

export interface CsvEmployeeRow {
  readonly code: string;
  readonly name: string;
  readonly type: EmployeeType;
}

const isEmployeeType = (v: string): v is EmployeeType => Object.values<string>(EmployeeType).includes(v);

// Plain comma split with no quoted fields; add a CSV parser if names ever contain commas.
export function parseEmployeeCsv(text: string): { rows: CsvEmployeeRow[]; errors: string[] } {
  const rows: CsvEmployeeRow[] = [];
  const errors: string[] = [];
  // Strip a BOM (Excel adds one) and accept both LF and CRLF.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const [code = "", name = "", rawType = ""] = line.split(",").map((x) => x.trim());
    const type = rawType.toUpperCase();
    if (i === 0 && code.toLowerCase() === "code") return; // header row
    if (!code || !name || !isEmployeeType(type)) {
      errors.push(`Line ${i + 1}: expected code,name,WFO|HYBRID`);
      return;
    }
    rows.push({ code: normCode(code), name, type });
  });
  return { rows, errors };
}
```
`employee.service.ts`:
```ts
import { Prisma, type Employee } from "@prisma/client";
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
    db.employee.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
    db.employee.count({ where }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const type = DB_TYPE[input.type];
  return db.employee.upsert({
    where: { code: input.code },
    update: { name: input.name, type, active: true },
    create: { code: input.code, name: input.name, type },
  });
}

export async function updateEmployee(id: number, input: UpdateEmployeeInput): Promise<Employee> {
  const { type, ...rest } = input;
  const { count } = await db.employee.updateMany({ where: { id }, data: { ...rest, ...(type ? { type: DB_TYPE[type] } : {}) } });
  if (count === 0) throw new HttpError(404, "Employee not found");
  return db.employee.findUniqueOrThrow({ where: { id } });
}

// Upserts good rows in chunks (one round-trip per chunk) and reports bad lines.
export async function importEmployees(file: File): Promise<{ imported: number; errors: string[] }> {
  if (file.size > MAX_CSV_BYTES) throw new HttpError(400, "File is too large (max 1 MB)");
  const { rows, errors } = parseEmployeeCsv(await file.text());
  if (rows.length > MAX_CSV_ROWS) throw new HttpError(400, `Too many rows (max ${MAX_CSV_ROWS})`);
  for (let i = 0; i < rows.length; i += IMPORT_CHUNK) {
    await db.$transaction(
      rows.slice(i, i + IMPORT_CHUNK).map((r) =>
        db.employee.upsert({
          where: { code: r.code },
          update: { name: r.name, type: DB_TYPE[r.type] },
          create: { code: r.code, name: r.name, type: DB_TYPE[r.type] },
        }),
      ),
    );
  }
  return { imported: rows.length, errors };
}
```
Controllers: list (`parseQuery`), create (`parseBody`), `[id]` PATCH, `import` POST reads `(await req.formData()).get("file")`, `instanceof File` else `HttpError(400, "Choose a CSV file")`.

- [ ] **Step 2: Module hooks, types, form**

`types/index.ts`: `Employee`, `SaveEmployeeDto { id?; code; name; type: EmployeeType; active?: boolean }`, `EmployeeListQuery { q?: string; page: number; limit: number }`, `ImportResult { imported: number; errors: string[] }`.
`utils/form-utils.ts`: `employeeSchema` (`code` min 1, `name` min 1, `type: z.enum(EmployeeType)`), `EmployeeFormType`, `employeeDefaults(e?: Employee)`, `employeeTypeOptions = [{ label: "Work from office", value: EmployeeType.WFO }, { label: "Hybrid", value: EmployeeType.HYBRID }]`.
`useEmployeeAPI.ts` (only useQuery/useMutation): `useGetEmployeesQuery(query)` key `["employees", query.q, query.page, query.limit]`; `useSaveEmployeeMutation` (PATCH when `id`, else POST); `useImportEmployeesMutation` (`FormData` with `file`, `apiFetch.post<ImportResult>("/employees/import", fd)`).
`useEmployeeActions.ts`: `saveEmployee(dto, onDone?)` and `importEmployees(file, onDone?)` → invalidate `["employees"]` once, toasts; import success toast `Imported N` plus a warning toast listing the skipped lines when `errors.length > 0`.

- [ ] **Step 3: Module UI**

- `employee-form-dialog.tsx`: `Dialog` + RHF form; fields `code` (`input`), `name` (`input`), `type` (`selectField` with `employeeTypeOptions`, `placeHolder: "Type"`); Add/Edit by prop.
- `employee-csv-import.tsx`: a `Card` with a file `Input type="file" accept=".csv"` (shadcn `Input`; the form kit has no file variant we kept) and an "Import CSV" `CommonButton`; helper text "Columns: code,name,WFO|HYBRID". Local `File | null` via `useState` is fine (not request state).
- `employee-table.tsx`: `CommonTable` columns Code, Name, Type, Status, Actions (Edit; Activate/Deactivate); `useMemo` rows.
- `employees-template.tsx` ("use client"): `useQueryState("page", parseAsInteger.withDefault(1))` and `useQueryState("q")` from `nuqs`; a search `Input` bound to local text, `useDebounce(text)` feeding the `q` param and resetting page to 1; `useGetEmployeesQuery({ q, page, limit: 10 })`; `CommonLoader` while loading, `DataEmptyHandler` ("No employees found."), `EmployeeTable`, `Pagination`. Header row `flex flex-wrap gap-2` with the Add button.

- [ ] **Step 4: Verify**

`pnpm type-check`, `pnpm lint`. Manual:
- Import a CSV with a BOM, CRLF endings, a blank line, `e001 ,Asha,wfo`, and a bad row (`E2,Ravi,REMOTE`): Asha appears as `E001`/WFO, the bad line is reported by number.
- Re-importing updates rather than duplicating. Adding `e001` again updates Asha.
- Search `ash` and `e00` both find her; paging works with >10 rows; the `?page=` URL survives reload.
- Check at 375px.

---

### Task 8: Consumption service (record, void, month summary)

**Files:**
- Create: `src/server/consumption/{consumption.schema,consumption.service}.ts`, `src/app/api/consumptions/route.ts`, `src/app/api/consumptions/[id]/void/route.ts`, `src/app/api/employees/[id]/month/route.ts`

**Interfaces:**
- Consumes: `getAllowance`, `monthRange`, `db`, `Db`, `HttpError`, `EmployeeType`.
- Produces:
  - `getBalance(client: Db, emp: { id: number; type: EmployeeType }, now?: Date): Promise<Balance>` where `Balance { allowance: number; used: number; remaining: number }`
  - `recordConsumption(input: { employeeId: number; snackId: number; qty: number }, now?: Date): Promise<void>` (throws `HttpError` 400/404/422)
  - `voidConsumption(id: number, now?: Date): Promise<void>`
  - `getEmployeeMonth(employeeId: number, now?: Date): Promise<EmployeeMonth>` where `EmployeeMonth { employee: { id; code; name; type; active }; balance: Balance; entries: { id; snackName; qty; creditsCharged; createdAt: Date; voidedAt: Date | null }[] }`
  - `POST /api/consumptions {employeeId,snackId,qty}` → `{ ok: true }`; `POST /api/consumptions/:id/void`; `GET /api/employees/:id/month` → `EmployeeMonth`.

- [ ] **Step 1: Schema and service**

`consumption.schema.ts`:
```ts
import { z } from "zod";

// qty is a whole number 1..20; anything else is rejected before touching the DB.
export const recordSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  snackId: z.coerce.number().int().positive(),
  qty: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(20, "Quantity can be at most 20"),
});
export type RecordInput = z.infer<typeof recordSchema>;
```
`consumption.service.ts`:
```ts
import { EmpType } from "@prisma/client";
import { getAllowance } from "@/server/allowance/allowance.service";
import { monthRange } from "@/server/balance";
import { db, type Db } from "@/server/db";
import { HttpError } from "@/server/http";
import type { RecordInput } from "@/server/consumption/consumption.schema";
import { EmployeeType } from "@/types/enums";

export interface Balance {
  readonly allowance: number;
  readonly used: number;
  readonly remaining: number;
}

const toAppType = (t: EmpType): EmployeeType => (t === EmpType.WFO ? EmployeeType.WFO : EmployeeType.HYBRID);

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
    const { remaining } = await getBalance(tx, { id: emp.id, type: toAppType(emp.type) }, now);
    if (cost > remaining) throw new HttpError(422, `Not enough credits: needs ${cost}, has ${remaining}`);
    await tx.consumption.create({
      data: { employeeId: emp.id, snackId: snack.id, qty: input.qty, creditsCharged: cost, createdAt: now },
    });
  });
}

export async function voidConsumption(id: number, now = new Date()): Promise<void> {
  const entry = await db.consumption.findUnique({ where: { id } });
  if (!entry) throw new HttpError(404, "Entry not found");
  if (entry.voidedAt) return; // already voided: idempotent
  // Undo is limited to the current month, so past months stay final.
  if (entry.createdAt < monthRange(now).start) throw new HttpError(422, "Only this month's entries can be undone");
  await db.consumption.update({ where: { id }, data: { voidedAt: now } });
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
  const type = toAppType(emp.type);
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
```
Controllers: `consumptions/route.ts` POST (`parseBody(req, recordSchema)`, `recordConsumption`, `{ ok: true }` with status 201); `consumptions/[id]/void/route.ts` POST; `employees/[id]/month/route.ts` GET. Validate `id` params as integers (400 otherwise).

- [ ] **Step 2: Verify with curl (log in first, keep the cookie)**

```bash
curl -c jar -H 'content-type: application/json' -d '{"password":"change-me"}' localhost:3000/api/auth/login
```
Using an employee/snack created in Tasks 5 to 7 (WFO allowance 20, a 15-credit snack `S`):
- `qty` 0, -1, 1.5, 21, "abc" → 400 each; the balance is unchanged.
- Record `S` ×1 → 201; again → 422 "Not enough credits"; `GET /api/employees/ID/month` shows remaining 5.
- Concurrency: run two `curl -X POST … qty 1` for `S` in parallel (`&` then `wait`) on a fresh employee → exactly one 201 and one 422.
- Void the entry → remaining back to 20; voiding again → 200; edit the row's `createdAt` to last month via `pnpm prisma studio` → void returns 422.
- Deactivate the snack after an entry exists → the balance still counts that entry.

`pnpm type-check`, `pnpm lint`.

---

### Task 9: Dashboard (search, record, undo)

**Files:**
- Create: `src/modules/dashboard/{types/index.ts,utils/form-utils.ts,hooks/useDashboardAPI.ts,hooks/useDashboardActions.ts,components/{employee-search,employee-card,record-form,cost-preview,month-entries}.tsx,templates/dashboard-template.tsx}`, `src/app/(desk)/page.tsx`

**Interfaces:**
- Consumes: `GET /api/employees?q&limit=10&active=true`, `GET /api/snacks` (active only), `GET /api/employees/:id/month`, `POST /api/consumptions`, `POST /api/consumptions/:id/void` (all built above). No imports from other modules; the module defines its own copies of the response types.
- Produces: the app's home page.

- [ ] **Step 1: Types, hooks**

`types/index.ts`: `EmployeeHit { id; code; name; type: EmployeeType }`, `SnackOption { id; name; credits }`, `Balance`, `MonthEntry { id; snackName; qty; creditsCharged; createdAt: string; voidedAt: string | null }`, `EmployeeMonth { employee; balance; entries }`, `RecordDto { employeeId; snackId; qty }`.
`useDashboardAPI.ts` (only useQuery/useMutation):
- `useSearchEmployeesQuery(q: string)`: key `["employees", "search", q]`, `enabled: q.trim().length > 0`, `queryFn: () => apiFetch.get<Paginated<EmployeeHit>>("/employees", { q, limit: 10, active: true }).then((r) => r.data)`.
- `useActiveSnacksQuery()`: key `["snacks", "active"]`.
- `useEmployeeMonthQuery(id: number | null)`: key `["employee-month", id]`, `enabled: id !== null`.
- `useRecordMutation`, `useVoidMutation`.
`useDashboardActions.ts`: `record(dto, onDone?)` and `voidEntry(id, employeeId)` → on success invalidate only `["employee-month", employeeId]`; success toast "Recorded" / "Entry undone"; `onError: openErrorToast` (shows the server's "Not enough credits…" message).
`utils/form-utils.ts`: `recordSchema = z.object({ snackId: z.string().min(1, "Pick a snack"), qty: z.coerce.number().int().min(1).max(20) })`, `recordDefaults()` (`qty: 1`), plus `formatIst(iso: string): string` using `toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })`.

- [ ] **Step 2: Components**

- `employee-search.tsx`: shadcn `Input` (autofocus, placeholder "Search employee name or code") + results as full-width buttons ("Asha Rao (E001 · WFO)"). Receives `onSelect`. Uses `useDebounce` on the text and `useSearchEmployeesQuery`. Shows "No employee found." when a debounced query returns nothing.
- `employee-card.tsx`: name/code/type header, big "N credits left", a red notice "Monthly credits are not set for this employee type. Set them in Settings." when `balance.allowance === 0`, an "Inactive" notice when `!employee.active`; renders `RecordForm` (hidden when inactive) and `MonthEntries`.
- `record-form.tsx`: RHF + zod form, fields `snackId` (`selectField`, options `${name} (${credits})`), `qty` (`numberInput`), `CostPreview`, `CommonButton` "Record". Layout `flex flex-col gap-2 sm:flex-row`. On success reset `qty` to 1.
- `cost-preview.tsx`: small child using `useWatch({ control, name: ["snackId", "qty"] })` to show "Costs N credits, M left after" (RHF rule: scoped watch only, never in the form body).
- `month-entries.tsx`: `ScrollableList` of this month's rows: "Lays chips × 2 = 4 · 12 Sep, 3:41 pm", voided rows greyed with line-through and no button; "Undo" `Button variant="ghost"` size sm for active ones; `DataEmptyHandler` ("Nothing recorded this month.").

- [ ] **Step 3: Template and page**

`dashboard-template.tsx` ("use client"): `useQueryState("emp", parseAsInteger)` for the selected employee (URL-synced); when set, render `EmployeeCard` (loading → `CommonLoader`, error → inline message); otherwise `EmployeeSearch`. A "Search another employee" `Button variant="outline"` clears `emp`. `page.tsx` is thin.

- [ ] **Step 4: Verify (manual, at 1280px and 375px)**

`pnpm type-check`, `pnpm lint`. Then:
- Search by lowercase code with stray spaces finds the employee; select → balance shows.
- Record Lays ×2 → balance drops by 4, the entry appears, the cost preview matches.
- Undo restores the balance. Recording more than the balance shows the red toast and changes nothing.
- With no allowance saved (fresh DB), the card shows the "not set" notice.
- Reload keeps the selected employee; the record form and buttons are usable at 375px with no horizontal scroll.

---

### Task 10: Reports (API + module + CSV export)

**Files:**
- Create: `src/server/report/report.service.ts`, `src/app/api/reports/route.ts`, `src/app/api/reports/export/route.ts`, `src/modules/reports/{types/index.ts,hooks/useReportAPI.ts,components/{employee-report-table,snack-report-table}.tsx,templates/reports-template.tsx}`, `src/app/(desk)/reports/page.tsx`

**Interfaces:**
- Consumes: `monthRange`, `monthFromParam`, `monthLabel`, `getAllowance`, `db`.
- Produces: `getReport(monthParam: string | null): Promise<Report>` where `Report { month: string; perEmployee: { code; name; allowance; used; remaining }[]; perSnack: { name; qty; credits }[] }`; `GET /api/reports?m=YYYY-MM` → `Report`; `GET /api/reports/export?m=YYYY-MM` → `text/csv` attachment.

- [ ] **Step 1: Server**

`report.service.ts`:
```ts
import { EmpType } from "@prisma/client";
import { getAllowance } from "@/server/allowance/allowance.service";
import { monthFromParam, monthLabel, monthRange } from "@/server/balance";
import { db } from "@/server/db";
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
      const allowance = e.type === EmpType.WFO ? wfo : hybrid;
      const used = usedById.get(e.id) ?? 0;
      return { code: e.code, name: e.name, allowance, used, remaining: allowance - used };
    }),
    perSnack: bySnack
      .map((r) => ({ name: snackName.get(r.snackId) ?? "Unknown", qty: r._sum.qty ?? 0, credits: r._sum.creditsCharged ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
```
`GET /api/reports` reads `m` from the query (`new URL(req.url).searchParams.get("m")`). `export/route.ts` builds CSV with a small local `toCsv(rows: (string | number)[][]): string` that quotes cells containing `,` `"` or newline (doubling quotes) and returns `new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="snacks-${report.month}.csv"` } })`; sections: employee table, blank line, snack table.

- [ ] **Step 2: Module**

`types/index.ts`: `Report` (same shape). `useReportAPI.ts`: `useGetReportQuery(month: string | null)`, key `["report", month]`, `apiFetch.get<Report>("/reports", month ? { m: month } : undefined)`. `employee-report-table.tsx` / `snack-report-table.tsx`: `CommonTable` inside `ScrollableList` with `DataEmptyHandler`. `reports-template.tsx` ("use client"): `useQueryState("m")` bound to a shadcn `Input type="month"`; toolbar `flex flex-wrap gap-2`; "Download CSV" is `<Button variant="outline" asChild><a href={`/api/reports/export?m=${report.month}`}>Download CSV</a></Button>`; loading → `CommonLoader`. Thin `page.tsx`.

- [ ] **Step 3: Verify**

`pnpm type-check`, `pnpm lint`. Manual:
- Record a few entries, open Reports: per-employee "Used" matches each dashboard card; per-snack totals match; voided entries are excluded.
- A deactivated employee with usage this month still appears.
- Switch to last month: no usage, full allowances shown (from the allowance history). An invalid `?m=zzz` falls back to the current month.
- The downloaded CSV opens with both sections. Check the page at 375px.

---

### Task 11: Final checks, docs, deploy notes

**Files:** Modify `README.md` (replace scaffold text), `PRD.md`, `DESIGN.md` (only if behavior drifted from them during the build)

- [ ] **Step 1: Full verification**

`pnpm type-check`, `pnpm lint`, `pnpm build` all clean. Confirm `grep -rn "\bany\b\|as any" src` finds no `any`, and `grep -rnE "[A-Za-z_)\]]!\." src` finds no non-null assertions. Confirm there is no `.json` data file used at runtime (`prisma/snacks.json` must not exist).

- [ ] **Step 2: Docs**

Update PRD.md and DESIGN.md so they match what was built (endpoints, module layout, "no seed data" and how to start: add snacks in the app, set allowances in Settings, import employees by CSV). README.md: env vars, `pnpm dev`, `pnpm prisma migrate deploy`, first-run steps, deploy steps.

- [ ] **Step 3: Deploy notes (README)**

1. Create a Neon (or Supabase) Postgres database, copy its connection string.
2. Push the repo (the user does the git steps) and import it into Vercel.
3. Env vars in Vercel: `DATABASE_URL`, `ADMIN_PASSWORD` (long), `SESSION_SECRET` (`openssl rand -hex 32`).
4. Vercel build command: `prisma migrate deploy && next build`.
5. After first deploy: log in, add snacks, set Settings allowances, import the employee CSV.
6. Enable automated backups in the database provider's dashboard.

---

## Self-Review

- **Spec coverage:** employees + CSV import (T7), snacks in DB only (T5), configurable allowance with append-only history (T6), IST month + expiry-by-computation (T3, T8), block on insufficient balance and qty limits and row lock (T8), undo current-month only (T8, T9), search (T7, T9), reports + CSV (T10), single-admin auth (T3, T4), shadcn UI (T1, T2), deploy (T11). Tests are intentionally absent per CLAUDE.md.
- **CLAUDE.md compliance:** module layout, API-hook rules, enums, DB-side aggregation and indexes, pagination shape, mobile checks, no git, status checklist are all in Global Constraints and enforced per task. Deviations: (1) CSV import is a small purpose-built panel, because the `mapped-*` CSV architecture and the animated-icon set live in the other codebase and do not exist here; (2) `DeskNav` replaces the DeskShell; (3) icons use bare `lucide-react` for the same reason; (4) `db`/services live in `src/server/` instead of NestJS modules.
- **Type consistency:** `Db`, `Balance`, `EmployeeMonth`, `getAllowance`, `getBalance`, `monthRange`, `monthLabel`, `monthFromParam`, `DB_TYPE`, `Paginated` signatures match across tasks.
