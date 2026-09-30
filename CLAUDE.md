# CLAUDE.md — gos-backend

This repo is the **backend service** of the gos-app microservice split. It is a fully independent git repo (NOT part of a monorepo) — a plain, single NestJS project (no `apps/`/`packages/` workspace wrapper).

Sibling repos (separate git repos, never imported at build time):

- `../frontend` — gos-frontend (Next.js)
- `../ai-backend` — gos-ai-backend (Python/FastAPI, internal-only)
- `../gos-notification` — scheduled-job worker + notification delivery (BullMQ, WebSocket gateway).
  This repo is its **control plane**: it manages job definitions, gos-notification executes them.
- `../` (gos-app root) — gos-infra umbrella repo (terraform/ + planning/)

---

## Commands

```bash
# Infrastructure (must be running before the app)
docker compose up -d          # MongoDB :27017, Redis :6379, MeiliSearch :7700, ai-backend :8000

# Dev
pnpm dev                      # NestJS on :3001

# Build
pnpm build

# Type check (run after every change — CI gate)
pnpm run type-check

# Test (see the Testing section below — mock data is schema-generated, never hand-written)
pnpm test                     # run all, print the module-wise pass/fail table
pnpm test:cov                 # + coverage; writes ../docs/testing/reports/backend-latest.md
pnpm test:watch
pnpm test -- src/modules/hr   # one module

# Docker image
docker build -t gos-backend .

# Seed the platform — DESTRUCTIVE clean bootstrap (runs seed/v3/reset.js): wipes every
# collection except feature_catalog, then re-asserts the finalized RBAC catalog, super admin,
# platform role, role templates, config & plans. LOCAL only. Non-destructive baseline: pnpm seed:init.
pnpm seed
```

---

## Repository layout

```
src/               NestJS backend source (port 3001)
test/              Unit + e2e test config
seed/              Local demo-data seed scripts
proj-doc-v2/       Canonical platform documentation (see Documentation section)
docker-compose.yml Local infra: mongo, redis, meilisearch, ai-backend
pnpm-workspace.yaml  Settings-only (allowBuilds for native modules like bcrypt) — no `packages:` glob; this is not a monorepo
```

Plain, single NestJS project — `package.json`/`src/`/`tsconfig.json` at the repo root, matching a fresh `nest new` layout. There is no `apps/*`/`packages/*` workspace wrapper (this repo used to carry one, inherited from GrowthOS's original unified monorepo history — it was collapsed since only one app ever lived here).

### Shared types

There is no shared-types package in this repo. Types are co-located with the feature module that owns them (e.g. `src/team/team-invite.types.ts`, `src/modules/bms/bms-intake.types.ts`) — same convention as everything else under `src/modules/<feature>/`. `gos-frontend` keeps its own independent copies of any equivalent types it needs; there is no automatic sync between the two repos.

---

## Backend (NestJS)

**Single MongoDB database** — one shared database (`gosapp_master` — NOTE: the new gos-app database name; the old monorepo used `gosplatform_master`) for all tenants. Multi-tenancy is enforced at the application layer: every Mongoose document has a `company_id` field, and every service method filters by it.

**Auth pattern** — JWT stored in `gos_access_token` httpOnly cookie. Two guards:

- `AdminGuard` — used on all product module routes; extracts `company_id` from `jwtPayload`
- `PermissionGuard` + `@RequirePermission('module')` — permission-scoped routes

Extract `company_id` inside controllers like this:

```ts
private ctx(req: Request) {
  const { company_id, sub } = (req as any).jwtPayload ?? {};
  if (!company_id) throw new ForbiddenException('No company in token');
  return { companyId: company_id as string, userId: sub as string };
}
```

**Module pattern** — every product feature lives in `src/modules/<feature>/`. It has a schema, service, controller, and module file. The module must be imported in `app.module.ts`.

**Mongoose conventions:**

- Service method return types should be `Promise<any>` — Mongoose `.lean()` return types are too complex for TypeScript inference
- Cast `.lean()` results with `as any[]` when accessing fields
- Never put `null` in a `@Prop` enum array — use `type: String, default: null` and list only string values in `enum`
- Declare specific routes (e.g. `/employees/expiring-docs`) **before** parameterised routes (`/employees/:id`) in the controller class

**Push filtering/sorting/grouping/joins to MongoDB, not JS — default to the database, fall back to
JS only when the DB can't express it.** Never `Model.find({}).exec()` the whole collection and then
`Array.filter()`/`.sort()`/`.reduce()`/manual-join it in the service — a Mongoose query filter
(`$in`/`$gte`/`$regex`, `.sort()`/`.skip()`/`.limit()`) can always do that instead.

Within "use the database," still pick deliberately between a **plain filtered `.find()`** and a
**full aggregation pipeline** (`$group` for grouping/counts/sums, `$lookup` for joining another
collection, `$project`/computed expressions for derived fields) — reach for the pipeline only when
it's actually the more optimized or simpler shape for that case (grouping, joining, computed fields
that a plain query can't express), not by default just because it's available. If a plain `.find()`
with the right filters gets the same result with less machinery, use that. Reach for plain JS only
when the shape genuinely can't be expressed as a query/pipeline at all (e.g. a call to another
service/HTTP client mid-computation, or business logic that depends on values not in the database).

This is a real optimization, not a guaranteed one — be honest with yourself about which case
you're in: a `$match` on an **indexed** field skips a full scan entirely (a JS `.filter()` after
`.find({})` never can — it always loads and scans every document in Node); an unindexed `$match` or
`$lookup` still scans, just on the Mongo server instead of the app server, so it isn't automatically
faster, though it still avoids serializing/transferring the non-matching documents to Node. On this
app's typical per-tenant collection sizes (`company_id`-scoped, usually dozens–low-thousands of
docs), the gap is often small today — the payoff is mainly headroom as data grows, not a fix for a
measured slowness. Still the right default going forward, just don't claim it's always a dramatic
win.

**Use a secondary index wherever one is possible — on every field a query actually filters, sorts,
or joins on, starting with `company_id`.** `_id` is the only index MongoDB gives you for free;
every other field needs a **secondary index** added deliberately, or a filter/sort on it forces a
scan instead of a direct lookup. `company_id` is the non-negotiable baseline — it's in every single
query per the multi-tenancy rule above, so it must be indexed on every schema with no exceptions,
even schemas with no other index at all: `@Prop({ index: true, ... })` on the field, or a
`Schema.index({ field1: 1, field2: 1 })` call below the class for a **compound** secondary index
when two or more fields are queried together.

**`company_id` alone is not sufficient once a query filters on it plus another field.** This is a
real gap we found, not a hypothetical: `Lead`, `NotificationLog`, and `Employee` all had
`company_id` indexed, but their actual services filter `{company_id, assigned_to}`,
`{company_id, user_id, status}`, `{company_id, is_active, department}` — none of those second
fields had a matching compound index, so every one of those queries used the `company_id` index
only to narrow to the tenant, then fell back to scanning every remaining document by hand for the
rest of the filter. Whenever a service queries on `company_id` **plus** another field together,
add the compound index for that exact pair (or set), not just the single-field one.

**Paginated list response shape** (used by `GET /hr/employees`):

```ts
{ data: T[], pagination: { total, page, limit, totalPages } }
```

Backend: `page = Math.max(1, params.page ?? 1)`, `limit = Math.min(100, Math.max(1, params.limit ?? 10))`.

### Shared schema mirroring rule (`gos-auth`)

> **MANDATORY — no exceptions.**

`../gos-auth` is a separate microservice that owns `register`/`login`/`logout`/`set-password`, but it connects to the **same MongoDB database** (`gosplatform_master`) and keeps its own copies of the `User` (`auth/schemas/user.schema.ts`) and `Employee` (`auth/schemas/employee.schema.ts`, a minimal mirror) schemas, since both services read/write the same `sys_user`/`employees` collections.

**If you add, remove, or change a field on `User` or `Employee` here, you MUST make the equivalent change in `../gos-auth`'s copy in the same work session** — otherwise the two services' Mongoose models silently drift out of sync with the shared collection (stale validation, missing fields on read, or writes from one service that the other can't see). This applies even if `gos-auth`'s copy only needs a subset of fields (e.g. its `Employee` mirror only has `portal_invite_accepted_at`) — check whether the changed field is one gos-auth actually uses before skipping it.

### RBAC invariants (also cross-service)

The app is **role-driven** (see root `../CLAUDE.md` → RBAC model). Same-session obligations when touching RBAC:

- **Mirror the resolver + schemas.** `src/rbac/permission-resolver.ts` and the `User` (`is_owner`, `role_ids`) / `Role` (`is_protected`) schemas have byte-identical copies in `../gos-auth` (JWT is issued there). Change both.
- **Break-glass only.** Full access = `role === SUPER_ADMIN` or `User.is_owner`. Never reintroduce "empty `permissions[]` = full access". `AdminGuard` authorizes via the `settings.organization` feature (or break-glass), not "ADMIN with empty permissions".
- **Owner role is auto-managed.** The `is_protected` Owner role must stay equal to the org entitlement — any code path that changes `enabled_modules`/`enabled_features` must call `RbacRoleService.syncOwnerRole(companyId)` (already wired into `TenantService.updateModules` and `AdminService.updateOrg{Modules,Features}`).
- **JWT payload shape** now includes `is_owner` — a cross-service contract change; keep all **three** JWT builders in sync: gos-auth `auth.service.ts issueToken()`, backend `invite.service.ts buildTokenPayload()`, and backend `auth/auth.service.ts login()` (this last one previously copied `permissions[]` verbatim with no resolver call and no `is_owner`, which locked business owners out with "Admin access required" — it now calls `PermissionResolverService.resolveForUser()` like the other two).

---

<!-- ## Testing

> **MANDATORY — a change is not complete until its test is.**
> Canonical reference: `proj-doc-v2/platform/testing.md`. Running/troubleshooting:
> `../docs/testing/TESTING.md`. Backlog: `../docs/testing/COVERAGE-LEDGER.md`.

> **⏸️ CURRENT POLICY — deferred tests.** Do **NOT** write specs inline with a change right now.
> Instead record each added/changed unit in `../docs/testing/TEST-BACKLOG.md` (file/symbol, what it
> does, cases to cover) for a later dedicated testing pass. This temporarily overrides the
> "same session" rule below. The `PostToolUse` test-guard hook still fires — treat it as a prompt to
> add the backlog row, not to write the spec. Still run `pnpm test` (existing suite) + type-check to
> confirm nothing broke; just don't author the new specs yet.
>
> **⛔ Tests fully paused (current direction): do NOT write, update, or run any specs — and you may
> skip the `TEST-BACKLOG.md` row too.** A single `Tests: paused — not writing tests for now` line in
> the status checklist satisfies the Tests-group requirement below. Still run type-check and, if an
> existing spec breaks from your change, fix that existing spec (maintenance, not new authoring).
> Resume normal spec-writing only when this line is removed.

**(Suspended under the deferred policy above.)** Every function you add or change gets a spec added
or updated in the same session. Specs are colocated: `attendance.service.ts` →
`attendance.service.spec.ts`.

**Mock data comes only from `@test/factories`.** It is generated by walking the real Mongoose
schemas, so there is no second copy of the field list to fall out of date:

```ts
import { buildDoc, buildMany, buildForOtherTenant, buildService, MOCK_COMPANY_ID } from '@test/factories';

const { service, models } = await buildService(AttendanceService, {
  models: { Attendance: { docs: buildMany('Attendance', 2) } },
  providers: [{ provide: AuditService, useValue: { log: jest.fn() } }],
});
```

`buildService` auto-stubs **every** `@InjectModel` dependency from the constructor's injection
metadata — never hand-list `getModelToken` providers again. Adding a model dependency to a service
therefore cannot break unrelated specs (it previously did, twice).

**Schema changes.** Adding a schema file or a `@Prop` needs no test-side action — discovery and the
generator handle it. But **renaming or removing a `@Prop`, or narrowing an `enum`, fails
`test/factories/schema-sync.spec.ts`** until `test/factories/overrides.ts` is updated. Fix the
override; do not weaken the assertion.

**Cross-service mirror is automated.** `test/mirrors/auth-mirror.spec.ts` fails when `User`,
`Role`, or `permission-resolver.ts` drift from `../auth`'s copies — the mandatory rule above is now
enforced by the suite rather than by memory.

**Every service spec includes a tenant-isolation case** — build a fixture with
`buildForOtherTenant(...)` and assert it is never returned.

**No database in unit tests.** The in-memory model double supports real query semantics
(`$in`/`$ne`/`$regex`, chainable `sort`/`lean`, `CastError` on bad ObjectIds, `.save()`).
`aggregate()` is deliberately not emulated — stub it per spec. Note `.lean()` returns a *detached
copy* and a non-lean read returns the *live* document, matching Mongoose.

**Coverage thresholds only ratchet up.** After landing tests, raise the global floor in
`jest.config.js` to the new measured baseline. Never lower it to make a run pass. -->

## AI backend contract (microservice boundary)

The `ai-insights` and `assistant` modules do NOT contain business logic anymore — they are **thin HTTP proxies** to the FastAPI service in `../ai-backend`.

- The Nest controllers remain the public contract layer: guards, DTOs, routes, and response shapes are unchanged from the monolith.
- Services forward to `AI_BACKEND_URL` (local: `http://localhost:8000` via docker-compose; prod: Cloud Map `http://ai-backend.gosapp.local:8000`).
- Every forwarded request carries the `X-Internal-Key` header (env `INTERNAL_API_KEY`) and the caller's `company_id`/`user_id` as explicit params — the AI backend trusts these, so they must never come from client input.
- `AI_BACKEND_ENABLED=false` falls back to the legacy in-process implementation (rollback path).
- Changing an AI endpoint's shape requires a matching change in `../ai-backend` and in `proj-doc-v2` api-contracts — same session, no exceptions.

---

## Email & templates (`src/email/`)

All email sends go through the single `EmailService` choke-point (per-tenant
SendGrid/SMTP via `getSender`, Platform-Health tracked). Two DB-backed, editable
stores follow the **global-default (`company_id: null`) + per-org override**
pattern with a 5-min cache:

- **`email_config`** — provider creds (`EmailConfigService`). UI: super-admin
  `super-admin/email-config` + org `settings/email`.
- **`email_templates`** — the 21 "one shell, five dressings" transactional
  templates (`EmailTemplateService`). Rendered by `rendering/email-renderer.ts`
  (master shell + 5 category palettes + `{{var}}`/`{{#if}}` engine, ported from
  `planning/docs-ref/QLLeadsEmailSystem.html`). Send with
  `EmailService.sendTemplated(key, to, vars, companyId)`.

Rules:

- **The nine TRANSACTIONAL templates are provisioned at boot**, from `seed/email-defaults/`
  via `EmailTemplateProvisioningService` (`src/email/provisioning/`) — `super_admin_org_invite`,
  `team_member_invited`, `invite_not_accepted_5day`, `password_reset`, `login_otp`,
  `general_announcement`, and the support module's `support_ticket_created`,
  `support_ticket_update`, `support_ticket_resolved`. A NEW one goes in that folder, never inline
  in the seed CLI: a template that only a hand-run script writes is an outage waiting for its
  first send, since `sendTemplated` throws on a missing row. That is how every super-admin org
  invite email failed in production the day `super_admin_org_invite` shipped.
  🐞 **It happened a second time, on 2026-09-08, and worse — silently.** The three support
  templates lived only in the CLI. `TicketService.notify` sends the in-app and email legs from the
  SAME recipient list, but the email leg goes through `EmailService.sendTemplatedSafe`, which
  swallows the missing-template error into a `console.warn`. So moving a ticket to In Progress
  delivered the bell notification and dropped the email, with the super-admin toggle for it plainly
  switched on and nothing failing anywhere. **A template referenced by shipped code that is not in
  `seed/email-defaults/` is a production bug, not a style issue** — the diff between the keys
  `sendTemplated(Safe)` is called with and `listTemplateKeys()` must be empty. That guard is owed as
  a spec (see the Testing pause). The folder follows the exact
  rules `seed/notification-defaults/` does — read only when PROVISIONING, only through its one
  loader, `.js` so the seed scripts can `require()` it, and the `Dockerfile` MUST copy it into the
  runtime image.
- The `notif_*` rows are provisioned separately by `NotificationProvisioningService` from
  `seed/notification-defaults/`. One source per row — never add a `notif_*` template to
  `seed/email-defaults/`.
- **Boot provisioning UPDATES a row it still owns, as of 2026-09-07 — it is no longer fill-only.**
  Editing copy in `seed/email-defaults/` and deploying used to change nothing on a database that
  already had the row, with no error anywhere; that was the fill-only rule protecting a real thing
  (an operator's console edit) by making shipped copy undeployable. Provisioning now records a
  content hash of what it wrote in `template_provisioning_state`, so a boot can tell a row that is
  still byte-for-byte its own (→ updated) from one a human edited (→ left alone and named in a WARN)
  from one that predates the bookkeeping (→ adopted as-is, tracked from the next deploy on). A hash,
  not a hand-bumped version, because a version somebody must remember to increment is the same bug
  with extra steps. Policy: `src/common/provisioning/template-defaults-sync.ts`. Operator control:
  `TEMPLATE_DEFAULTS_SYNC` = `safe` (default) / `force` / `off`; `force` for ONE boot is how stale
  copy on pre-existing rows gets landed. Per-org overrides are never candidates — the sync is scoped
  to `company_id: null`.
- `node seed/seed-email-templates.js` still exists and is the way to REFRESH global copy on an
  existing database by hand (idempotent; never touches org overrides), including rows an operator
  has edited that provisioning will not overwrite on its own.
- Colours come from the template's `category` (A–E) via `THEMES` — not stored
  per-template.
- Edit templates at runtime via `admin/email-templates/*` (super admin,
  `platform.email`) / `org/email-templates/*` (org). Super-admin UI:
  Configuration → **Email Templates** tab (frontend `super-admin/config/EmailTemplatesTab.tsx`).
- Full reference: `proj-doc-v2/modules/email/`.

## Notification control plane — the DATABASE, not a folder

> **MANDATORY — the super admin's stored row is the only thing that decides how a notification
> behaves. No code path may consult a file to answer that question.**

`/super-admin/notifications` ("Trigger Config") is the whole control surface. Everything about an
event is a column on its **platform** `notification_configs` row (`company_id: null`):

| Column                             | Controls                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                          | Master switch. OFF retires the event whatever the channels say. Checked before publishing, so a retired event costs nothing |
| `dashboard` / `email` / `whatsapp` | Where it goes. A missing row or field means OFF (`?? false`)                                                                |
| `priority`                         | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`. **CRITICAL is the only value that bypasses quiet hours**                            |
| `lead_time_minutes`                | How long BEFORE the moment to send. The planner clamps it so it is never in the past                                        |
| `user_overridable`                 | May a RECIPIENT mute it? Enforced in gos-notification's `ChannelResolverService`                                            |
| `org_overridable`                  | May an organisation ADMIN re-route or reword it? Enforced on the write side                                                 |
| `category`                         | Grouping in the catalogue and in Settings → Notifications; picks the bell's icon                                            |

Message copy lives in `notification_templates` (in-app + WhatsApp) and `email_templates`
(`notif_<event_key>`), both editable from their own super-admin screens.

**Effective routing is an AND across four tiers** — the channel kill switch
(`communication_channel_settings`), the platform row, the organisation's override row, and NOT the
user's own opt-out. `enabled` is ANDed across the two tiers the same way, so an org may retire an
event for itself but can never revive one the platform retired. **Governance columns are platform
tier ONLY**: `upsertForOrg` whitelists `enabled` + the three channels and silently drops the rest,
because a tenant that could lower `billing.payment_failed` out of CRITICAL would be opting out of a
guarantee the platform makes to that tenant's own users.

### `seed/notification-defaults/` is SEED DATA

One file per product module, combined by `index.js`, declaring the values each event is BORN with.
It used to live at `src/modules/notifications/config/` and be read at DISPATCH time — which made it
a second control surface, editable only by a deploy, sitting behind the super admin's back. It was
moved out of `src/` so that cannot come back.

It is read in exactly **two** places, both fill-only:

1. the seed scripts beside it (`seed-notification-config.js`, `sync-templates-from-config.js`)
2. `NotificationProvisioningService` at boot, through the single loader at
   `src/modules/notifications/provisioning/notification-defaults.loader.ts`

Rules:

- **Nothing else under `src/` may load that folder.** The loader is the only permitted reader and
  uses `require` at a resolved path, not a static import — the folder is outside `src/` on purpose,
  and a static import would drag it into the TypeScript program (and, with no `rootDir` set, move
  `dist/`'s whole layout).
- **`Dockerfile` must copy `seed/notification-defaults/` into the runtime image.** Only `dist/` is
  copied otherwise, so without that line first-run provisioning works locally and silently does
  nothing in production.
- **GOVERNANCE provisioning is fill-only, forever.** `notification_configs` rows: new rows via
  `$setOnInsert`; absent governance columns via `$set` guarded on `$exists: false`; nothing else,
  ever. It runs on every boot of every replica, so anything that could overwrite a saved toggle,
  priority or lead time would erase it on the next deploy. `false` and `0` are real values — never
  approximate "absent" with falsiness.
- **COPY provisioning is VERSION-AWARE, and that is deliberately different** (2026-09-07).
  `notification_templates` and the `notif_*` `email_templates` rows were fill-only too, which meant
  a full rewrite of a notification's wording could ship to production and change nothing, silently —
  the same class of failure as the config mirror this folder was ejected from `src/` to prevent,
  pointing the other way. Provisioning now records content hashes in `template_provisioning_state`
  and updates only a row that is still byte-for-byte what it last wrote; an operator-edited row is
  reported and left alone. See `src/common/provisioning/template-defaults-sync.ts` and
  `TEMPLATE_DEFAULTS_SYNC`. Do NOT extend this to the config row — a tenant's governance is not
  copy.
- **Deliberately `.js`, not `.ts`** — the plain-Node seed scripts must `require()` it. Types are
  declared by the loader (and, for the specs, in `test/notification-defaults/`).
- **No mirror in `../gos-notification` any more.** That service reads the same
  `notification_configs` row (`NotificationGovernanceService`, `ChannelResolverService`), so the two
  cannot drift. The old hand-kept mirror is exactly what caused one silent production failure
  between these repos.
- **Adding an event to `NOTIFICATION_EVENTS` without defaults still fails the build** —
  `test/notification-defaults/notification-defaults.spec.ts` asserts parity in both directions. The
  ONE exception is the two `support.ticket_*_update` events, which are registered so the bell can
  give them a category but are governed by the Support Config screen rather than by
  `notification_configs` (see the block comment above them in `notification-events.ts`). That spec
  carries them as an explicit allowlist, so a THIRD undefaulted event still fails; adding to that
  list is a deliberate act, not a way past the guard.
- **`CONFIG_HELP` (the ⓘ text), preview sample vars and the locked platform-email list are NOT
  defaults** and live in the module as ordinary TypeScript: `notification-help.ts`,
  `notification-samples.ts`, `gos-email-templates.ts`.
- **Placeholder names contain underscores.** Never strip markdown across a whole template string —
  doing so once corrupted `{{task_title}}` into `{{tasktitle}}` in 61 of 64 templates, which
  renders as empty text.

## Documentation (`proj-doc-v2/`)

> **MANDATORY — a task is not complete until the docs are updated. No exceptions.**

This repo holds the **canonical** `proj-doc-v2/`. The frontend and ai-backend repos link here by path — do not create copies there.

Every feature must be documented in `proj-doc-v2/` **before or alongside** coding. Two files per module — never put API details in the implementation doc or vice versa.

```
proj-doc-v2/
  platform/          architecture.md, infrastructure.md, decisions.md
  modules/<module>/
    implementation.md   # What is built, frontend pages, data flows, collections table, notable patterns
    api-contracts.md    # Every endpoint (method/path/body/response/side-effects), MongoDB schemas, business logic rules
  stop/
    prd.md   backend-contracts.md
```

**What triggers a doc update — no exceptions:**

| Change made                              | What to update                                                  |
| ---------------------------------------- | --------------------------------------------------------------- |
| New API endpoint                         | `api-contracts.md` — add row to the controller's endpoint table |
| Changed endpoint (path, body, response)  | `api-contracts.md` — update the affected row                    |
| New or changed Mongoose schema field     | `api-contracts.md` — update the collection's field table        |
| New business logic rule or state machine | `api-contracts.md` — update Business Logic Rules section        |
| New feature or sub-feature               | `implementation.md` — add row to What Is Implemented table      |
| Non-obvious pattern introduced           | `implementation.md` — Notable Patterns                          |
| New data flow (multi-step sequence)      | `implementation.md` — ASCII flow under Data Flows               |

**Enforcement:** do not report a task as done without updating the relevant docs; after every code change, state which doc files you updated (or why none needed it); if a module folder is missing, create both files with the standard sections before coding.

---

## TypeScript & Type Safety

> Use TypeScript in the best, most idiomatic way possible on every change — the rules below are
> non-negotiable baselines, not just suggestions.

**Avoid Type Erasure**

- Never use `any` — use `unknown` for unpredictable data and narrow it safely.
- Avoid `as CustomType` assertions except at external/legacy boundaries.
- Use type guards (`is` predicates, `in` checks, Zod) for runtime safety.
- Handle `null`/`undefined` explicitly — never use `!`.

**Design Patterns**

- Model complex UI/state machines with Discriminated Unions.
- Prefer `readonly` on arrays and properties in pure logic.
- Use `interface` for structural objects/class APIs. **Never hardcode a fixed-set string value as
  a raw literal or literal-union type** (a status, a category, a `type`/`mode` discriminant, etc.)
  — always define a TypeScript `enum` for it instead, even if the set has only two members or is
  currently used in only one place. Reach for a plain string-literal `type` union instead only
  where a plain string is actually required for interop — e.g. a Mongoose schema's `enum`
  validator (`@Prop({ enum: [...] })` needs a literal string array, not an `enum` object — derive
  it with `Object.values(MyEnum)` rather than hand-duplicating the list), or a value that crosses
  an API/JSON boundary as-is. This does not apply to free-text/log strings or route paths — only
  to closed, named sets of constant values. Applies going forward only — existing hardcoded
  fixed-set strings are not being retroactively swept.
- Use built-in utilities (`Pick`, `Omit`, `Partial`, `ReturnType`) over duplicate types.

**Execution Practices**

- Design types/interfaces _before_ writing logic.
- Explicitly type function definitions and public API returns — don't rely on inference alone.
- Co-locate types with the code that uses them; move to `types/` only if 3+ modules share them.
- Every enum lives in that module's `<feature>.enums.ts` (this repo has no `types/` subfolder
  convention — enums sit next to `<feature>.types.ts` the same way, e.g.
  `src/modules/bms/bms-intake.enums.ts`) — never inline an `enum` directly in a service/controller/
  schema file. An enum shared by 3+ modules follows the same co-location rule as any other type.
- Keep helpers localized; use `export type` over full imports to optimize bundling.
- **Optimize deliberately** — avoid redundant DB queries/loops/allocations in hot paths; pick an
  efficient query shape or algorithm where it measurably matters (e.g. batch a query instead of
  N+1-ing it in a loop). Don't sacrifice readability for a micro-optimization that has no
  measurable benefit.

---

## Key constraints

- **Ask before building** — clarify requirements, edge cases, and scope with counter-questions before starting any implementation.
- **Docs are mandatory** — see Documentation section.
- **Never run git operations autonomously** — no `git add`, `git commit`, `git push`, or branch creation unless explicitly asked.
- **TypeScript must pass** — `pnpm run type-check` after every change. Empty output = clean.
- **Tests must pass, and must exist** — `pnpm test` after every change. Any function you add or
  change needs a spec added/updated in the same session, using `@test/factories` for all mock data
  (see Testing above). Never hand-write a mock document or a model double.
- **Never put prompt-supplied data in a test/spec file — synthesize it instead, no exceptions.**
  Real-looking data pasted into a prompt (an error log, a support ticket, a debug dump) is very
  often real production data — a real GSTIN, a real legal/trade name, a real address, a real
  account id. Using it in a test fixture commits it to git **permanently**, in the diff and in
  history, even if the file is later edited again. When a bug report contains data like this,
  reproduce the exact SHAPE of the failure (same string lengths, same edge case, same field
  combination) with obviously-fake values you invent yourself — a fictitious company/person name,
  a syntactically-valid-but-made-up GSTIN/phone/email/address — never the literal values from the
  prompt. Applies to every spec file, not only bug-fix regression tests.
- **Shared types** — co-locate with the owning module (e.g. `src/team/`, `src/modules/bms/`), never a generic `utils/types` catch-all.
- **Never a raw fixed-set string literal — always an enum** — a closed set of named constant values (a status, a category, a `type`/`mode` discriminant, etc.) must be a TypeScript `enum` in that module's `<feature>.enums.ts`, not a hardcoded string or string-literal union (see TypeScript & Type Safety → Design Patterns). Does not apply to free-text/log strings or route paths. Applies going forward only — existing hardcoded fixed-set strings are not being retroactively swept.
- **User/Employee schema changes** — any edit to `User` or `Employee` MUST be mirrored in `../gos-auth`'s copies in the same session (see Shared schema mirroring rule above).
- **The super admin's stored row is the notification control plane** — `notification_configs`
  decides channels, the master switch, priority, lead time and who else may change an event. Never
  read a file to answer any of those at runtime, and never hardcode a lead time, priority, channel
  default or message string in a service. `seed/notification-defaults/` supplies the value a row is
  BORN with and is read only by the seed scripts and by boot provisioning, through its one loader.
  Adding a key to `NOTIFICATION_EVENTS` without defaults fails the build. See the section above.
- **`NOTIFICATION_SERVICE_ENABLED` is RETIRED — the flag and the crons it gated are both gone.**
  `calendar-notification.cron.ts` has been DELETED; meeting reminders, personal reminders and
  follow-up-due are scheduled jobs in `../gos-notification` and nowhere else. The variable is no
  longer read anywhere in this repo and can be dropped from the task definitions.

  Why it went rather than staying as a rollback path: it **failed open**. Anything other than the
  exact string `"true"` left the in-process copies live, and they carried no claim of their own, so
  a typo meant every calendar notification went out twice per API replica. A flag whose failure
  mode is silent duplication is worse than no flag; the rollback is restoring one file from git.

- **A cron-driven claim must be a compare-and-swap on something the claim CHANGES.** Every `@Cron`
  in this repo fires in EVERY replica; there is no leader election and no distributed lock, so the
  claim's filter is the entire safety mechanism. `WhatsAppOutboxService.claimBatch` is the correct
  pattern (it moves `status` PENDING → IN_FLIGHT, so `status` is the token).
  `NotificationOutboxService.sweep` filtered on `status: PENDING` while writing only
  `attempts`/`next_attempt_at` — the token never changed, so the losing replica matched too and
  every replayed notification event went out once per API task. Pin the values the read actually
  saw. And test it CONCURRENTLY: the spec that was meant to cover this asserted only the order of
  the writes, which is necessary and nowhere near sufficient.
- **`unique + sparse` is wrong for a nullable dedupe key — use `partialFilterExpression`.** `sparse`
  skips a MISSING field, not an explicit `null`, and `@Prop({default: null})` writes an explicit
  null. Under `unique + sparse` the second keyless row collides with the first; this is what limited
  `whatsapp_outbox` to exactly ONE test/manual row for the life of the collection. Also note
  `countDocuments({f: null})` matches missing fields too — use `{$type: 'null'}` when you mean
  explicit nulls. Changing an existing index's options needs a migration: `autoIndex` silently will
  not alter an index that already exists.
- **A `$set` on a `timestamps: true` schema's `createdAt` is silently dropped by Mongoose itself,
  on EVERY `updateOne`/`updateMany`/`findOneAndUpdate` — not just `save()`.** Mongoose's own update
  middleware (`applyTimestampsToUpdate.js`) deletes an explicit `$set.createdAt` and replaces it
  with a no-op `$setOnInsert.createdAt` (which only ever applies on an upsert-insert, never on an
  existing document) unless the query is given `{ overwriteImmutable: true }` as its options
  argument. The write still reports `{ acknowledged: true, modifiedCount: 1 }` — Mongo really did
  modify the document (e.g. bumping `updatedAt`), so nothing about the result looks like a failure.
  Confirmed live (2026-09-17, `AdminService.simulateOnboardingAge`/`PaymentRepository.
simulatePaymentPaidAt`): backdating a test org's `Tenant.createdAt` and a `Payment.createdAt` both
  silently did nothing across several attempts, while a plain `@Prop({type: Date})` on the same
  document (`Subscription.current_start` — not part of any `timestamps: true` pair) updated
  correctly every time, which is what actually pointed at the plugin rather than the query. Any
  future write to a Mongoose-managed `createdAt`/`updatedAt` path via an update method (not `.save()`
  on a hydrated document) needs `{ overwriteImmutable: true }` in that call's options.
- **WhatsApp is WATI (Business API), and it sends approved TEMPLATES — not text.** OpenWA is gone:
  no session, no contact check, no freeform send. Meta accepts arbitrary text only inside a
  24-hour customer-service window, which a business-initiated notification is never in.

  So there is a REGISTRY: `whatsapp_templates` maps an event key to an approved Wati template plus
  the mapping from this platform's `vars` to its placeholders. `WhatsAppService.queueMessage`
  resolves it BEFORE writing an outbox row and answers `NO_TEMPLATE` when there is none — queueing
  a row with no template would park work Meta can never accept. **Create the template in Wati, get
  Meta's approval, register it, THEN it sends**; nothing is sendable until its row is `APPROVED`.

  Templates are being uploaded event by event, **calendar first**. A non-calendar event whose
  WhatsApp leg reports `SKIPPED_CONFIG` is expected during the rollout.

  **The MAPPINGS are provisioned at boot** (2026-09-07) — `WatiTemplateProvisioningService` +
  `WhatsAppTemplateBootstrap` read `seed/wati-defaults/` through one loader, exactly the seam
  `seed/notification-defaults/` and `seed/email-defaults/` use, and the `Dockerfile` must copy that
  folder into the runtime image. Before this, rows arrived only from a hand-run script, so a fresh
  environment or a restored backup had an EMPTY `whatsapp_templates` and every WhatsApp leg reported
  `NO_TEMPLATE` — which is not an error anywhere, so it looked exactly like a misconfigured gateway.
  ⚠️ It writes the mapping (`template_name`, `broadcast_name`, `parameters`) and NEVER `status`:
  rows land DRAFT and only `--approve` (verified against Wati) or a super admin can make one
  APPROVED. A boot that could set APPROVED would queue messages Meta then rejects one at a time
  until each dies. `seed/wati-defaults/` is also the single source the two Wati seed scripts read,
  so the mapping list has one copy, not three.

  ⚠️ **Wati answers HTTP 200 with `{result: false}` for business rejections.** The gateway client
  converts that into an `ok: false` result; treating the 200 as success would mark the row SENT and
  lose the message silently.

- **A direct `whatsapp_outbox` write bypasses the control plane — apply the governance gate
  yourself.** The master switch is read in `NotificationDispatchService.dispatchEvent`, the channel
  flags in gos-notification's `ChannelResolverService`, and the drain sends whatever the outbox
  holds without consulting either. So any path that queues a row WITHOUT publishing a notification
  event — `InviteWhatsAppService` is the one that exists, because an invitee has no `sys_user` to
  fan out to — silently opts the message out of the super admin's Trigger Config. That shipped once:
  WhatsApp was paused for "Member invited" and the message went out anyway.

  Three tiers, ANDed, before the write: the channel kill switch
  (`ChannelSettingService.availabilityFor`), the event master switch (`governanceFor().enabled`) and
  the event's WhatsApp flag (`getChannels()`). Read each through its own service — **the two
  collections have OPPOSITE missing-row defaults** (missing `communication_channel_settings` row =
  ENABLED, missing `notification_configs` row = OFF), and folding them into one query gets that
  asymmetry wrong. **Fail closed**: an unreadable config queues nothing.

  Govern by the PLATFORM event key, not the template-registry key (`member_invited`, not
  `team.member_invited`) — the registry keys stay distinct because `member_invited` is a
  third-person announcement to the existing team and sharing a row would send the invitee's copy to
  every member, but the TOGGLE is shared, because that is the row a super admin actually reaches for.

- **Notification DELIVERY is gos-notification's, not this repo's.**
  `NotificationDispatchService.dispatchEvent()` **publishes** the event onto the shared BullMQ
  `notifications` queue and returns `ChannelOutcome.QUEUED`; gos-notification resolves channels,
  renders copy and runs all three transports. Never reintroduce a delivery leg here — the previous
  duplicate implementation drifted and silently broke WhatsApp (the two services disagreed on the
  case of the outbox status enum). The ONLY synchronous send left is `dispatchTest()`, which the
  Settings "send test" action needs in order to report a real result.
- **NO CRONS IN THIS REPO, except payment/billing.** Every schedule belongs on gos-notification's
  queue; this repo is for serving API requests. `src/modules/payment/cashfree-billing-scheduler.service.ts`
  and `src/modules/payment/ql-payment-reconciler.service.ts` are the carve-out and stay here.
  Anything else that needs to happen on a schedule gets a `scheduled_jobs` row and a handler in
  `../gos-notification`, never an `@Cron` here.

  **Retire a migrated cron by DELETING its decorator, not by gating it.** The calendar trio's
  `NOTIFICATION_SERVICE_ENABLED` flag predates the worker being proven and **fails open**: anything
  other than the exact string `"true"` leaves the in-process copy live, and these crons carry no
  claim, so the duplication is per-API-replica. That is the right default only while the worker is
  undeployed and the wrong one the moment it is deployed. Deleting one line has no ambiguous state
  and is the same one-line rollback. Keep the METHOD when it is still useful by hand (see
  `NotificationOutboxService.sweep`, which remains the manual replay path); delete the whole file
  when it is a duplicated TRANSPORT (see the removed `WhatsAppOutboxWorker` — a dormant second copy
  of a transport is exactly the drift that silently broke WhatsApp once already).

  **Status by module — what moved, what stayed, what is still synchronous —
  is `proj-doc-v2/platform/background-work-migration.md`.** Read that before adding any scheduled
  or bulk work.
  **The migration is complete**: the only `@Cron` decorators left are the five in
  `payment/cashfree-billing-scheduler.service.ts` plus one in
  `payment/ql-payment-reconciler.service.ts` (added 2026-09-04 — recovers a QL Pay landing signup
  that settles after the browser stops polling; see `bug-fixes/payment-billing.md`). That file's
  OTHER scheduled method, the actual reconcile pass, is deliberately NOT a `@Cron` — its cadence is
  a super-admin-configurable value (`/super-admin/config` → Reconciliation tab), so it's a dynamic
  `setInterval` registered via `SchedulerRegistry` instead, re-armed live on every config save. See
  that service's own header comment before reaching for `SchedulerRegistry` elsewhere — it is new
  to this codebase and adds real complexity (no config UI should default to it over a plain
  `@Cron` unless the schedule genuinely needs to change without a redeploy).
  `ScheduleModule.forRoot()` survives in `app.module.ts` for these payment-module consumers alone.

- **BULK work is asynchronous too — do not add a new long-running loop to a request handler.**
  CSV imports and mass provisioning go through `src/modules/bulk-jobs/`: the endpoint writes a
  `bulk_jobs` row, publishes its id, and returns `202 { job_id, status: 'QUEUED' }`; the client
  polls `GET /bulk-jobs/:id` and reads `result`, which is byte-for-byte the body the endpoint used
  to return synchronously.

  **The logic stays in THIS repo, unlike the crons.** gos-notification owns _when and whether_ a
  bulk job runs and calls `POST /internal/bulk-jobs/:id/run` to make it happen;
  `BulkJobRunnerService` dispatches to the real service here. Moving
  `HrService.bulkCreateEmployees` would have meant mirroring Cognito provisioning, seat limits,
  RBAC resolution, leave setup, invites and audit into a second repo — a far worse trade than one
  internal call, and this platform has already been bitten twice by that kind of mirror.

  Two rules that are load-bearing: **nothing is retried automatically** (these runners create real
  records, so `attempts: 1` and the internal endpoint returns 200 even on a business failure, so a
  worker cannot mistake it for a transport error), and **synchronous validation stays synchronous**
  (anything that should be a 400 on the user's screen runs before the enqueue). See
  `proj-doc-v2/modules/bulk-jobs/`.

- **Scheduled jobs: gos-backend is the control plane only** — `src/modules/scheduled-jobs/`
  manages job _definitions_ (create/edit/delete/pause/resume/skip). It must never execute them:
  no `@Cron`, no BullMQ `Worker`, no notification transport in that folder. Execution belongs to
  `../gos-notification`. Skipping an occurrence must never reschedule or re-register the job —
  store a skip window and let the worker decline at execution time (see
  `proj-doc-v2/modules/scheduled-jobs/`).

  **`scheduled_jobs.company_id` is nullable, and null means a PLATFORM job** — a schedule owned by
  the product rather than by a tenant (the WhatsApp outbox drain, the notification outbox sweep).
  Same convention as `notification_configs`. The tenant API cannot create one (`AdminGuard` takes
  `company_id` from the token); they are seeded by
  `../gos-notification/seed/seed-platform-jobs.js`. A super-admin surface for them is still owed.

- **Multi-tenancy** — every new query and schema must carry/filter `company_id`.
- **Use a secondary index wherever one is possible** — every field (or field combination) a query
  actually filters, sorts, or joins on needs its own `index: true` or compound `Schema.index(...)`;
  `company_id` alone is not enough once a query filters on it plus another field (see Mongoose
  conventions above for the real gap this caught in `Lead`/`NotificationLog`/`Employee`).
- **Default to the database, not JS, for filtering/sorting/grouping/joins** — never
  `Model.find({}).exec()` + `Array.filter()`/`.reduce()`/manual joins in the service when a Mongoose
  query filter can do it. Between a plain filtered `.find()` and a full aggregation pipeline
  (`$match`/`$group`/`$lookup`), pick whichever is actually the more optimized or simpler fit for
  that case — reach for the pipeline only when it earns its keep, not by default (see Mongoose
  conventions above). Fall back to JS only when the DB genuinely can't express the shape. Applies
  going forward only — existing code is not being retroactively swept.
- **Write clean, well-commented code** — comment any non-trivial block to explain what it's doing
  and why (security decisions, infrastructure workarounds, magic numbers, non-standard patterns,
  and any logic that isn't immediately obvious from naming/structure alone). Skip comments on
  self-evident one-liners — don't restate what a well-named line already says.

## Bug fixing (ALWAYS — when the task is a fix)

When the user reports a bug or asks for a fix (a "fix", "bug", "issue", "not working", a QA/defect
report, etc.), treat it as a **tracked bug fix**, not just an edit:

1. **Get the BUG-ID.** Every fix is tracked against an identifier. Use the one the user gives
   (e.g. `BUG-1234`, a ticket/issue number) verbatim. **If none is provided, ask for it (via the
   AskUserQuestion tool) before finishing** — only record `NO-ID` if the user confirms there is none.
2. **Root-cause first.** Follow `superpowers:systematic-debugging` — find the root cause before any
   fix; no symptom patches.
3. **Track it separately** — call it out in the status checklist with the 🐞 icon (see below) so
   fixes are distinct from feature work.
4. **Log it** — in the **same session**, record the fix in this repo's own `bug-fixes/` folder:
   add the row to **both** the full log (`bug-fixes/README.md`) **and** the matching feature-wise
   file (`bug-fixes/<feature>.md` — create it and link it from the README if the feature has none
   yet). Also mirror the row into the cross-service master `../planning/bug-fixes/` (its full log +
   feature file). Keyed by the BUG-ID; newest at the top; link the JIRA/tracker URL when available.
5. **Record owed tests (do NOT write them now).** Per the deferred-test policy (see Testing below),
   record each changed unit — including the bug's regression case — in
   `../docs/testing/TEST-BACKLOG.md` for a later testing pass, instead of writing specs inline.

## End every response with a status checklist

At the END of every response, always output a checklist summarizing what was done and what was
not done in that turn, so I can verify completeness at a glance. One line per item, each marked:

- ✅ done
- ⬜ not done / pending
- ⚠️ blocked or skipped (with a one-line reason)
- 🐞 bug fix — use this icon (not ✅) for any bug-fix line, so fixes stand out from feature work

**When the turn fixed a bug, the checklist MUST open with a dedicated `Bug fixes` group** listing
one 🐞 line per bug, each **stating the BUG-ID and what was fixed** (e.g.
`🐞 BUG-1234 fixed — <what changed>`). A partial/unverified fix stays ⬜/⚠️ with its BUG-ID and what
remains. Use `🐞 NO-ID` only when the user confirmed no tracker ID exists (see Bug fixing above).

Include this checklist every time, even for small tasks. If the turn was purely a question with
no actions taken, a single line stating that is enough.

## Understand Anything (Knowledge Graph)

The codebase knowledge graph lives in `.ua/`. Updated manually —
no post-commit hook (too slow for daily commits).

**Run `/understand src/` when:**

- A new module is added to `src/modules/<feature>/`
- A schema is significantly restructured
- A new cross-service contract is introduced
- After a major feature branch is merged to main

**Run `/understand-diff` before every PR** — cheap, fast,
surfaces blast radius. Paste the summary into the PR description.

**Never run on every commit.**

<!--
**The checklist MUST always contain a dedicated `Tests` group** — this is how test coverage is
tracked from now on, not left implicit.

> **Under the current deferred-test policy** (see Testing above): mark each changed unit
> 📝 **recorded in `../docs/testing/TEST-BACKLOG.md`** instead of ✅ — do not write specs inline —
> and end with a **backlog tally** (`Backlog: N/N recorded`) rather than a coverage tally. Report
> `pnpm test` (existing suite) + type-check results (not new-spec results). The rest of the format
> below still applies.

- List every function / service method / controller endpoint / schema field **added or changed this
  turn**, each with its unit-test status: ✅ spec added or updated, ⬜ spec still owed, or
  ⚠️ deliberately skipped (with a one-line reason — e.g. "mirrors an already-untested passthrough",
  "service needs 20+ providers to instantiate — disproportionate").
- Changed code with no spec is **never omitted** — it appears as ⬜ or ⚠️ so the gap is visible.
- End the group with a one-line **coverage tally**, e.g.
  `Coverage: 3/4 changed units tested (1 skipped — reason)`.
- State the **test-run result** inline when tests were run (e.g. `backend 58/58 pass`); if tests
  were not run, mark that ⬜.
- If the turn genuinely changed no runtime code (docs/config only), a single
  `Tests: none needed — no runtime code changed` line satisfies this. -->

# CLAUDE.md — gos-frontend

This repo is the **frontend service** of the gos-app microservice split. It is a fully independent git repo (NOT part of a monorepo). It contains the Next.js tenant app plus vendored copies of the shared packages.

Sibling repos (separate git repos, never imported at build time):

- `../backend` — gos-backend (NestJS API :3001) — holds the CANONICAL `packages/shared` and the canonical `proj-doc-v2/` docs
- `../ai-backend` — gos-ai-backend (internal-only; the frontend never calls it directly)
- `../` (gos-app root) — gos-infra umbrella repo (terraform/ + planning/)

---

## Commands

```bash
# Dev (backend must be running on :3001 — see ../backend)
pnpm dev                      # Next.js on :3000

# Build
pnpm build

# Type check (run after every change — CI gate)
pnpm type-check

# Tests (see the Testing section below)
pnpm test                     # both projects; prints the module-wise pass/fail table
pnpm test:cov                 # + coverage; writes ../../docs/testing/reports/frontend-latest.md
cd apps/web && pnpm e2e       # Playwright (needs the app running on :3000)

# Docker image
docker build -f apps/web/Dockerfile -t gos-frontend .
```

---

## Repository layout

```
apps/web/          Next.js 14 App Router app (port 3000) — the only app in this repo
packages/
  shared/          Shared TS types/DTOs — DOWNSTREAM copy; canonical lives in ../backend/packages/shared
  ui/              Shared React components
  config/          Shared tsconfig/ESLint configs
docs/Form-System.md  Full form-system guide
```

The internal pnpm-workspace layout exists only so the Dockerfile and `workspace:*` deps keep working — this is a single-service repo, not a monorepo. Package names remain `@gosplatform/*`.

**Shared-types rule:** never edit `packages/shared` here. Changes are made in `../backend/packages/shared` (canonical) and rsync-copied over, then `pnpm type-check` re-run.

---

## API access

**All API calls go through the Next.js proxy** at `/api/proxy/[...path]` (`apps/web/src/app/api/proxy/[...path]/route.ts`), which forwards the httpOnly cookie to the NestJS backend. The backend origin comes from **`NEXT_PUBLIC_API_URL`** (default `http://localhost:3001`). Never call the backend origin directly from client components. Use `apiFetch()` from `@/lib/api.ts`.

AI features (insights, assistant) are also called through the same proxy → NestJS routes; the NestJS backend internally forwards to the FastAPI ai-backend. The frontend never talks to the ai-backend.

**Two app shells:**

- `(desk)` — authenticated admin layout; `layout.tsx` is a Server Component that checks auth
- `employee` — employee self-service portal

---

## React & Next.js Performance

This section is the canonical source for memoization/render-cost guidance — other sections below
cross-reference it rather than restating it.

**Memoization** — `useMemo`/`useCallback` only when a value feeds a dependency array, passes into
a `React.memo` child, or recomputes a non-trivial transform (see Tables above). Skip on trivial
primitives/handlers with no memoized child downstream. `React.memo` without memoized props does
nothing — do both or neither.

**Render scope** — split state so one input's keystroke doesn't re-render a whole form/table.
Keep fast-changing values (scroll/mouse/in-flight input) local, not in shared store/context.
Split contexts by update frequency (don't bundle `user` with `sidebarCollapsed`).

**Code splitting** — route splitting is automatic; keep module-specific components out of shared
shells (`DeskShell`/`EmployeeShell`). Use `next/dynamic({ ssr: false })` for heavy, rarely-used,
client-only components (editors, charts, PDF viewers) — not reflexively on everything.

**Server vs. Client** — default is Client Component per current architecture (only the auth-check
layouts — `employee` and `(desk)` — are Server Components). A new static, non-interactive section
can stay a Server Component if it needs no client data fetching — don't `"use client"` out of
habit, but don't restructure the data-fetching model to force it either.

**Extracting no-client-logic pieces** — a component with no hooks, no state, no event handlers,
and no browser APIs is a candidate to split out into its own Server Component (no `"use client"`)
instead of living inside an existing Client Component's file. But dropping the directive only
helps if the component is actually composed in as `children`/props from a Server Component
ancestor (`<ClientWrapper>{<ServerChild />}</ClientWrapper>`) — if a Client Component instead
`import`s and renders it directly, it's still pulled into that client's module graph and runs
client-side regardless of its own file lacking `"use client"`. Don't extract a piece expecting a
bundle-size win unless the composition actually goes through an ancestor this way.

**Images/fonts** — always `next/image` with explicit `width`/`height` or `fill`; `priority` only
on above-the-fold hero images, never list thumbnails. Fonts stay on `next/font` — no new `<link>`
or `@import`.

**Bundle discipline** — check for an existing utility (`cn()`, `lucide-react`, etc.) before adding
a new dependency for the same job. Named imports only (`import { X } from "lucide-react"`), never
namespace imports — preserves tree-shaking.

**react-hook-form** — RHF is uncontrolled by design; don't defeat it. Never call top-level
`watch()`/`useWatch()` in a form body — it re-renders the whole form on every keystroke. Scope
reactivity with `useWatch({ name })` in a small child, or read via `getValues()` in handlers.
Prefer `FormInputWrapper`'s field-level subscription over controlled `value`/`onChange` mirrors.

---

## Mobile Responsiveness

**Every new screen or feature must be mobile responsive — this is a hard requirement, not a
nice-to-have.** Build mobile-first: base (unprefixed) Tailwind classes are the small-screen
layout; override at `sm:`/`md:`/`lg:` for larger viewports, not the other way around.

**Established patterns in this codebase — reuse them, don't reinvent:**

- **Side panels/sheets** — `CommonSlidableSidebar` already does this correctly: `w-full
sm:max-w-[40vw]` (full-width below `sm`, capped width above). Any new panel follows this exact
  shape.
- **Multi-column layouts** (kanban boards, card grids, dashboards) — stack to a single column
  below `md` (`flex-col md:flex-row`), never a fixed pixel width (`w-[310px]`) with no responsive
  override — that forces horizontal-scrolling through narrow columns on mobile instead of a
  natural vertical stack. If a component has a viewport-relative height cap for desktop-only
  internal scrolling (e.g. `md:max-h-[calc(100vh-210px)] md:overflow-y-auto`), cancel it at the
  base tier (`max-h-none overflow-visible`) so mobile just flows with the page.
- **Toolbars/filter rows** — `flex flex-wrap` so filter chips/selects reflow onto multiple lines
  instead of overflowing or squeezing unreadably.
- **Tables** — shadcn's `Table`/`CommonTable` already wrap in a horizontally-scrollable
  container, an acceptable mobile fallback for data-dense tables — but don't compound it with
  fixed per-column pixel widths (`CommonTableColumn.width`) that sum to more than a ~375px
  viewport can show without scrolling every single row.
- **Forms** — fields stack full-width by default via `FormInputWrapper`; don't force a 2-column
  `grid grid-cols-2` below `md` — collapse to one column on small screens
  (`grid-cols-1 md:grid-cols-2`).

**Before marking any UI task done, check the screen at a mobile width (~375–414px), not just
desktop** — exactly as mandatory as running `pnpm type-check`. A feature that only works well
above `sm`/`md` is not complete.

---

## Asynchronous bulk imports

**Every CSV/bulk import is asynchronous.** The four import endpoints return
`202 { job_id, status: 'QUEUED' }` rather than the result — the work runs on gos-notification's
queue, off the request path, because a large file used to hold an API worker for minutes while the
browser waited or hit the ALB idle timeout.

**Use `submitBulkJob<T>(url, body)` from `@/lib/bulk-job`, never `apiFetch.post` for an import.**
It POSTs, polls `/api/bulk-jobs/:id`, and resolves with `result` — which is byte-for-byte the body
the endpoint used to return synchronously. That is why the migration touched only the four hook
files: every template, component and toast downstream was unchanged. Keep it that way — a new
import should slot in the same way rather than growing its own polling in a component.

It throws `BulkJobFailedError` (carrying the backend's reason) and, after 10 minutes,
`BulkJobTimeoutError` — whose message says the job is still running and only the page stopped
watching, because that is what is true. Don't reword that into "the import failed".

Testing note: a stub that answers one canned response per request will make `submitBulkJob` poll
until its timeout. The established shape is to answer the POST with `{ job_id, status: 'QUEUED' }`
and the `/api/bulk-jobs/` poll with a finished job carrying `result` — see `stubBulkJob` in
`useEmployeeAPI.test.ts`.

## WhatsApp is WATI, and it sends approved TEMPLATES

The gateway is the WhatsApp Business API. Outside a 24-hour customer-service window Meta accepts
only templates it has pre-approved, so **copy is not something this platform decides at send time**
— it is authored in Wati, approved by Meta, and referenced by name.

Two screens, and they are NOT the same thing:

- **Message Templates** (`/super-admin/whatsapp/templates`) — the in-app and WhatsApp copy this
  platform renders from `notification_templates`. Still ours.
- **Wati Templates** (`/super-admin/whatsapp/wati-templates`) — the REGISTRY: which approved Wati
  template each event sends through, and which of our vars fill its placeholders. It records a
  mapping; it cannot author or submit a template.

**Only `APPROVED` sends.** An event with no approved mapping does not send on WhatsApp at all — its
in-app and email legs are unaffected. Templates are being uploaded event by event, **calendar
first**, so unmapped events are expected during the rollout.

The test-send takes a template name and `name=value` parameters, deliberately: a freeform test
would pass on credentials alone while the thing most likely to be wrong — an unapproved template,
or a parameter count Meta disagrees with — went untested.

## Frontend conventions

**Page structure** — `app/**/page.tsx` files are thin; they render a template from `src/modules/<feature>/templates/`.

**Module structure** — every feature in `src/modules/<feature>/`:

```
components/   # presentational, feature-scoped only
templates/    # page-level composition
hooks/        # all data fetching
types/        # index.ts — one barrel file
utils/        # form-utils.ts, formatters, etc.
```

Shared components used across 3+ modules go in `src/components/common/`. Never import cross-module.

**Data fetching — React Query only, going forward.** Every new hook must be a `useXxxAPI()` factory built on `@tanstack/react-query`'s `useQuery`/`useMutation`, matching `src/modules/hr/employees/hooks/useEmployeeAPI.ts`: each declaration is just `queryKey` + `queryFn: () => apiFetch...` (queries) or `mutationFn: (dto) => apiFetch...` (mutations) — nothing else. Dropdown lists: `?limit=1000`, read `.data` from the paginated response inside `queryFn`:

```ts
queryFn: () => apiFetch.get<{ data: Employee[] }>("/api/hr/employees?limit=1000").then((res) => res.data),
```

The older plain-`useState`+`useEffect` hook style (calling `apiFetch` directly inside a `useEffect`) still exists in a number of files written before this rule (e.g. `modules/stop/hooks/useStop.ts`) — those are legacy and are **not** being retroactively migrated as a blanket pass; migrate one only when you're already substantially touching it for other work, not proactively. Never write a _new_ hook in that style.

**Hooks contain no business logic — only fetch/mutation wiring, nothing else.** A `useXxxAPI()` factory file may call **only** `useQuery` and `useMutation` — no other React hook of any kind may appear in that file: no `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useContext`, `useQueryClient`, custom hooks, nothing. No derived/computed values, no plain helper functions (date formatting, lookups, etc.) either — `hooks/` holds nothing but the request itself and its raw loading/error/data state. Everything else — derived booleans, formatting for display, combining values, plain helper functions — belongs in `utils/` (pure logic) or `templates/`/`components/` (anything that drives rendering). Toasts, cache invalidation (`useQueryClient().invalidateQueries`), and any derived state specific to _how_ a mutation is used belong in a **separate, second orchestrating hook** in its own file that wraps `.mutate()` — that second hook is where `useQueryClient` and friends are allowed to live, never inside the base `useXxxAPI()` factory itself (see `references/data-fetching.md` in the `nextjs-module-architecture` skill for the pattern). This is a hard rule: enforce it on every new hook and when touching an existing one.

**Consume query/mutation state directly at the call site — never shadow it with a separate `useState`.** Destructure `isLoading`/`isPending`/`isError`/`isSuccess`/`data`/`error` straight off the `useQuery`/`useMutation` return value wherever it's called (component, template, or the orchestrating hook wrapping `.mutate()`). Do not create a parallel `const [loading, setLoading] = useState(false)` (or `error`/`success` equivalents) and manually flip it around an `await mutation.mutateAsync(...)` call — the mutation/query object already tracks that state; a hand-rolled duplicate can drift out of sync with the real request status and is pure redundant code. This applies to every consumer of a React-Query hook, not just the hook file itself.

**API calls must be minimal — no duplicate calls, ever, until a duplicate is actually needed.** Before adding a new `useQuery`/fetch call, check whether the same data is already being fetched elsewhere in the same tree (a parent, a sibling, or the same hook called with an identical `queryKey`) and reuse/lift that instead of firing a second request. Specifically watch for React logic that silently re-fires a call that looks like it only runs once:

- A `useEffect`/`useCallback`/`useMemo` dependency array holding a value that's a _new_ object/array/function literal every render (an inline `{}`/`[]`, an unmemoized `.filter()`/`.map()` result, a fresh closure) — this re-triggers the effect/query on every render, not once on mount as it appears to.
- A data-fetching hook called inside a component that's rendered many times in a list/table row, when the data it fetches is shared or company-wide — hoist the fetch to the parent and pass the result down instead of each row fetching its own copy.
- A `refetch()`/`reload()`/`invalidateQueries()` called reflexively after every mutation "to be safe," when the mutation's own response already contains everything needed to update local/cache state without a full re-fetch.
- The same `queryKey` fetched from two different hooks/components on the same page with slightly different key arrays (e.g. one passes `[..., undefined]`, another omits the trailing arg) — React Query treats these as different cache entries and fetches both.
  Before adding any refetch/invalidate/new fetch call, trace whether the change actually invalidates the data — don't add one just in case.

**Paginated lists** — standard pattern:

```tsx
<RenderIf condition={!loading}>
  <DataEmptyHandler data={items} emptyMessage="No items yet.">
    {items.map((item) => (
      <ItemCard key={item._id} {...item} />
    ))}
    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
  </DataEmptyHandler>
</RenderIf>
```

**Tables** — always use `CommonTable` (`src/components/common/common-table.tsx`) over hand-writing shadcn `Table`/`TableHeader`/`TableRow`/etc. per feature. Define a `columns: {key, label, align?}[]` config and build `data` rows (values can be plain text or JSX — a `Badge`, an image+name flex, action buttons) via `useMemo`, then wrap with `DataEmptyHandler` for the empty state:

```tsx
const columns = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" },
];

const rows = useMemo(
  () =>
    items.map((item) => ({
      name: item.name,
      status: <Badge>{item.status}</Badge>,
      actions: (
        <Button size="sm" onClick={() => onEdit(item)}>
          Edit
        </Button>
      ),
    })),
  [items],
);

<DataEmptyHandler data={items} emptyMessage="No items yet.">
  <CommonTable columns={columns} data={rows} />
</DataEmptyHandler>;
```

Only skip `CommonTable` for a table with genuinely custom row/cell structure that the config shape can't express (rare) — document why inline if so.

**Scrollable lists** — whenever a list/table's content could grow long enough to push the page into an awkward full-page scroll (a table inside a fixed-height container like a `Sheet`/side panel, a tab body, a dashboard card), wrap it in `ScrollableList` (`src/components/common/scrollable-list.tsx`) instead of leaving the page/container to scroll as a whole:

```tsx
<ScrollableList className="max-h-[calc(100vh-260px)] flex flex-col gap-5">
  {items.map((item) => (
    <Row key={item._id} {...item} />
  ))}
</ScrollableList>
```

Content-agnostic (table, cards, plain rows) — just caps height and scrolls internally (`overflow-y-auto`). The default cap is `max-h-[calc(100vh-320px)]`; override via `className` (merged with `cn()`/`twMerge`, so a passed `max-h-[...]` correctly replaces the default) when the surrounding chrome is a different height — e.g. a `Sheet` side panel needs a smaller offset than a full desk page. For a sticky table header inside it, add `className="sticky top-0 z-10 bg-white"` to the header element you render inside (sticky positioning only needs the `overflow-auto` ancestor `ScrollableList` already provides) — and if you're wrapping a hand-rolled `<table>`, don't nest shadcn's own `<Table>` wrapper inside `ScrollableList`: `Table` hardcodes its own `overflow-auto` div, which becomes a second competing scroll container and breaks the sticky header (see `attendance-log-table.tsx` for the working pattern: raw `<table>` + the individual `TableHeader`/`TableBody`/etc. sub-components, not the top-level `Table`).

**Tabs** — always use `CommonTab` (`src/components/common/common-tab.tsx`) over hand-writing shadcn `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` per feature. Define a `tabs: {label, content, isDisabled?, toolTipText?}[]` array — only the active tab's `content` is mounted, so a tab's queries don't fire until it's actually selected:

```tsx
const tabs = [
  { label: "Employee Type", content: <EmployeeTypeTab notify={notify} /> },
  { label: "Department", content: <DepartmentTab notify={notify} /> },
  {
    label: "Locked",
    content: <LockedTab />,
    isDisabled: true,
    toolTipText: "Finish setup first",
  },
];

<CommonTab
  tabs={tabs}
  activeIndex={activeIndex}
  onTabChange={setActiveIndex}
/>;
```

`CommonTab` ships with two built-in GrowthOS themes via `variant?: "pill" | "underline"` (default `"pill"`) — the app's actual visual tab style, not something to re-derive per feature. **Never hand-copy `listClassName`/`triggerClassName` strings to recreate either look** (that was a real, since-cleaned-up mistake — see `platform/decisions.md` #12): default `"pill"` (white bordered track, solid `--gos-blue` active pill) covers the overwhelming majority of tabs; pass `variant="underline"` (bottom-border tabs, e.g. Employee Detail, Approvals) only when a page's reference design specifically calls for it. `listClassName`/`triggerClassName` still exist for page-specific _additions_ on top of the chosen variant (merged via `cn()`/twMerge, never replacing it) — not for re-theming.
`CommonTab` is presentational only (uncontrolled by default via internal state; controlled via `activeIndex`/`onTabChange` — a fully controlled contract, not an HTML-style "initial value" default, so always pair `activeIndex` with `onTabChange` wired to the same backing value). If a feature needs its active tab remembered across navigation, back it with `createTabIndexStore` (`src/store/create-tab-index-store.ts`) — a factory returning a small Zustand store persisted to sessionStorage, keyed by a storage key you pick:

```ts
const useMyTabStore = createTabIndexStore("my-feature"); // module scope, not inside the component

// in the component:
const { index, setIndex } = useMyTabStore();
<CommonTab tabs={tabs} activeIndex={index} onTabChange={setIndex} />
```

Only build a feature-specific store when persistence is actually wanted — most tabs stay plain `useState`.

**Debouncing** — use `useDebounce` from `@/hooks/useDebounce` (500ms default). Never inline `useEffect` + `setTimeout`.

**File upload (S3)** — use `useFileUpload` from `@/hooks/useFileUpload`. Never route file bytes through the proxy.

```ts
const { uploadFile } = useFileUpload();
const result = await uploadFile(file); // → POST /aws/presigned-url then PUT to S3
if (!result) return; // undefined on error
await saveMetadata(result.fileKey, file.name);
```

Key files: `src/hooks/useFileUpload.ts`, `src/hooks/api/useupload.ts`, `src/api/upload.ts`, `src/lib/utils/upload.ts`.

**CSV import (bulk row import) — always the centralized `components/common/csv/mapped-*` architecture, never a hand-rolled wizard.** Employee CSV import (`modules/hr/employees/`) is the reference implementation this was extracted from; treat it as the worked example to copy. A new import needs only:

- **`<feature>-csv-fields.tsx`** — declares `CsvMappedField[]` (each: `key`/`label`/`example`/`required?`/`aliases?`/optional `rowRule`) and, if any field blocks the whole import, `CsvRowRuleGroup[]`. `rowRule.kind` is one of `RequiredPresence` (blank blocks), `RequiredFormat` (blank or format-invalid blocks — pass an `isValid` checker), `RequiredReference` (blank blocks; a _present-but-unrecognized_ value only excludes that one row and surfaces an inline "add it" chip — never treat "unrecognized" the same as "blank"), or `RequiredDropIfBlank` (row is silently dropped pre-validation, e.g. a missing name). See `modules/hr/employees/utils/employee-csv-fields.tsx` for a fully worked config.
- **An orchestrating hook**, only if the import needs "add unknown value" inline-create chips (owns the create-mutation + toast + cache-invalidation, e.g. `useEmployeeCsvImportConfig.ts`) — builds the full `CsvMappedImportConfig`.
- **A thin wrapper component** rendering `<CommonMappedCsvImportPanel config={...} onDone={...} />` — no new upload/column-mapping/preview/result JSX.

Do **not** hand-roll a new upload dropzone, column-mapping grid, preview table, or result screen for a new import — that is exactly what `useMappedCsvImport`/`CommonMappedCsvImportPanel` already provide generically. Do **not** reach for the older, simpler `CommonCsvColumnImport`/`CsvColumnMapConfig<TRow>` (`components/common/csv/types.ts`) for a new feature either — that system is kept only for Holidays' existing usage (its single arbitrary `buildRow(raw, seen)` callback per row fits custom coercion/cross-row dedup a declarative rule set can't express, e.g. Holiday's string→boolean `is_optional` and its duplicate-date check) and is not the pattern going forward.

**Forms** — react-hook-form + zod. Schema, type inference, and `defaultValues()` factory live in `utils/form-utils.ts`. Render fields with `<FormInputWrapper form={form} fieldConfig={{ name, fieldVariant, ... }} />`. Full guide: `docs/Form-System.md`.

**Prefer common form elements over native HTML.** Before reaching for a bare `<select>`, `<input>`, `<textarea>`, etc., check whether a shared component already covers it: dropdowns → `SelectField` (`components/common/select-field.tsx`) or `SearchableSelect`/`CardSelect` (`components/common/select/`) depending on the use case; text/number/date inputs → shadcn `Input` (`components/ui/input.tsx`); multiline text → shadcn `Textarea`; tag-style repeatable values → `dynamicFieldArrayInput` (`components/common/form/conditions-input.tsx`). Inside a react-hook-form-backed form, this is already the default via `FormInputWrapper`'s field variants — this rule mainly matters for plain component-state UI outside a form (e.g. a repeatable row builder no `FormInputWrapper` variant covers), where it's easy to drop back to a raw element out of habit. Only use the native HTML element directly when no common component exists for that need — don't invent a one-off wrapper first; check `components/common/` and `components/ui/` before writing new markup.

**UI components** — every visual element uses shadcn/ui. Install missing components with `npx shadcn@latest add <name>`. Use `cn()` from `@/lib/utils` for class merging.

**Zustand** — `ui.store.ts` holds `sidebarCollapsed` with `persist` middleware. Only `sidebarCollapsed` is persisted.

**React performance** — see "React & Next.js Performance" above (Memoization) for the full rule;
the Tables example above already applies it (`rows` built via `useMemo`).

---

<!--
## Testing

> **MANDATORY — a change is not complete until its test is.**
> Canonical reference: `../backend/proj-doc-v2/platform/testing.md`. Running/troubleshooting:
> `../docs/testing/TESTING.md`. Backlog: `../docs/testing/COVERAGE-LEDGER.md`.

> **⏸️ CURRENT POLICY — deferred tests.** Do **NOT** write tests inline with a change right now.
> Instead record each added/changed unit in `../docs/testing/TEST-BACKLOG.md` (file/symbol, what it
> does, cases to cover) for a later dedicated testing pass. This temporarily overrides the
> "same session" rule below. The `PostToolUse` test-guard hook still fires — treat it as a prompt to
> add the backlog row, not to write the test. Still run `pnpm type-check` + the existing suite to
> confirm nothing broke; just don't author the new tests yet.
>
> **⛔ Tests fully paused (current direction): do NOT write, update, or run any unit tests — and you
> may skip the `TEST-BACKLOG.md` row too.** A single `Tests: paused — not writing tests for now` line
> in the status checklist satisfies the Tests-group requirement below. Still run `pnpm type-check`
> and, if an existing test breaks from your change, fix that existing test (that's maintenance, not
> new test authoring). Resume normal test-writing only when this line is removed.

**(Suspended under the deferred policy above.)** Every function, hook, or component you add or change
gets a test added or updated in the same session. Tests are colocated: `useToggle.ts` →
`useToggle.test.ts`.

**Two Jest projects — put the test in the right one:**

| Project | Env   | Matches                                                  | For                              |
| ------- | ----- | -------------------------------------------------------- | -------------------------------- |
| `logic` | node  | `src/**/lib/**/*.test.ts`, `src/**/utils/**/*.test.ts`   | pure functions — no DOM, fastest |
| `dom`   | jsdom | `*.test.tsx`, `hooks/**/*.test.ts`, `store/**/*.test.ts` | hooks, stores, components        |

Pure logic must stay in the `logic` project — don't reach for jsdom because it's there.

**Never hand-write fixtures inline.** Import from `@test/factories`:

```ts
import { renderWithProviders, stubApi, paginated, buildEmployee, screen } from '@test/factories';

stubApi([{ url: '/api/hr/employees', body: paginated([buildEmployee()]) }]);
renderWithProviders(<EmployeeList />);
expect(await screen.findByText('Rakesh Iyer')).toBeInTheDocument();
```

**Use `stubApi`, not `mockFetch`, for anything going through `apiFetch`.** `src/lib/api.ts` is
**axios**-based, and axios under jsdom uses the XHR adapter — it never touches `global.fetch`, so
`mockFetch` cannot intercept a data hook. `stubApi` spies on `request` _and_ every verb helper,
because verb helpers are pre-bound: a `request`-only spy silently misses `apiClient.post(...)` and
lets a real network call through (that produced ten false passes once). `mockFetch` is still correct
for code that genuinely calls `fetch` (`useDashboard`, reverse-geocode, direct-to-S3 upload).

**From the `logic` project, import `@test/factories/data`.** The main barrel pulls in Testing
Library and `user-event`, which read `document` at import time and cannot load in node.

`renderWithProviders` wraps in a test-tuned `QueryClient` (no retries, no cache between tests).
**Unmocked `fetch` throws by design** — a unit test that hits the network is a test with a hidden
dependency.

**What to test, and what not to.** Test `lib/` utilities, hooks (including React Query factories),
zustand stores, and shared components in `components/ui` / `components/common`. Do **not** write
jest tests for page-level flows — Playwright (`pnpm e2e`) already covers those and duplicating them
in jsdom is brittle against UI churn. `app/**` and `templates/**` are excluded from coverage for
exactly that reason, so the headline frontend percentage is **not** comparable to the backend's.

**Feature-module `components/` are triaged, not swept.** A module's own `components/` sits between
the two rules above: not a shared primitive, not a page flow. Test one when it carries logic —

- conditional rendering with real branches (empty / loading / error / permission-gated),
- a derived or computed value (a total, a percentage, a ₹ amount, date maths, sort/filter order),
- form validation, or callback wiring worth pinning.

Skip pure presentational wrappers, styled divs, and thin re-exports — and say so in the response
rather than leaving the gap unexplained. **Anything that gates on permissions, or computes a number
a user makes a decision on, is not optional**: a nav item that renders for the wrong role and a
pipeline total that is quietly wrong are the two bug classes this tier exists to catch. A coverage
number padded with `expect(container).toBeTruthy()` on presentational components is worse than an
honest gap, because it removes the signal that the gap was ever there.

**Coverage thresholds only ratchet up.** After landing tests, raise the global floor in
`apps/web/jest.config.js` to the new measured baseline. Never lower it to make a run pass. -->

## Design System

Source of truth: `../planning/docs-ref/growth_os_design_system_and_components.html` (open it in a browser) — a static reference page cataloging the GrowthOS visual language: color palette, typography, spacing/radius, and a component gallery (buttons, inputs, date pickers, tables, sidebars, modals, alerts, etc). Check it before styling any new UI — it's the visual spec new components should match.

**The tokens are already ported into `globals.css`** — every color/radius/shadow from the reference exists as a `--gos-*` CSS variable in `apps/web/src/app/globals.css` (search `Growth OS design-system doc tokens`). Never hardcode the reference's hex values — use these:

| Reference               | Token                                 | Value                                                                         |
| ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Blue / Normal           | `--gos-blue`                          | `#094ed2`                                                                     |
| Blue / Light            | `--gos-blue-light`                    | `#e6edfb`                                                                     |
| Blue / Dark             | `--gos-blue-dark`                     | `#073b9e`                                                                     |
| Blue / Darker           | `--gos-blue-darker`                   | `#031b4a`                                                                     |
| Yellow / Normal         | `--gos-yellow`                        | `#ffc938`                                                                     |
| Yellow / Light          | `--gos-yellow-light`                  | `#fffaeb`                                                                     |
| Neutral / Normal        | `--gos-neutral`                       | `#a2a8bd`                                                                     |
| Neutral / Light (bg)    | `--gos-neutral-light`                 | `#f6f6f8`                                                                     |
| Neutral / Darker (text) | `--gos-neutral-darker`                | `#393b42`                                                                     |
| Page background         | `--gos-page-bg`                       | `#f0f2f7`                                                                     |
| Green / Success         | `--gos-green` / `--gos-green-light`   | `#12b76a` / `#e7f8f0`                                                         |
| Orange / Warning        | `--gos-orange` / `--gos-orange-light` | `#f79009` / `#fef4e6`                                                         |
| Red / Danger            | `--gos-red` / `--gos-red-light`       | `#dc2626` / `#feeceb`                                                         |
| Card radius             | `--gos-r-card`                        | `12px`                                                                        |
| Button/input radius     | `--gos-r-btn`                         | `8px`                                                                         |
| Pill radius             | `--gos-r-pill`                        | `20px` (full)                                                                 |
| Card shadow             | `--gos-shadow`                        | `0 2px 8px rgba(0,0,0,0.08)`                                                  |
| Body font               | `--gos-font-body`                     | `var(--font-stack)` (Inter — self-hosted via `next/font`, `src/lib/fonts.ts`) |

**There is only one font family in the entire app, including the landing/marketing pages** — Inter, via `--font-stack`. Headings resolve to `--font-heading`, which is just an alias for `--font-stack` — do not introduce a second typeface (Plus Jakarta Sans / DM Sans are gone) anywhere. `--font-mono` (a plain system-monospace stack, no webfont) is the one accepted exception, reserved for fixed-width contexts (IDs, tx hashes, JSON/code viewers) — a formatting convention, not a competing brand font. Never hardcode a literal `fontFamily`/`font-family` value inline — always reference `var(--font-stack)` (or rely on inheritance, since `body` already sets it) / `var(--font-mono)`.

Not yet ported: the reference's purple/accent swatch (`#832ef4` / `#f3eafe`) and its CTA gradient (`#062895 → #0A59E4`, for primary CTA buttons only, never backgrounds). Add them as `--gos-purple` / `--gos-purple-light` / `--gos-cta-gradient` alongside the tokens above if a feature needs them — don't invent ad hoc names.

**How the tokens actually apply — remapping, not literal use.** `DeskShell.tsx` doesn't sprinkle `--gos-*` everywhere. At the shell root it remaps the base tokens every existing component already consumes (`--blue-50`, `--gray-900`, `--hover-bg`, `--text-muted`, etc.) to their `--gos-*` equivalents once:

```ts
style={{
  "--blue-50": "var(--gos-blue-light)",
  "--gray-900": "var(--gos-neutral-darker)",
  "--hover-bg": "var(--gos-neutral-light)",
  // …
}}
```

Any component under the desk shell that already uses the base tokens picks up the GrowthOS palette automatically — no per-component change needed. Follow this remap pattern for a new shell-level surface; don't reference `--gos-*` directly in leaf components unless the base-token remap genuinely doesn't cover the case (see the few direct uses in `Breadcrumbs.tsx`/`UserMenu.tsx` for that exception).

**Component catalog → what to actually use.** The reference's "Components" tab is a visual spec, not an importable library — build with the real stack:

| Reference component                          | Use this                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button (Primary/Secondary/Danger)            | For any primary/submit button, use `CommonButton` (`components/common/common-button.tsx`) — never shadcn's `Button` with `variant="default"` directly for a primary action; that falls through to `--primary`/`--blue-600` (`#007be0`), not the GrowthOS brand blue. `CommonButton` wraps shadcn `Button` with the fixed `bg-[var(--gos-blue)] text-white hover:bg-[var(--gos-blue-dark)]` theme baked in. Secondary → shadcn `Button variant="outline"`; tertiary → `variant="ghost"`; destructive → `variant="destructive"`. |
| Input, DateInput, TimePicker, DateTimePicker | shadcn `Input`; dates via `components/common/select/SelectDate.tsx` + shadcn `Calendar`/`Popover`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| SelectInput, MultiSelect, Dropdown           | `components/common/select/` (`searchable-select.tsx`, `CardSelect.tsx`) or shadcn `DropdownMenu`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| DateRangePicker / DateRangePresetPicker      | `DateRangePicker` (`components/common/date-range-picker.tsx`) — shadcn `Button` + `Popover` + range `Calendar`, with optional quick-shortcut presets and an Apply/Clear footer; `value`/`onChange` take a `DateRange`. Use it rather than re-composing per feature                                                                                                                                                                                                                                                             |
| Table + Pagination                           | `CommonTable` (`components/common/common-table.tsx`) + `components/common/pagination.tsx` — never hand-roll                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Long/overflowing list or table content       | `ScrollableList` (`components/common/scrollable-list.tsx`) — caps height and scrolls internally instead of growing the page; see "Scrollable lists" above                                                                                                                                                                                                                                                                                                                                                                      |
| Sidebar (dark / light)                       | `DeskShell.tsx` (dark) / `EmployeeShell.tsx` (light)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Breadcrumbs                                  | `components/desk/Breadcrumbs.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Tabs                                         | `CommonTab` (`components/common/common-tab.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Accordion, Checkbox, ToggleSwitch, Avatar    | Not yet built — install with `npx shadcn@latest add accordion checkbox switch avatar` and style with the tokens above rather than one-off hex values                                                                                                                                                                                                                                                                                                                                                                           |
| Modal / AlertPopUp                           | shadcn `Dialog` / `AlertDialog` (`components/ui/dialog.tsx`, `alert-dialog.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Tooltip                                      | shadcn `Tooltip` (`components/ui/tooltip.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Toast                                        | `components/Toast.tsx` + `components/common/toast.ts` — not shadcn's Sonner                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Spinner                                      | `CommonLoader` (`components/common/CommonLoader.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ProgressBar                                  | shadcn `Progress` (`components/ui/progress.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| StatusBadge, Pill                            | shadcn `Badge` (`components/ui/badge.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Card                                         | shadcn `Card` (`components/ui/card.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| UploadFile                                   | `useFileUpload` (see File upload above), styled as a dashed-border drop zone per the reference                                                                                                                                                                                                                                                                                                                                                                                                                                 |

When the reference shows a component with no counterpart yet, build it as a shared component under `components/common/` (used by 3+ modules) or the owning module's own `components/` (single feature) — don't recreate the reference's raw HTML/CSS classes (`.btn-primary`, `.field`, `.modal-box`, etc.); those are illustrative only, not a stylesheet to import.

**Icons** — every user-facing icon uses the animated-icon set at `components/ui/animated-icons/` (a `lucide-react` base wrapped in a per-icon hover animation, globally toggleable via `usePlatformSettings().enableHoverAnimations`). Never emoji-as-icons; prefer these over importing bare `lucide-react`. Full guide, prop API, and how to add a new icon: `docs/Icon-System.md`.

---

## Documentation

The canonical `proj-doc-v2/` lives in `../backend/proj-doc-v2/`. Frontend page/route changes update `implementation.md` (Frontend Pages section) of the relevant module there — a task is not done until docs are updated.

---

## TypeScript & Type Safety

> Use TypeScript in the best, most idiomatic way possible on every change — the rules below are
> non-negotiable baselines, not just suggestions.

**Avoid Type Erasure**

- Never use `any` — use `unknown` for unpredictable data and narrow it safely.
- Avoid `as CustomType` assertions except at external/legacy boundaries.
- Use type guards (`is` predicates, `in` checks, Zod) for runtime safety.
- Handle `null`/`undefined` explicitly — never use `!`.

**Design Patterns**

- Model complex UI/state machines with Discriminated Unions.
- Prefer `readonly` on arrays and properties in pure logic.
- Use `interface` for structural objects/class APIs. **Never hardcode a fixed-set string value as
  a raw literal or literal-union type** (e.g. `context?: "member" | "employee"`, a status/category/
  role/type discriminant) — always define a TypeScript `enum` for it instead, even if the set has
  only two members or is currently used in only one place. Reach for a plain string-literal `type`
  union instead only where a plain string is actually required for interop — e.g. a value that has
  to match a shared backend contract exactly, or crosses an API/JSON boundary as-is (a string
  enum's runtime value still serializes identically over JSON, so lean on the enum even at a
  boundary unless the raw string is contractually required verbatim). This does not apply to
  free-text/UI copy, CSS classnames, or route paths — only to closed, named sets of constant
  values. Applies going forward only — existing hardcoded fixed-set strings are not being
  retroactively swept.
- Use built-in utilities (`Pick`, `Omit`, `Partial`, `ReturnType`) over duplicate types.

**Execution Practices**

- Design types/interfaces _before_ writing logic.
- Explicitly type function definitions and public API returns — don't rely on inference alone.
- Co-locate types with the code that uses them; move to `types/` only if 3+ modules share them.
- Every enum lives in that module's `types/enums.ts`, re-exported through the module's existing
  `types/index.ts` barrel (create the `types/` folder if the module doesn't have one yet) — never
  inline an `enum` directly in a component/template/hook file. An enum shared by 3+ modules follows
  the same co-location rule as any other type: move it to a shared location instead of duplicating it.
- Keep helpers localized; use `export type` over full imports to optimize bundling.
- **Optimize deliberately** — see "React & Next.js Performance" above for hooks/render-cost
  specifics. Don't sacrifice readability for a micro-optimization that has no measurable benefit.

---

## Key constraints

- **Ask before building** — clarify requirements, edge cases, and scope before starting any implementation.
- **Never put prompt-supplied data in a test/spec file — synthesize it instead, no exceptions.**
  Real-looking data pasted into a prompt (an error log, a support ticket, a screenshot transcript)
  is very often real production data — a real customer name, address, GSTIN, email, account id.
  Using it in a test fixture commits it to git **permanently**, in the diff and in history, even
  if the file is later edited again. When a bug report contains data like this, reproduce the
  exact SHAPE of the failure with obviously-fake values you invent yourself — never the literal
  values from the prompt. Applies to every spec file, not only bug-fix regression tests.
- **Mobile responsive is mandatory** — every new or touched screen/feature must work at mobile widths (~375–414px), not just desktop (see "Mobile Responsiveness" above for the established patterns). Applies going forward, plus any existing component you're already touching for other work — not a standalone retroactive pass across the whole app.
- **Never run git operations autonomously** — unless explicitly asked.
- **Never touch `style`/`className`/CSS on logic-only tasks** — copy JSX/styles verbatim on refactors (see `.claude/skills/preserve-ui`).
- **TypeScript must pass** — `pnpm type-check` after every change. Empty output = clean.
<!-- - **Tests must pass, and must exist** — `pnpm test` after every change. Any function/hook/component
  you add or change needs a colocated test added/updated in the same session, using
  `@test/factories` for fixtures and rendering (see Testing above). -->
- **Extract components at ~30–40 lines** — into the module's own `components/`, never `components/common/`.
- **Primary buttons use `CommonButton` only** — `components/common/common-button.tsx`. Every new primary/submit button renders through it; never shadcn's `Button` with `variant="default"` (see Design System → Component catalog). This applies going forward only — existing buttons are not being retroactively migrated.
- **Prefer common form elements over native HTML** — check `components/common/`/`components/ui/` for an existing dropdown/input/textarea component before writing a bare `<select>`/`<input>`/`<textarea>`; only use the native element when nothing already covers the need (see Frontend conventions → Forms). Applies going forward only — existing native elements are not being retroactively migrated.
- **New hooks use React Query (`useQuery`/`useMutation`) only** — no new hook may use the plain `useState`+`useEffect` fetch style (see Frontend conventions → Data fetching). Applies going forward only — existing plain-fetch hooks (e.g. `modules/stop/hooks/useStop.ts`) are not being retroactively migrated as a blanket pass.
- **Any new bulk CSV import must use the centralized `components/common/csv/mapped-*` architecture** — a declarative field/rule config (`<feature>-csv-fields.tsx`) plus `CommonMappedCsvImportPanel`, never a new hand-rolled upload/mapping/preview wizard and never the older `CommonCsvColumnImport`/`CsvColumnMapConfig<TRow>` system (see Frontend conventions → CSV import). `modules/hr/employees/utils/employee-csv-fields.tsx` is the reference example. No retroactive migration of anything predating this — it governs new import features only.
- **Never a raw fixed-set string literal — always an enum** — a closed set of named constant values (a status, a category, a `context`/`type`/`mode` discriminant, etc.) must be a TypeScript `enum` in that module's `types/enums.ts`, not a hardcoded string or string-literal union (see TypeScript & Type Safety → Design Patterns). Does not apply to UI copy, CSS classnames, or route paths. Applies going forward only — existing hardcoded fixed-set strings are not being retroactively swept.
- **Write clean, well-commented code** — comment any non-trivial block to explain what it's doing
  and why (non-obvious logic, workarounds, magic numbers, anything that isn't immediately clear
  from naming/structure alone). Skip comments on self-evident one-liners — don't restate what a
  well-named line already says.

## Bug fixing (ALWAYS — when the task is a fix)

When the user reports a bug or asks for a fix (a "fix", "bug", "issue", "not working", a QA/defect
report, etc.), treat it as a **tracked bug fix**, not just an edit:

1. **Get the BUG-ID.** Every fix is tracked against an identifier. Use the one the user gives
   (e.g. `BUG-1234`, a ticket/issue number) verbatim. **If none is provided, ask for it (via the
   AskUserQuestion tool) before finishing** — only record `NO-ID` if the user confirms there is none.
2. **Root-cause first.** Follow `superpowers:systematic-debugging` — find the root cause before any
   fix; no symptom patches.
3. **Track it separately** — call it out in the status checklist with the 🐞 icon (see below) so
   fixes are distinct from feature work.
4. **Log it** — in the **same session**, record the fix in this repo's own `bug-fixes/` folder:
   add the row to **both** the full log (`bug-fixes/README.md`) **and** the matching feature-wise
   file (`bug-fixes/<feature>.md` — create it and link it from the README if the feature has none
   yet). Also mirror the row into the cross-service master `../planning/bug-fixes/` (its full log +
   feature file). Keyed by the BUG-ID; newest at the top; link the JIRA/tracker URL when available.
5. **Record owed tests (do NOT write them now).** Per the deferred-test policy (see Testing below),
   record each changed unit — including the bug's regression case — in
   `../docs/testing/TEST-BACKLOG.md` for a later testing pass, instead of writing tests inline.

## End every response with a status checklist

At the END of every response, always output a checklist summarizing what was done and what was
not done in that turn, so I can verify completeness at a glance. One line per item, each marked:

- ✅ done
- ⬜ not done / pending
- ⚠️ blocked or skipped (with a one-line reason)
- 🐞 bug fix — use this icon (not ✅) for any bug-fix line, so fixes stand out from feature work

**When the turn fixed a bug, the checklist MUST open with a dedicated `Bug fixes` group** listing
one 🐞 line per bug, each **stating the BUG-ID and what was fixed** (e.g.
`🐞 BUG-1234 fixed — <what changed>`). A partial/unverified fix stays ⬜/⚠️ with its BUG-ID and what
remains. Use `🐞 NO-ID` only when the user confirmed no tracker ID exists (see Bug fixing above).

Include this checklist every time, even for small tasks. If the turn was purely a question with
no actions taken, a single line stating that is enough.

**The checklist MUST always contain a dedicated `Tests` group** — this is how test coverage is
tracked from now on, not left implicit.

> **Under the current deferred-test policy** (see Testing above): mark each changed unit
> 📝 **recorded in `../docs/testing/TEST-BACKLOG.md`** instead of ✅ — do not write tests inline —
> and end with a **backlog tally** (`Backlog: N/N recorded`) rather than a coverage tally. Report
> `pnpm type-check` + existing-suite results (not new-test results). The rest of the format below
> still applies.

- List every function / hook / component / endpoint / util / schema field **added or changed this
  turn**, each with its unit-test status: ✅ test added or updated, ⬜ test still owed, or
  ⚠️ deliberately skipped (with a one-line reason — e.g. "mirrors an already-untested passthrough",
  "page-level flow, covered by e2e per convention").
- Changed code with no test is **never omitted** — it appears as ⬜ or ⚠️ so the gap is visible.
- End the group with a one-line **coverage tally**, e.g.
  `Coverage: 3/4 changed units tested (1 skipped — reason)`.
- State the **test-run result** inline when tests were run (e.g. `frontend 175/175 pass`,
  `backend 58/58 pass`); if tests were not run, mark that ⬜.
- If the turn genuinely changed no runtime code (docs/config only), a single
  `Tests: none needed — no runtime code changed` line satisfies this.

## Test
