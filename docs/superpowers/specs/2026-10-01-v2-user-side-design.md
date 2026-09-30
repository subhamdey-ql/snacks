# V2: User side, email + OTP login, daily menu

Status: draft for review. Builds on [PRD.md](../../../PRD.md) and [DESIGN.md](../../../DESIGN.md). Follows [CLAUDE.md](../../../CLAUDE.md). Not committed.

## 1. Goal

Today only the snacks uncle uses the app (one shared admin password). V2 adds an employee-facing side:

- Employees log in with **their email** and see **what snacks are available today** and **their own wallet** (credits left this month and their entries).
- The uncle sets the **daily menu**.
- **Everyone, admin included, logs in with email + a 6-digit OTP**. There is no stored password anywhere.

Success: an employee opens the app on their phone, enters their email, types the code from the email, and within a few seconds sees today's menu and their balance. The uncle's counter flow keeps working exactly as today.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Structure | One Next.js app, two areas: admin at `/` (unchanged), user at `/me`. One login screen. Session carries a role. |
| Login | Email + 6-digit OTP for both roles. Replaces `ADMIN_PASSWORD`. |
| Who may log in | Admin: email listed in `ADMIN_EMAILS`. User: email matches an **active** employee. Nobody else. |
| Email sender | Resend. |
| Menu | The uncle sets today's menu each day. Users see it. |
| User screens | Today's menu with credit costs; wallet (balance + this month's entries). No past-months view, no self-ordering. |

### Assumptions (change if wrong)

1. **The menu is informational, not a gate.** The uncle can still record any active snack even if today's menu is not set, so the counter is never blocked.
2. **No password fallback for admin.** If Resend is down nobody can log in until it recovers.
3. Admins are not employees by default; an email in `ADMIN_EMAILS` always becomes an `ADMIN` session, even if the same email is also on an employee.
4. User sessions last 7 days, like the current admin session.

## 3. Data model (additive migration; no existing rows change)

```
Employee    + email String? @unique        stored lowercase, trimmed
OtpCode     id, email, codeHash, expiresAt, attempts Int @default(0), usedAt?, createdAt
            idx (email, createdAt)
DailyMenu   date (IST day, stored as that day's start in UTC), snackId
            PK (date, snackId)             idx (date)
RateLimit   key PK, windowStart, count     (already created; see section 7)
```

- `OtpCode.codeHash` = HMAC-SHA256 (key `SESSION_SECRET`) over `email + ":" + code`. The plain code exists only in the email.
- `DailyMenu` holds only **today's** rows that matter; older days stay as history (never pruned; nothing in this app deletes data).
- Enum `Role { ADMIN, USER }` goes in `src/types/enums.ts` (CLAUDE.md: no raw string literals for fixed sets).

## 4. Login flow

```
/login (email) --POST /api/auth/otp/request--> always 200 { ok: true }
   if email is admin or active employee: create OtpCode, email the code (Resend)
/login (code)  --POST /api/auth/otp/verify-->  200 { role } + session cookie
```

**Request** (`{ email }`, zod: valid email, max 254, lowercased):
- Responds identically whether or not the email is registered, so the screen cannot be used to discover who has an account. Copy: "If that email is registered, we sent a code."
- Only sends when allowed (admin or active employee) and the send limits (section 7) pass. A Resend failure is logged and the response is still the generic 200.
- Creating a new code marks older unused codes for that email as used (one live code at a time).

**Verify** (`{ email, code }`, code is exactly 6 digits):
- Takes the newest unused, unexpired `OtpCode` for the email. Increments `attempts` atomically; at 5 wrong attempts the code is burned.
- Compares hashes in constant time; on success marks `usedAt`, resolves the role (admin list first, then active employee), starts the session.
- Any failure returns the same 401 "Invalid or expired code".
- Code: 6 random digits from `crypto.randomInt`, valid 10 minutes, single use.

**Session:** httpOnly, `SameSite=Lax`, `Secure` in production, path `/`, 7 days, HMAC-signed. Payload: role, subject (`admin:<email>` or employee id) and expiry. User routes additionally re-check in the DB that the employee is still active, so deactivating someone takes effect immediately. Logout stays `POST /api/auth/logout`.

**Dev without Resend:** when `RESEND_API_KEY` is unset and `NODE_ENV !== "production"`, the code is printed to the server console instead of emailed. In production a missing key fails startup of the request path with a clear error.

## 5. API

Existing admin routes keep their paths and behaviour; they simply require `Role.ADMIN` (the default). The password login route is removed.

| Method and path | Role | Purpose |
|---|---|---|
| `POST /api/auth/otp/request` | public | Send a code (generic response) |
| `POST /api/auth/otp/verify` | public | Check the code, start the session |
| `POST /api/auth/logout` | any | End the session |
| `GET /api/menu` | ADMIN | Today's menu: `{ date, snackIds }` |
| `PUT /api/menu` | ADMIN | Replace today's menu with `{ snackIds: number[] }` (active snacks only, max 100) |
| `POST /api/menu/copy-yesterday` | ADMIN | Fill today's menu from yesterday's (422 if yesterday had none) |
| `GET /api/me/menu` | USER | Today's menu: `{ date, items: [{ snackId, name, credits, affordable }], remaining }` |
| `GET /api/me/wallet` | USER | `{ employee: { code, name, type }, month, allowance, used, remaining, resetsOn, entries[] }` |
| `POST /api/employees`, `PATCH /api/employees/:id`, `POST /api/employees/import` | ADMIN | Accept optional `email` (CSV gets an optional 4th column) |

- `/api/me/*` take the employee **only from the session**, never from the URL or body, so one employee cannot read another's data (no IDOR).
- `/api/me/wallet` reuses the existing month/balance service (`getBalance`, the month-entries query behind `GET /api/employees/:id/month`); no new balance logic.
- `route()` gains a `role` option (default `ADMIN`); a session with the wrong role gets 403.
- Duplicate email on create/edit/import returns 409 "That email is already used"; bad email format is a 400 with the line number in CSV imports.

## 6. Frontend

Follows the existing module pattern (`modules/<feature>/{components,templates,hooks,types,utils}`, thin pages, `useXxxAPI` factories plus orchestrating hooks, no cross-module imports).

- **`modules/auth`**: the login template becomes a two-step form (email, then code) with a resend button (60 s cooldown shown), using the existing form kit. After login the server redirects by role: `ADMIN` to `/`, `USER` to `/me`.
- **`modules/menu` (admin)**: new page `/menu` "Today's menu": all active snacks as toggle rows (`SnackTile`, name, credits), a Save button, and a "Same as yesterday" button. Added to the admin nav (sidebar and bottom bar).
- **`modules/employees`**: email field in the add/edit dialog, an email column in the table (hidden on phones), CSV help text updated.
- **`modules/me` (user)**:
  - `/me` **Today**: date, the user's remaining credits as a small summary, and today's menu as cards (`SnackTile`, name, credit cost, "Not enough credits" muted state when unaffordable). Empty state: "The menu isn't set yet today."
  - `/me/wallet` **Wallet**: credit meter (existing component), allowance, used, reset date, and this month's entries with voided ones marked.
  - A `(me)` route group with its own layout: `requireRole(USER)`, mobile-first header and a 2-tab bottom bar (Today, Wallet), desktop sidebar reusing `AppSidebar` with a different nav list. Same theme menu and food backdrop.
- `(desk)` layout requires `ADMIN`; a signed-in user landing there is redirected to `/me`, and an admin landing on `/me` to `/`.

## 7. Security and rate limiting

This work finishes the paused security pass, because OTP endpoints are public and send email.

- **Rate limits** (Postgres `RateLimit` table, atomic upsert; works on Vercel):
  - OTP request: 1 per 60 s and 5 per hour **per email**; 10 per hour **per IP**.
  - OTP verify: 5 wrong attempts per code, plus 20 attempts per 15 minutes **per IP**.
  - Authenticated API: 120 requests/min per IP; writes 60/min; CSV import 10 per 10 min.
  - 429 responses carry `Retry-After`. Client IP is taken from `x-real-ip` / first `x-forwarded-for` (correct on Vercel).
- **Already written, to be finished and verified:** same-origin check on state-changing requests, 100 KB JSON cap (413), `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` on all API responses, in `src/server/http.ts`.
- **Also added:** `email` (max 254) and search `q` (max 100) bounds in the schemas; page number upper bound.
- **Enumeration and timing:** generic OTP responses; same 401 text for every verify failure.
- **Email content:** short text + simple HTML, code only, no links, says it expires in 10 minutes and to ignore it if not requested.
- **Out of scope for now:** CSP and page security headers (you chose to skip them), CAPTCHA.

## 8. Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `SESSION_SECRET` | unchanged (`SESSION_SECRET` also keys the OTP hash) |
| `ADMIN_EMAILS` | comma-separated admin emails |
| `RESEND_API_KEY`, `EMAIL_FROM` | sending (e.g. `QL Snacks <snacks@quantumleap.co.in>`) |
| `ADMIN_PASSWORD` | **removed** |

Email sending uses Resend's HTTPS API through `fetch` (no new dependency). **You must verify the sending domain in Resend** (DNS records) before production use.

## 9. Migration and rollout

1. Prisma migration adds `Employee.email`, `OtpCode`, `DailyMenu` (RateLimit is already in a migration). Additive only; run `prisma migrate deploy` on Docker first, on Neon via the normal deploy step. No data is deleted or reset anywhere.
2. Set `ADMIN_EMAILS`, `RESEND_API_KEY`, `EMAIL_FROM` in Vercel **before** deploying, because the password login is removed in the same release.
3. Admin adds employee emails (edit dialog or re-import the CSV with the 4th column; re-importing is safe because imports upsert by code).

## 10. Verification (tests are paused per CLAUDE.md)

Every task ends with `pnpm type-check`, `pnpm lint` and browser checks against a dev server:

- Login for admin and user, wrong code, expired code, 6th attempt, resend cooldown, unknown email (identical response), deactivated employee.
- Role isolation: user session gets 403 on an admin API and is redirected away from `/`; admin is redirected away from `/me`; `/api/me/*` ignores any id a client sends.
- Menu set, same-as-yesterday, user sees it, unaffordable state, empty state.
- Wallet numbers equal the admin dashboard's for the same employee.
- Rate limits return 429 with `Retry-After`.
- 375 px and 1280 px, all three palettes, light and dark.

## 11. Docs to update with the build

`PRD.md` (new scope, users, out-of-scope list), `DESIGN.md` (auth, data model, API table, UI), `README.md` (env vars, first-run steps, Resend domain), `.env.example`.

## 12. Risks

- **Email delivery is now the front door.** Domain not verified, spam folder or a Resend outage blocks logins. Mitigation: generic but visible "didn't get it? resend" UI, and keep the sender domain verified.
- **Admin lockout** if `ADMIN_EMAILS` is wrong or the admin mailbox is unreachable; recovery is changing the env var and redeploying.
- **OTP brute force** is bounded by 5 attempts per code, per-IP limits and 10-minute expiry (1 in a million per guess, at most 5 guesses per code).
