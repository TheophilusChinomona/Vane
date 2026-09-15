# PostgreSQL + Better Auth Multi-User Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for small and medium plans, or superpowers:subagent-driven-development when the plan is large enough that per-task subagents and review repay the cost. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Vane's SQLite persistence with PostgreSQL, add Better Auth email/password sessions, and enforce per-user ownership across the protected application and API.

**Architecture:** Drizzle's `node-postgres` driver will use only `DATABASE_URL`; the Better Auth Drizzle adapter will share the same schema/database. A server-only session helper will resolve the Better Auth cookie and provide either a user or a standardized 401/redirect response. Chats will carry a required Better Auth user ID and all chat/message access will query through that ownership predicate. The root layout will render public login/signup pages separately from the existing shell.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM + drizzle-kit, PostgreSQL (`pg`), Better Auth, React, Vitest/tsx test harness as dev-only tooling.

**Spec:** `docs/superpowers/specs/2026-09-15-postgresql-better-auth.md`

## Global Constraints

- Use PostgreSQL for both Better Auth tables and Vane application tables.
- Configure the database only with `DATABASE_URL`.
- Public email/password signup is enabled; the first successfully registered account is `admin`, later accounts are regular users.
- Unauthenticated page requests redirect to `/login`; unauthenticated API requests return HTTP `401`; auth endpoints remain public.
- Scope every chat, message, and persisted file-metadata operation by the server-resolved `session.user.id`; never trust a browser-provided user ID.
- Use `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` only from the environment; do not print, commit, or invent secrets.
- Do not preserve SQLite data, add email verification, password reset, OAuth, admin UI, Convex, ChromaDB, or a new rate limiter.
- PostgreSQL migrations must be idempotent and startup must fail clearly when required configuration is absent or invalid.

---

### Task 1: Establish PostgreSQL/Better Auth dependencies and schema boundary

**Files:**
- Modify: `package.json`, `yarn.lock` (dependency scripts and runtime/dev dependencies)
- Modify: `drizzle.config.ts` (PostgreSQL dialect and environment URL)
- Modify: `src/lib/db/schema.ts` (PostgreSQL-compatible Vane schema plus Better Auth tables)
- Modify: `src/lib/db/index.ts` (pooled PostgreSQL Drizzle client)
- Replace: `src/lib/db/migrate.ts` (PostgreSQL migration runner)
- Create: `src/lib/env.ts` (non-secret validation of required environment names/URLs)
- Create: `drizzle/0000_postgres_better_auth.sql` and matching Drizzle metadata

**Interfaces:**
- Produces `db`, `schema`, and `authSchema` exports usable by Better Auth and routes.
- Produces `requireServerEnv()` that validates presence/format without logging values.

- [ ] Add `pg`, `better-auth`, `@types/pg`, and dev-only test tooling; remove `better-sqlite3` and its types.
- [ ] Convert `messages`/`chats` to `pgTable`, use PostgreSQL JSONB and identity-compatible text IDs, add `chats.userId` FK/index, and retain existing application columns and relationships.
- [ ] Add Better Auth's `user`, `session`, `account`, and `verification` Drizzle definitions with the persisted `role` field.
- [ ] Replace SQLite startup migration code with a PostgreSQL runner that tracks migrations in PostgreSQL, runs each SQL file transactionally/idempotently, and throws a migration-specific error; never reads the SQLite directory/database.
- [ ] Generate or author the clean initial PostgreSQL migration containing auth tables, owned chats/messages, foreign keys, indexes, and cascade behavior.
- [ ] Run typecheck/schema generation checks and commit `feat: migrate persistence to postgres`.

### Task 2: Implement Better Auth server/client and atomic first-admin assignment

**Files:**
- Create: `src/lib/auth.ts` (Better Auth server configuration and Drizzle adapter)
- Create: `src/lib/auth-client.ts` (browser auth client)
- Create: `src/app/api/auth/[...all]/route.ts` (standard Better Auth catch-all handler)
- Create: `src/lib/auth-session.ts` (server-only session resolution/guards)
- Create: `src/lib/auth-role.ts` (atomic first-user role promotion)
- Create: `tests/auth-role.test.ts` (isolated role-assignment behavior)

**Interfaces:**
- `auth` is the configured Better Auth instance with email/password and secure cookie settings.
- `getSession(): Promise<Session | null>` resolves the current request session server-side.
- `requireUser()` returns the authenticated Better Auth user or throws/returns a route-safe unauthorized result.
- `assignInitialRole(userId)` performs a transaction/conditional update so concurrent signups cannot create two admins.

- [ ] Write failing unit/integration tests for empty-user admin assignment, subsequent regular assignment, and concurrent-safe conditional behavior; run them RED.
- [ ] Configure Better Auth with `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, the shared Drizzle PostgreSQL adapter, email/password only, persistent secure HTTP-only cookies in production, and no verification/reset/OAuth plugins.
- [ ] Implement first-user role promotion using a database-safe conditional operation and use the hook/callback that runs after successful account creation; preserve ordinary role on later signups.
- [ ] Implement the server session helper with no client-supplied identity and route-safe unauthorized semantics; run tests GREEN.
- [ ] Commit `feat: add better auth sessions and roles`.

### Task 3: Add public login/signup UI and protect the application shell

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/components/AuthForm.tsx`
- Modify: `src/app/layout.tsx` (public auth surface vs authenticated shell)
- Modify: `src/app/globals.css` only if required by existing styling conventions
- Create: `src/middleware.ts` or equivalent route guard if needed for page/API distinction

**Interfaces:**
- Auth forms call Better Auth client methods and navigate to `/` on success.
- Public routes are `/login`, `/signup`, and `/api/auth/*`; protected pages redirect to `/login`.

- [ ] Add form behavior tests for signup/login success and invalid-credential error presentation without account disclosure.
- [ ] Implement shared email/password form UI matching existing Vane components, with logout available from the existing shell/settings surface.
- [ ] Make root layout resolve the session before mounting `Sidebar`/`ChatProvider`; preserve setup UI only inside the authenticated shell and never make auth pages depend on provider setup.
- [ ] Protect page routes and return 401 from API routes using the centralized helper; verify anonymous page/API behavior with route tests.
- [ ] Commit `feat: add protected auth surface`.

### Task 4: Enforce ownership in chat/message/file operations and protected APIs

**Files:**
- Modify: `src/app/api/chats/route.ts`
- Modify: `src/app/api/chats/[id]/route.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/uploads/route.ts`
- Modify: `src/app/api/reconnect/[id]/route.ts`
- Modify: all remaining `src/app/api/**/route.ts` handlers to use the shared auth guard
- Modify: relevant upload manager/store APIs if file metadata needs owner association
- Create: `tests/authorization.test.ts` (distinct-user ownership cases)

**Interfaces:**
- Every protected handler obtains `user = await requireUser()` before model/file/database work.
- Chat lookup predicates combine resource ID and `chats.userId`; message reads/deletes are reached only through an owned chat.
- Upload/file metadata is associated with the current user or an owned chat and cannot be addressed by another user.

- [ ] Write failing tests proving anonymous 401, own-chat CRUD, and cross-user list/read/delete/mutate denial including message/file metadata; run RED.
- [ ] Scope chat list/create/get/delete and chat-stream persistence to the authenticated user; use ownership-aware predicates and transactions for delete.
- [ ] Protect search/media/provider/config/weather/suggestions/discover/uploads/reconnect APIs and ensure reconnect session IDs are user-bound rather than bearer capabilities.
- [ ] Ensure request body `chatId` and file IDs cannot create or mutate another user's records; do not use browser user IDs.
- [ ] Run focused authorization tests and full test suite GREEN; commit `feat: enforce per-user API authorization`.

### Task 5: Migration/config documentation and verification harness

**Files:**
- Modify: `README.md` or deployment documentation (environment names and clean PostgreSQL initialization)
- Modify: `.gitignore` if test artifacts are generated
- Create: `tests/setup.ts`, `tests/config.test.ts`, and test configuration as needed
- Modify: `package.json` (test script only; no production test dependency)

**Interfaces:**
- `yarn test` runs deterministic schema/auth/authorization tests without provisioning production infrastructure.
- Integration test is opt-in when a disposable PostgreSQL `DATABASE_URL` is supplied and never prints it.

- [ ] Add tests for missing/invalid environment configuration and idempotent migration semantics without exposing values.
- [ ] Document required environment variable names, clean initialization, retained untouched SQLite volume, and explicitly absent rate limiting; do not include values.
- [ ] Run `yarn test`, `yarn run lint`, and `yarn run build`; fix all failures.
- [ ] If an external disposable PostgreSQL is available, apply migrations twice and execute distinct-user signup/ownership checks; capture only statuses/counts, never credentials/URLs.
- [ ] Review `git diff`, `git status`, and committed files for secrets, SQLite/Convex/ChromaDB additions, and unintended infrastructure changes; commit `test: verify postgres auth authorization`.

## Self-review checklist

- Spec sections covered: PostgreSQL driver/schema/migrations (Task 1), Better Auth/session/roles (Task 2), public auth/protected pages (Task 3), all API ownership/401 behavior (Task 4), operations and acceptance verification (Task 5).
- No placeholder steps: each task names concrete files, interfaces, commands, and behavior.
- Type consistency: `requireUser()` is the only route identity boundary; `chats.userId` is the ownership key used by chat/message operations.
