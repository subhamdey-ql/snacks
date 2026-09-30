# Snacks Credit Tracker

A small web app for the office snacks uncle: search an employee, record the snacks they take, and see their remaining monthly credits. Credits reset every calendar month (IST), with no rollover. Everyone logs in with their email and a one-time code: the uncle (admin) runs the counter and sets each day's menu, and employees see today's menu and their own wallet. Built with Next.js, Prisma and Postgres. See [PRD.md](PRD.md) and [DESIGN.md](DESIGN.md).

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Signs the session cookie and keys the login-code hash: `openssl rand -hex 32` |
| `RESEND_API_KEY` | Resend API key used to email login codes. Empty in development: the code is printed in the server console |
| `EMAIL_FROM` | Sender, on a domain verified in Resend, e.g. `QL Snacks <snacks@yourdomain.com>` |

Put them in `.env` for local work.

## Local setup

```bash
docker run --name snacks-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=snacks -p 5432:5432 -d postgres:16
# .env: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/snacks"
pnpm install          # also runs prisma generate
pnpm prisma migrate dev
pnpm dev              # http://localhost:3010
```

Checks: `pnpm type-check`, `pnpm lint`, `pnpm build`.

## First run

There is no seed data. Log in, then:

0. **Make the first admin** (see "Admins" below), then log in with that email.
1. **Snacks**: add each snack with its credit cost.
2. **Settings**: set the monthly credits for WFO and Hybrid (months before this show 0).
3. **Employees**: import a CSV with lines `code,name,WFO|HYBRID,email` (a header line is fine; the email is required and is the person's login; max 1 MB / 5,000 rows; no quoted fields), or add people one by one. Re-importing the same codes is safe: it updates names, types and emails and keeps history.
4. **Menu**: each morning open "Menu" and tick what is available today (or "Same as yesterday").

Then use the dashboard to record snacks. Employees log in with their email and see the menu and their wallet.

### Admins

Everyone created in the app or by CSV is a normal user. An admin is an employee whose `role` is `ADMIN`; this is set directly in the database, never in the app. Add the uncle as an employee (with his email), then run once:

```sql
UPDATE "Employee" SET role = 'ADMIN' WHERE email = 'uncle@yourcompany.com';
```

The app will not deactivate an admin, and without at least one admin row nobody can reach the admin side.

### Demo data (optional)

`pnpm seed` adds ~40 fictional employees (codes `DEMO-001`…, emails `demo001@example.test`…, which cannot receive mail), 16 snacks and ~3 months of realistic entries. It never overwrites allowances you have set, and it skips if demo data is already there. `pnpm seed:reset` removes only the demo employees, their entries and the demo snacks nothing else uses; allowances and any real data are left alone. `pnpm seed` also creates two login accounts (an admin `admin@example.test` and an employee `user@example.test`; override with `SEED_ADMIN_EMAIL` / `SEED_USER_EMAIL`), gives any employee without an email a placeholder one, sets today's menu if it is empty, and adds a few entries for the employee login. Those steps are additive and safe to re-run, and `seed:reset` leaves the two login accounts alone. `example.test` addresses cannot receive mail, so with no `RESEND_API_KEY` the login screen shows the code above the code input (and it is also printed in the `pnpm dev` terminal as `[dev] login code for …`). This development mode switches itself off as soon as `RESEND_API_KEY` is set or the app runs in production. Both commands use whatever `DATABASE_URL` points at.

## Deploy (Vercel + Neon or Supabase)

1. Create a Postgres database on Neon (or Supabase) and copy its connection string.
2. Push the repo and import it into Vercel.
3. Use the DIRECT (non-pooled) connection string for `DATABASE_URL` (Neon: the host without `-pooler`; Supabase: the direct connection or the session-mode pooler, not the transaction pooler on port 6543). `prisma migrate deploy` and the interactive transactions (`FOR UPDATE`) need a real session; `?pgbouncer=true` is not enough for interactive transactions. Set `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY` and `EMAIL_FROM` in Vercel. In Resend, verify the sending domain (a few DNS records) first, or codes will not be delivered.
4. Set the Vercel build command to `prisma migrate deploy && next build`. The `postinstall` script runs `prisma generate` on install.
5. Before the first login, run the admin statement from "Admins" against the database.
6. After the first deploy, follow the First run steps above.

## Backups

Turn on automated backups (and point-in-time recovery if offered) in the database provider's dashboard. All data lives in Postgres; nothing is stored on the app host.
