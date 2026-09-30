# Snacks Credit Tracker

A small web app for the office snacks uncle: search an employee, record the snacks they take, and see their remaining monthly credits. Credits reset every calendar month (IST), with no rollover. Single admin login. Built with Next.js, Prisma and Postgres. See [PRD.md](PRD.md) and [DESIGN.md](DESIGN.md).

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ADMIN_PASSWORD` | The admin login password (use a long one in production) |
| `SESSION_SECRET` | Signs the session cookie: `openssl rand -hex 32` |

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

1. **Snacks**: add each snack with its credit cost.
2. **Settings**: set the monthly credits for WFO and Hybrid (months before this show 0).
3. **Employees**: import a CSV with lines `code,name,WFO|HYBRID` (a header line is fine; max 1 MB / 5,000 rows; no quoted fields), or add people one by one.

Then use the dashboard to record snacks.

### Demo data (optional)

`pnpm seed` adds ~40 fictional employees (codes `DEMO-001`…), 16 snacks and ~3 months of realistic entries. It never overwrites allowances you have set, and it skips if demo data is already there. `pnpm seed:reset` removes only the demo employees, their entries and the demo snacks nothing else uses; allowances and any real data are left alone. Both use whatever `DATABASE_URL` points at.

## Deploy (Vercel + Neon or Supabase)

1. Create a Postgres database on Neon (or Supabase) and copy its connection string.
2. Push the repo and import it into Vercel.
3. Use the DIRECT (non-pooled) connection string for `DATABASE_URL` (Neon: the host without `-pooler`; Supabase: the direct connection or the session-mode pooler, not the transaction pooler on port 6543). `prisma migrate deploy` and the interactive transactions (`FOR UPDATE`) need a real session; `?pgbouncer=true` is not enough for interactive transactions. Set `DATABASE_URL`, `ADMIN_PASSWORD` and `SESSION_SECRET` in Vercel.
4. Set the Vercel build command to `prisma migrate deploy && next build`. The `postinstall` script runs `prisma generate` on install.
5. After the first deploy, follow the First run steps above.

## Backups

Turn on automated backups (and point-in-time recovery if offered) in the database provider's dashboard. All data lives in Postgres; nothing is stored on the app host.
