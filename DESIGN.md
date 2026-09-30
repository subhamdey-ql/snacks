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
Employee    id, code UNIQUE, name, type (HYBRID|WFO), active,
            email UNIQUE? (required by the app), role (USER|ADMIN)   idx (active, name)
Snack       id, name UNIQUE, credits, active                     idx (active, name)
Allowance   id, type, credits, effectiveFrom                     UNIQUE (type, effectiveFrom)
Consumption id, employeeId, snackId, qty, creditsCharged,
            createdAt, voidedAt?                                 idx (employeeId, voidedAt, createdAt), (createdAt, voidedAt), (employeeId, createdAt)
```
`OtpCode` holds one-time login codes (keyed hash, 10-minute expiry, 5 attempts, single use). `DailyMenu` (IST day, snack) is what the uncle marked available that day. `RateLimit` exists in the database from an earlier migration but nothing uses it yet. `email` is nullable in the database only so employees created before V2 survive; the app requires it, and such rows show "Email missing" and cannot log in.

`Allowance` is append-only. Saving inserts or replaces the row effective from the current month's IST start. A month's allowance is the latest row on or before the month start (0 if none, so months before the first setting show 0), so past months are never rewritten.

## 3. Balance logic
- `monthRange(date)` gives the IST calendar month `[start, end)`.
- `remaining = allowance(type, month) − SUM(creditsCharged)` over non-voided entries in the month. The sum is computed in Postgres.
- Expiry falls out of this: a new month is a new range and starts at the full allowance. No cron job.

## 4. API
| Method and path | Purpose |
|---|---|
| `POST /api/auth/otp/request` | Emails a 6-digit code if the address is an active employee; always answers `{ ok: true }` (no account discovery). Re-sends are limited per address (60 s apart, 5 per hour) |
| `POST /api/auth/otp/verify` | `{ email, code }` -> session cookie and `{ role }`; every failure is the same 401 |
| `POST /api/auth/logout` | Ends the session (public route) |
| `GET/PUT /api/menu`, `POST /api/menu/copy-yesterday` | Admin: today's menu (`{ date, snackIds }`); PUT replaces it; copy fills it from yesterday |
| `GET /api/me/menu`, `GET /api/me/wallet` | Employee only: today's menu with `affordable` flags, and the employee's own month (balance, entries, reset date). The employee always comes from the session, never from the request |
| `GET /api/employees?q&page&limit&active` | Paginated search: `{ data, pagination:{total,page,limit,totalPages} }`, limit clamped 1..100 |
| `POST /api/employees`, `PATCH /api/employees/:id` | Create or upsert by normalized code; edit; activate or deactivate |
| `POST /api/employees/import` | CSV `code,name,WFO\|HYBRID,email` (email required); imports good rows (an imported row re-activates an inactive employee, like `POST /api/employees`), reports bad lines |
| `GET /api/employees/:id/month` | Employee, this month's balance and entries |
| `GET/POST /api/snacks`, `PATCH /api/snacks/:id` | Snack catalog (`GET ?includeInactive=true` lists all; qty per entry is 1..20) (POST on an existing name re-activates and re-prices) |
| `GET /api/dashboard/summary` | Home tiles: `{ todayEntries, monthCredits, monthEmployees }` (non-voided entries, IST day/month, aggregated in Postgres) |
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


## 5a. UI (visual design)
- **Look:** "fresh & friendly" with a warm food palette: cream page background, white cards, espresso-brown text. Colour by job: chilli-tomato `--gos-primary` (buttons, active nav, focus), mango `--gos-yellow` (logo, prices, snack tiles), herb green (success, healthy balance), amber `--gos-orange` (warnings, low), berry `--gos-red` (errors, critical), blueberry `--gos-blue` (info tints only). Every colour is a `--gos-*` token in `globals.css` with light and warm-espresso dark values; components never hardcode hex. Inter is the only font. Dark mode uses `next-themes` (class strategy, system default, no flash).
- **Brand:** the product is shown as "QL Snacks", "Credit Tracker", "Powered by QL" (constants in `src/lib/brand.ts`, used by the logo, the login panel and the browser tab title). The logo (`BrandMark` / `LogoGlyph`) is a bitten cookie with a small credit coin on the palette's banner gradient, so it follows the chosen theme.
- **Food touches:** `SnackTile` picks a line icon and tint from a snack's name (`src/lib/snack-kind.ts`: tea/coffee, chips/popcorn, pizza, sandwich, fruit, ice cream, drinks, sweets, bakery, else cookie). `FoodPattern` draws faint food outlines behind the dashboard hero and the Login banner. Empty states and copy are playful ("Hungry? Find your colleague", "Nothing munched this month yet").
- **User-selectable themes:** the palette menu (palette icon in the sidebar footer / phone top bar) lets each user choose a colour theme (**Food** default, **Blue** = the original brand blue, **Plain** = neutral white/grey with a graphite accent) and an appearance (Light / Dark / Auto). Every palette has a light and a dark version and keeps the heading banners and food stickers. The palette is stored in that browser's `localStorage` (`snacks-palette`) and applied to `<html data-palette=...>` by a tiny inline script in `<head>` before first paint (no flash); `usePalette` reads/writes it; light/dark stays with `next-themes`. Palettes are plain token overrides in `globals.css` (`html[data-palette="blue"]`, `html.dark[data-palette="blue"]`, ...), so components never know which palette is active.
- **Same colours on every page:** one palette everywhere (no per-page colour themes). Behind all pages sits `FoodBackdrop`: faint food "stickers" (cookie, pizza, coffee, popcorn, ice cream, ...) in the food palette, fixed to the viewport and sent behind all content, so they only show in the gaps around cards.
- **Full width:** the desk content area has no max width; it fills everything right of the sidebar (and the whole screen on phones), with side padding only.
- **Two sides:** the admin desk and the employee area share one `AppShell`; the nav list depends on the side (`NAV_BY_AREA`). Admin nav: Home, Menu, Employees, Snacks, Reports, Settings. Employee nav: Today (menu with credit costs, "Not enough credits" on unaffordable items) and Wallet (credit meter, this month's entries, reset date).
- **Shell:** from `md` (768px) a fixed left sidebar (brand mark, icon nav, theme toggle, Log out); below `md` a sticky top bar plus a bottom tab bar (Home, Employees, Snacks, Reports, Settings) that respects the safe areas. Login is a gradient brand panel with a centred card.
- **Dashboard:** search hero, summary tiles, then for a selected employee an initials avatar, a circular credit meter (green above 50% left, amber 20-50%, red below 20%; `src/lib/credit-level.ts`), the record form with a cost preview, and this month's entries as a timeline with Undo.
- **Shared components** (`src/components/common/`): `CommonButton`, `CommonTable` (with `stackOnMobile`: rows become stacked cards with a full-width action row below a 36rem container), `DataEmptyHandler` + `EmptyState`, `PageHeader`, `StatusBadge` (BadgeTone), `InlineNotice`, `UserAvatar`, `StatCard`, `IdentityCell`, `RowActionButton`, `FormDialogHeader`, `TableSkeleton`, `Pagination`, `ScrollableList`, `CreditMeter`, `CreditsPill`, `ThemeMenu`, and the shell pieces (`AppShell`, `AppSidebar`, `MobileHeader`, `MobileBottomNav`, `BrandMark`). Closed sets of values are enums in `src/types/enums.ts` (`Role`, `NavArea`, `HttpMethod`, `FetchSite`, ...), never raw string literals.
- **shadcn first:** every primitive is shadcn/ui (Button, Card, Badge, Dialog, Input, Select, Label, Alert, Avatar, Empty, Pagination, Table, Checkbox, Progress, Skeleton); the common components above are thin wrappers that only add the app's look via classes (e.g. `SelectField` = shadcn `Select`, `InlineNotice` = `Alert`, `UserAvatar` = `Avatar`, `EmptyState` = `Empty`, `StatCard` = `Card`). A few opt-in props were added to `ui/select.tsx` (custom trigger icon, no scroll arrows, no check mark) so the original look is kept. Toasts stay `react-hot-toast`; the credit meter (SVG ring), bottom tab bar and sidebar are custom.
- **Mobile rules:** phone layout is the base; tap targets are at least 40px (44px for table/card actions and dialog buttons); inputs are 16px; long names wrap (`[overflow-wrap:anywhere]`); the page never scrolls sideways. Motion is limited to short transitions and is off under `prefers-reduced-motion`.

## 6. Auth
Everyone logs in with email + a one-time code (Resend sends it; with no `RESEND_API_KEY` outside production, "development mode", nothing is emailed: the code is printed to the server console AND returned to the login screen, which shows it above the code input. `isDevEmailMode()` turns this off whenever a key is set or `NODE_ENV` is production). The login page is one screen with two steps. A correct code sets an HMAC-signed httpOnly cookie (7 days) carrying the employee id and role. Every request re-reads the employee (active + `role`) so deactivating someone or changing their role in the database applies at once. Roles: `ADMIN` gets the desk (`/`, `(desk)` layout) and the `/api/*` admin routes; `USER` gets `/me` (`(me)` layout) and `/api/me/*`. A wrong-side page visit redirects to the right home; a wrong-role API call is 403; no session is 401. `route()` enforces this (ADMIN by default, `{ role: Role.USER }` for employee routes) and also rejects cross-site state-changing requests, caps JSON bodies at 100 KB, and marks API responses `no-store`. `publicRoute()` is for login/logout only. Admins are made by editing `Employee.role` in the database (never via the UI or a CSV); the app refuses to deactivate an admin.

Not done yet: request rate limiting (per-IP limits on the login endpoints and the API). The per-address resend limits above are the only throttle so far.

## 7. Errors
Services throw `HttpError(status, message)`. `route()` maps `HttpError`, zod errors (400) and unique violations (409) to `{ message }`; anything else is a logged 500. The UI shows the message in a toast.

## 8. Testing and verification
Automated tests are paused per CLAUDE.md. Each task ends with `pnpm type-check`, `pnpm lint` and the manual checks listed in PLAN.md (including a parallel-submit overdraw check and a 375px mobile check).

## 9. Decisions and limits
- IST month boundaries use a fixed +05:30 offset (India has no DST).
- Search is a case-insensitive `contains` on name and code, with paging. Fine for ~2,000 rows; add a trigram index if it grows.
- CSV parsing is a plain comma split (no quoted fields); a header row, BOM and CRLF are tolerated; the import is capped at 1 MB and 5,000 rows and upserts in chunks of 500.
- Single admin means no user table.
