# Snacks Credit Tracker: Design Spec

Implements [PRD.md](PRD.md). Built per the rules in [CLAUDE.md](CLAUDE.md). Task-by-task steps are in [PLAN.md](PLAN.md).

## 1. Architecture
One Next.js (App Router, TypeScript) app in the repo root. No separate backend service.

```
Browser (React Query hooks) -> /api/* route handlers (thin controllers)
                            -> src/server/<feature>/*.service.ts -> Prisma -> Postgres
```
- **Backend:** route handlers in `src/app/api/**` only validate input (zod), call a service, and shape the response. Services in `src/server/<feature>/` hold the logic. `route()` in `src/server/http.ts` is the single place that handles auth and turns errors into `{ message }` JSON.
- **Frontend:** feature modules in `src/modules/<feature>/{components,templates,hooks,types,utils}`. Pages are thin and render a template. Data goes through `useXxxAPI()` factories (only `useQuery`/`useMutation`, calling the shared `apiFetch` wrapper in `src/lib/api.ts`, which redirects to `/login` on a 401) and separate orchestrating hooks for toasts and cache invalidation. UI is shadcn/ui with `CommonButton`, `CommonTable`, `DataEmptyHandler`, `ScrollableList`, and the react-hook-form + zod form kit.
- **Data:** everything is in Postgres. There are no seed or JSON data files. Snacks are added in the app, allowances are set in Settings, employees are added or imported by CSV.
- **Stack:** Next.js, Tailwind, shadcn/ui, TanStack Query, Axios, react-hook-form, zod, nuqs, react-hot-toast, Prisma 6, pnpm. Deploy on Vercel with Neon or Supabase.

## 2. Data model
```
Employee    id, code UNIQUE, name, type (HYBRID|WFO), active     idx (active, name)
Snack       id, name UNIQUE, credits, active                     idx (active, name)
Allowance   id, type, credits, effectiveFrom                     UNIQUE (type, effectiveFrom)
Consumption id, employeeId, snackId, qty, creditsCharged,
            createdAt, voidedAt?                                 idx (employeeId, voidedAt, createdAt), (createdAt, voidedAt), (employeeId, createdAt)
```
`Allowance` is append-only. Saving inserts or replaces the row effective from the current month's IST start. A month's allowance is the latest row on or before the month start (0 if none, so months before the first setting show 0), so past months are never rewritten.

## 3. Balance logic
- `monthRange(date)` gives the IST calendar month `[start, end)`.
- `remaining = allowance(type, month) − SUM(creditsCharged)` over non-voided entries in the month. The sum is computed in Postgres.
- Expiry falls out of this: a new month is a new range and starts at the full allowance. No cron job.

## 4. API
| Method and path | Purpose |
|---|---|
| `POST /api/auth/login`, `POST /api/auth/logout` | Single-admin session (public routes) |
| `GET /api/employees?q&page&limit&active` | Paginated search: `{ data, pagination:{total,page,limit,totalPages} }`, limit clamped 1..100 |
| `POST /api/employees`, `PATCH /api/employees/:id` | Create or upsert by normalized code; edit; activate or deactivate |
| `POST /api/employees/import` | CSV `code,name,WFO\|HYBRID`; imports good rows (an imported row re-activates an inactive employee, like `POST /api/employees`), reports bad lines |
| `GET /api/employees/:id/month` | Employee, this month's balance and entries |
| `GET/POST /api/snacks`, `PATCH /api/snacks/:id` | Snack catalog (`GET ?includeInactive=true` lists all; qty per entry is 1..20) (POST on an existing name re-activates and re-prices) |
| `GET/PUT /api/settings/allowance` | Current monthly credits per type; PUT applies from this month |
| `POST /api/consumptions` | Record `{employeeId, snackId, qty}` (400 invalid, 404 missing, 422 insufficient) |
| `POST /api/consumptions/:id/void` | Undo; current IST month only (422 otherwise) |
| `GET /api/reports?m=YYYY-MM`, `GET /api/reports/export?m=` | Monthly totals per employee and per snack; CSV download (cells starting with `= + - @` get a leading `'` to block spreadsheet formula injection) |

## 5. Key flows
**Record:** one transaction. It takes a row lock on the employee (`SELECT … FOR UPDATE`), reads the balance, rejects if `snack.credits × qty` exceeds it, then inserts with `creditsCharged` stored. Two tabs cannot overdraw.

**Void:** sets `voidedAt` only if the entry is from the current IST month (422 otherwise); the claim is one atomic `updateMany` (live + current month), so voiding an already-voided entry is a no-op that never overwrites the first timestamp.

**Ids:** every `:id` path segment and body `employeeId`/`snackId` must be a positive integer up to 2147483647 (Postgres int4); anything else is a 400 "Invalid id". Record body numbers must be JSON numbers (no strings or booleans).

**Dashboard:** after recording, the selected snack stays selected and only the quantity resets to 1.

**Reports:** `groupBy` in Postgres per employee and per snack. Active employees plus deactivated ones with usage that month are listed.

## 6. Auth
`ADMIN_PASSWORD` and `SESSION_SECRET` from env. Login compares in constant time and sets an HMAC-signed httpOnly cookie (7 days). The `(desk)` layout is a server component that redirects to `/login` without a valid session; every non-public API route is wrapped in `route()` which returns 401.

## 7. Errors
Services throw `HttpError(status, message)`. `route()` maps `HttpError`, zod errors (400) and unique violations (409) to `{ message }`; anything else is a logged 500. The UI shows the message in a toast.

## 8. Testing and verification
Automated tests are paused per CLAUDE.md. Each task ends with `pnpm type-check`, `pnpm lint` and the manual checks listed in PLAN.md (including a parallel-submit overdraw check and a 375px mobile check).

## 9. Decisions and limits
- IST month boundaries use a fixed +05:30 offset (India has no DST).
- Search is a case-insensitive `contains` on name and code, with paging. Fine for ~2,000 rows; add a trigram index if it grows.
- CSV parsing is a plain comma split (no quoted fields); a header row, BOM and CRLF are tolerated; the import is capped at 1 MB and 5,000 rows and upserts in chunks of 500.
- Single admin means no user table.
