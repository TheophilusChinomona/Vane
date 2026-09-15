# PostgreSQL-backed multi-user authentication for Vane

**Status:** Design approved; awaiting specification review  
**Date:** 2026-09-15

## Goal

Add true multi-user authentication to Vane using Better Auth, while moving Vane's persistent application data from SQLite to a dedicated PostgreSQL database. Authenticated users must be unable to access another user's chats, messages, or persisted chat file metadata.

## Decisions

- Use Better Auth for email/password accounts and persistent sessions.
- Use the existing Drizzle ORM as the database access layer.
- Use one dedicated PostgreSQL database and database role for Vane.
- Use PostgreSQL for both Better Auth tables and Vane application tables.
- Configure the database only with `DATABASE_URL`.
- Public email/password signup is enabled.
- The first successfully registered account becomes `admin`; later accounts are regular users.
- The existing SQLite data does not need to be preserved. No SQLite-to-PostgreSQL data transfer is required.
- Protect the entire application and all API routes.
- Do not add email verification, password reset, OAuth, or an admin dashboard in this release.
- ChromaDB and Convex are out of scope for this change.

## Existing system context

Vane is a Next.js App Router application. Its current persistence uses Drizzle with `better-sqlite3`; startup imports `src/lib/db/migrate.ts` to apply SQL files. The current application schema contains `chats` and `messages`. Chat records contain serialized `sources` and `files` metadata, and messages reference chats through `chatId`. The root layout currently renders the application shell after setup is complete, and API route handlers query the database directly without session authorization.

## Architecture

```text
Browser
  -> Next.js page/API request
  -> Better Auth session resolution
  -> authenticated user identity
  -> Drizzle PostgreSQL query scoped to user ownership
  -> PostgreSQL
```

Better Auth will expose its standard Next.js catch-all handler at `/api/auth/[...all]`. A server-side session helper will be the sole application boundary for resolving the current user. Browser-provided user IDs will not be trusted.

The root layout will separate the unauthenticated auth surface from the authenticated Vane shell. Login and signup must remain reachable without an application session. Once authenticated, users enter the existing shell and providers.

## Data model

Better Auth's generated Drizzle schema will provide its required identity/session tables: user, session, account, and verification. The generated definitions will be reviewed and integrated with Vane's schema and migration workflow.

Vane's `chats` table will gain a required `userId` referencing the Better Auth user ID. An index will support user-scoped chat listing and lookup. Messages remain owned indirectly through their chat, so a message cannot claim a different owner from its chat.

The existing `messages.chatId` relationship will be retained. Any additional persistent table discovered in the current application that represents user data must use the same ownership model before it is exposed through an authenticated route. Chat-embedded file metadata remains protected by the owning chat; the existing file storage mechanism is not redesigned in this release.

## Authentication and authorization behavior

### Signup and roles

- Public signup creates an email/password user through Better Auth.
- The first successful signup is promoted to `admin` using a database-safe operation that cannot produce multiple initial admins during concurrent requests.
- Subsequent signups create regular users.
- No admin UI is required, but the role is persisted for future administrative features.

### Session behavior

- Successful signup and login create persistent Better Auth sessions.
- Sessions use secure, HTTP-only cookies in production.
- Logout invalidates the current session.
- Password hashing and credential handling remain entirely inside Better Auth.

### Request behavior

- Unauthenticated page requests redirect to `/login`.
- Unauthenticated API requests return HTTP `401`.
- Auth endpoints remain accessible without an application session.
- Every protected database operation resolves the session server-side and scopes the query to `session.user.id`.
- A resource ID alone is never sufficient authorization.
- User A must not be able to list, read, delete, or mutate User B's chats, messages, or chat file metadata by changing request parameters.
- The documented Search API is protected along with the rest of the API surface.

## Configuration and operations

The deployment requires these externally supplied values:

- `DATABASE_URL`: dedicated Vane PostgreSQL connection string
- `BETTER_AUTH_SECRET`: deployment-specific strong session/signing secret
- `BETTER_AUTH_URL`: canonical Vane URL

Secrets must not be committed, baked into the image, logged, or collected/displayed by the setup wizard. The existing Docker deployment will not provision a database service because PostgreSQL is already provided externally.

The SQLite volume will not be deleted automatically. After PostgreSQL is verified, the old data remains untouched unless the operator separately removes it.

Startup must fail clearly when `DATABASE_URL` is absent or invalid, and must not report a healthy application against a partially initialized schema. PostgreSQL migrations must be idempotent. Migration failures must identify the failing migration and prevent a false-success deployment.

No normal startup or deployment path may run destructive volume/database reset commands.

## Migration strategy

This is a clean PostgreSQL initialization, not a data migration:

1. Replace the SQLite Drizzle driver and dialect with PostgreSQL.
2. Convert Vane's schema definitions to PostgreSQL-compatible definitions.
3. Generate the Better Auth schema through the supported Better Auth/Drizzle workflow.
4. Integrate Vane and Better Auth schema definitions into the migration set.
5. Apply the initial migration to the dedicated Vane database.
6. Remove SQLite-specific startup assumptions.
7. Verify repeated startup against the initialized database.

The old SQLite database is not read or transformed, because preservation of existing data was explicitly declined.

## Testing and acceptance criteria

### Schema and startup

- A fresh dedicated PostgreSQL database accepts the generated migration.
- The application builds with the PostgreSQL driver and Better Auth dependencies.
- Re-running migrations/startup is safe and produces no duplicate schema failure.
- Missing or invalid required configuration produces a clear startup error.

### Authentication

- A visitor can create an account with email/password.
- The first account receives the admin role.
- A second account does not receive the admin role.
- A user can log in, reload the page with the session retained, and log out.
- Invalid credentials are rejected without sensitive account disclosure.

### Authorization

- Anonymous page requests are redirected to login.
- Anonymous API requests return `401`.
- An authenticated user can create, list, load, and delete their own chats.
- User A cannot read, delete, or mutate User B's chat by supplying User B's chat ID.
- Messages and persisted chat file metadata follow chat ownership.
- Authenticated search/chat API flows continue to work for the owning user.

### Real application verification

Run the production build and exercise the deployed application through the real UI:

```text
signup -> authenticated shell -> create chat -> reload -> reopen chat -> logout
```

Verify that PostgreSQL contains the expected user, session, chat, message, and ownership records without exposing secret values in logs or read-back output.

## Explicitly out of scope

- Preserving or importing existing SQLite data
- Email verification
- Password reset or recovery email
- Social login/OAuth
- Admin dashboard or user-management UI
- ChromaDB integration
- Convex integration
- Replacing Vane's existing file storage implementation
- A new standalone rate-limiting subsystem

If rate limiting is absent from the current stack, that limitation must be documented rather than addressed with an incomplete custom implementation in this change.
