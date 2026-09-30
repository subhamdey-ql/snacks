# Snacks Credit Tracker: PRD

## 1. Problem
The snacks uncle records what each employee takes in a spreadsheet. It is slow to search, error-prone, and gets harder to maintain as data grows. There is no automatic balance, no monthly expiry, and no easy reporting.

## 2. Goal
A simple web app where the uncle looks up an employee, records the snacks they take, and instantly sees their remaining monthly credits. Credits reset every month.

**Success criteria**
- Recording a snack takes under 10 seconds (search, pick snack, confirm).
- Balances are always correct, with no manual math and no manual expiry.
- The uncle stops using the spreadsheet.

## 3. Users
- **Snacks uncle** (admin): runs the counter, records snacks, sets the daily menu.
- **Employees** (users): log in with their email to see today's menu and their own wallet. They cannot record or undo anything.

## 4. Scope (v1)

### 4.1 Employees
- Fields: employee code (unique), name, type (`HYBRID` or `WFO`), email (required, unique; the login), active flag.
- Add, edit and deactivate an employee.
- Bulk import from CSV (`code,name,type,email`). New people are always regular users. Rows with a duplicate code are updated (and an inactive employee is re-activated), and invalid rows are reported without stopping the import. A header line is skipped; the file is capped at 1 MB and 5,000 rows.

### 4.2 Snacks
- Fields: name, credit cost, active flag.
- The uncle adds, edits and deactivates snacks in the app. There is no pre-loaded list: all data lives in the database.
- Changing a snack's cost only affects future entries.

### 4.3 Monthly allowance
- Credits per month are set per employee type (Hybrid, WFO) in a Settings screen. The values are configurable, with no hardcoding.
- Month = calendar month in IST (1st 00:00 to last day 23:59).
- Unused credits expire at month end. There is no rollover.
- A change to an allowance applies from the current month onward. Past months keep the allowance they had.

### 4.4 Recording consumption (core flow)
1. Uncle searches by name or code (type-ahead).
2. The employee's card shows type, credits remaining this month, and this month's entries.
3. Uncle picks a snack and quantity (default 1, max 20). After saving, the snack stays selected and quantity resets to 1.
4. The app shows the credits to be charged (`snack cost × quantity`) and the balance after.
5. Confirm to save.

**Rules**
- **Block on insufficient balance**: the entry cannot be saved if the cost exceeds the remaining credits.
- The charged credits are stored on the entry, so later price changes never alter history.
- Entries are always stamped with the current time (no backdating in v1).

### 4.4a Home dashboard
- Search hero plus three summary tiles: snacks recorded today, credits used this month, employees served this month (voided entries excluded; IST day and month).
- A selected employee shows a credit meter (green above 50% left, amber 20-50%, red below 20%), the record form and this month's entries with Undo.
- Each user can pick a colour theme (Food, Blue or Plain) and light/dark/auto from a menu; the choice is remembered in their browser. The app has a sidebar on desktop and a bottom tab bar on phones.

### 4.5 Undo
- Uncle can void a wrong entry (current month only). The credits are restored to that month's balance.
- Voided entries stay visible, marked as voided, and are never deleted (audit trail).

### 4.6 Reports
- Pick a month. See per-employee credits used and remaining, and per-snack quantity and credits.
- Export as CSV (text cells starting with `=`, `+`, `-` or `@` are prefixed with a quote so spreadsheets do not run them as formulas).

### 4.7 Auth
- Everyone (admin and employees) logs in with their email and a 6-digit one-time code sent by email (valid 10 minutes, single use, 5 attempts). No passwords are stored.
- Only an active employee with an email on file can log in. Their `role` (USER by default, ADMIN) decides the side they see. Admins are set in the database only.

### 4.8 Daily menu
- The uncle ticks which snacks are available today (or copies yesterday's menu). Employees see exactly that list with credit costs. The menu is informational: the uncle can still record any active snack.

### 4.9 Employee view
- Today: the menu and "you have N credits left".
- Wallet: credit meter, this month's entries (undone ones marked), and the date credits reset.

## 5. Balance logic
`remaining(employee, month) = allowance(type, month) − sum(non-voided entries in month)`

Expiry needs no scheduled job: each month is calculated independently. The allowance for a month is the latest setting effective on or before that month's start (settings are append-only history), so later changes do not rewrite past months. Months before the first setting was saved show an allowance of 0.

## 6. Out of scope (v1)
Employees recording or ordering snacks themselves, past-months history for employees, passwords,  payments or cash for over-limit snacks, credit rollover, per-employee custom allowance, stock or inventory tracking, notifications, backdated entries, mobile app.

## 7. Non-functional
- Runs as a hosted web app, usable on desktop and phone browsers.
- Data lives in Postgres with the host's automated backups.
- Search results appear in under 300 ms for up to ~2,000 employees.
- Balance and month-boundary logic is verified manually for now (automated tests are paused).

## 8. Tech
Next.js (App Router, TypeScript) with API route handlers, Postgres with Prisma, Tailwind and shadcn/ui, deployed on Vercel with Neon or Supabase. See DESIGN.md.

## 9. Data model
- `employee(id, code UNIQUE, name, type, email UNIQUE, role, active)`
- `snack(id, name UNIQUE, credits, active)`
- `allowance(id, type, credits, effective_from)`, unique per (type, effective_from)
- `consumption(id, employee_id, snack_id, qty, credits_charged, created_at, voided_at)`
- `otp_code(id, email, code_hash, expires_at, attempts, used_at, created_at)`
- `daily_menu(date, snack_id)`

## 10. Open questions
- Should employees be searchable by partial code or name only? (Assumed: both, partial match.)
- Can the uncle void an entry from a past month, or only the current month? (Decided: current month only.)
