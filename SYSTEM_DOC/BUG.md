# TeamLens Bug Report

> **Audit Date:** 2026-07-22
> **Scope:** Full codebase review — security, API, code quality, UI/UX, database, configuration
> **Total Issues:** 34

---

## Table of Contents

1. [Security](#security)
2. [API](#api)
3. [Code Quality](#code-quality)
4. [UI/UX](#uiux)
5. [Database / Infrastructure](#database--infrastructure)
6. [Configuration](#configuration)

---

## Security

### S-1 [CRITICAL] Hardcoded JWT fallback secret

| Field | Value |
|-------|-------|
| **File** | `src/lib/auth.ts:4` |
| **Severity** | Critical |

**Description:** The JWT secret falls back to a hardcoded string `"pulse-jwt-secret-fallback"` when `JWT_SECRET` environment variable is not set.

```typescript
const JWT_SECRET = process.env.JWT_SECRET || "pulse-jwt-secret-fallback";
```

**Why it is a problem:** Any attacker who knows this fallback string (anyone with access to the source code) can forge valid JWT tokens for any user ID, including `super_admin`. In production, a missing env var would silently degrade to an easily guessable secret with no warning.

**Steps to reproduce:** Set up the app without `JWT_SECRET` env var; decode the fallback string and craft a JWT for any user identity.

**Suggested fix:** Fail hard at startup if `JWT_SECRET` is not set (throw or `process.exit(1)`). Generate a strong random secret and document it in `.env.example`.

---

### S-2 [CRITICAL] Hardcoded admin password in seed script

| Field | Value |
|-------|-------|
| **File** | `prisma/seed.ts:232` |
| **Severity** | Critical |

**Description:** The seed script creates a super admin with password `"password123"`.

```typescript
password: await hashPassword("password123"),
```

**Why it is a problem:** While intended for development/bootstrap, this is an extremely weak password. If the seed is accidentally run against a production database or committed to a public repo, the super admin account is immediately compromisable.

**Steps to reproduce:** Run `npx prisma db seed` and log in as the super admin with password `password123`.

**Suggested fix:** Generate a strong random password during seed and print it to stdout. Add a `.env`-based override for the seed admin password.

---

### S-3 [HIGH] JWT tokens stored in `localStorage` — XSS exposure

| Field | Value |
|-------|-------|
| **Files** | `src/stores/auth-store.ts` (entire file), `src/hooks/use-polling.ts:81`, all pages reading `localStorage.getItem("pulse_token")` |
| **Severity** | High |

**Description:** The JWT token is stored in `localStorage` under the key `pulse_token`. It is read on every API call and passed as a `Bearer` token in the `Authorization` header. No HttpOnly, Secure, or SameSite cookies are used.

**Why it is a problem:** `localStorage` is accessible to any JavaScript running in the same origin. A single XSS vulnerability anywhere in the application (a reflected XSS, a compromised dependency, a malicious avatar upload, etc.) would allow an attacker to exfiltrate the token and impersonate the user indefinitely.

**Suggested fix:** Migrate to HttpOnly, Secure, SameSite=Strict cookies for the JWT. Use a CSRF token pattern if needed for non-GET requests. Remove `localStorage`-based token storage entirely.

---

### S-4 [HIGH] Missing permission check on admin announcements GET endpoint

| Field | Value |
|-------|-------|
| **File** | `src/app/api/admin/announcements/route.ts:6-21` |
| **Severity** | High |

**Description:** The `GET` handler checks authentication (`getUserFromRequest`) but does **not** call `hasPermission(payload.userId, "system:announcements")` before returning all announcements. The `POST` handler correctly performs the check (line 28-29).

**Why it is a problem:** Any authenticated user (including ordinary `member` users) can list all system announcements via the admin API endpoint. While announcements may be low-sensitivity, this bypasses the RBAC layer and contradicts the protection on the POST handler.

**Steps to reproduce:** Call `GET /api/admin/announcements` with a member user's token.

**Suggested fix:** Add the missing `hasPermission` check to the GET handler, matching the POST handler.

---

### S-5 [HIGH] No workspace scoping on user-facing projects/tasks/activities endpoints

| Field | Value |
|-------|-------|
| **Files** | `src/app/api/projects/route.ts:5-34` (GET), `src/app/api/tasks/route.ts:5-29` (GET), `src/app/api/activities/route.ts:4-27` (GET) |
| **Severity** | High |

**Description:** The GET handlers for projects, tasks, and activities authenticate the user but do **not** filter results by the user's workspace membership. They return **all** records across all workspaces.

**Why it is a problem:** A user in Workspace A can see projects, tasks, and activities belonging to Workspace B. This is a cross-tenant data leak.

**Steps to reproduce:** Log in as a member user and call `GET /api/projects`; observe that projects from other workspaces are included.

**Suggested fix:** Determine the user's workspace(s) from `workspaceMember` table and scope queries with a `workspaceId` filter.

---

### S-6 [HIGH] Task PATCH accepts arbitrary body fields without schema validation

| Field | Value |
|-------|-------|
| **File** | `src/app/api/tasks/[id]/route.ts:15-19` |
| **Severity** | High |

**Description:** The `PATCH` handler spreads the entire request body directly into the Prisma `update` call:

```typescript
const body = await request.json();
const task = await db.task.update({
  where: { id },
  data: body, // <-- no validation or field filtering
  ...
});
```

**Why it is a problem:** Any authenticated user can update **any** field on **any** task, including relational fields (`assigneeId`, `projectId`) and potentially fields that should be restricted. There is no ownership/permission check on the task being modified. Combined with S-5 (no workspace scoping), this allows a user to modify tasks across the entire system arbitrarily.

**Steps to reproduce:** Send a `PATCH /api/tasks/{id}` with `{ "assigneeId": "attacker-chosen-id", "projectId": "other-project" }` using a regular member user's token.

**Suggested fix:** Use a Zod schema (or similar) to whitelist the allowed updatable fields. Add an ownership/permission check before allowing the update.

---

### S-7 [HIGH] Change-password endpoint uses manual validation instead of Zod schema

| Field | Value |
|-------|-------|
| **File** | `src/app/api/auth/change-password/route.ts:12-34` |
| **Severity** | High |

**Description:** The change-password endpoint performs manual field checks (if statements) instead of using a Zod schema. It validates the password length but does not enforce other constraints (special characters, uppercase, etc.) that may be required.

**Why it is a problem:** Manual validation is error-prone, inconsistent with the rest of the API which uses Zod schemas, and makes it harder to maintain password policies centrally. Missing `newPassword` complexity validation weakens security.

**Suggested fix:** Create and use a `changePasswordSchema` in `validations.ts`.

---

### S-8 [MEDIUM] Rate limiting defined but never imported or used

| Field | Value |
|-------|-------|
| **File** | `src/lib/security.ts:5-51` |
| **Severity** | Medium |

**Description:** The `checkRateLimit` function is defined in `security.ts` but is not imported or called by any route handler, including the login endpoint.

**Why it is a problem:** There is no IP-based rate limiting anywhere in the application. While account locking exists (after 5 failed attempts per user), there is no protection against distributed brute-force attacks across different user accounts from the same IP, or against DoS on authentication endpoints.

**Suggested fix:** Integrate `checkRateLimit` into at least the login and registration endpoints.

---

### S-9 [MEDIUM] Empty `userId` recorded in login history for unknown-user login attempts

| Field | Value |
|-------|-------|
| **Files** | `src/app/api/auth/login/route.ts:27`, `src/lib/security.ts:66` |
| **Severity** | Medium |

**Description:** When a login attempt fails because the email does not match any user, `recordLoginAttempt` is called without a `userId`. Inside `recordLoginAttempt`, `userId` is stored as `""` (empty string) in the `loginHistory` table:

```typescript
userId: userId || "",
```

**Why it is a problem:** This creates a `loginHistory` record with a broken foreign key reference (empty string rather than a valid user ID or `null`). It adds noise to audit queries and may cause issues if the `userId` column has referential integrity constraints.

**Suggested fix:** Store `null` instead of `""` when the user is not found. Consider whether login attempts for unknown emails need to be tracked separately.

---

### S-10 [MEDIUM] Admin members DELETE endpoint uses query params instead of route params

| Field | Value |
|-------|-------|
| **File** | `src/app/api/admin/projects/[id]/members/route.ts:77-79` |
| **Severity** | Medium |

**Description:** The endpoint is at `/api/admin/projects/[id]/members` but the DELETE handler reads `projectId` and `userId` from query/search parameters instead of from the URL path:

```typescript
const projectId = searchParams.get("projectId");
const userId = searchParams.get("userId");
```

The route `[id]` parameter is never used.

**Why it is a problem:** The route pattern strongly implies that `[id]` is the project ID, making the API inconsistent. Consumers might pass the project ID in the URL path and omit the query parameter, resulting in silent failures.

**Suggested fix:** Read the project ID from `params.id` and accept only the member/user ID as a query parameter or in the request body.

---

### S-11 [MEDIUM] Admin audit log query can return false positives

| Field | Value |
|-------|-------|
| **File** | `src/app/api/admin/teams/[id]/route.ts:100` |
| **Severity** | Medium |

**Description:** The team details endpoint queries audit logs with:

```typescript
{ resourceId: { in: memberUserIds } }
```

This searches for audit logs where `resourceId` matches any team member's user ID — but `resourceId` is a generic identifier and could match logs for any resource type (tasks, projects, etc.).

**Why it is a problem:** The query may return audit logs that are completely unrelated to the team or its members, polluting the team's audit trail.

**Suggested fix:** Scope the query to `resource: "team"` or `resource: "user"` combined with the relevant resource IDs.

---

## API

### A-1 [MEDIUM] No pagination limits on tasks and projects endpoints

| Field | Value |
|-------|-------|
| **Files** | `src/app/api/tasks/route.ts:22`, `src/app/api/projects/route.ts:12` |
| **Severity** | Medium |

**Description:** The GET endpoints for tasks and projects call `findMany()` with no `take` limit. The activities endpoint (A-2) has `take: 50`, but tasks and projects return everything.

**Why it is a problem:** A workspace with thousands of tasks or projects will cause large payloads, excessive memory usage, and slow responses. This is both a performance and a DoS concern.

**Suggested fix:** Add `take` and `skip` parameters with a reasonable default (e.g., 50-100).

---

### A-2 [LOW] Inconsistent error response formats across endpoints

| Field | Value |
|-------|-------|
| **Files** | Multiple API route files |
| **Severity** | Low |

**Description:** Most endpoints return errors as `{ error: "message" }`, but some admin endpoints may use different shapes. For example, `src/app/api/auth/register/route.ts:48` uses `{ error: result.error.issues[0].message }` while Zod's default format provides richer detail.

**Why it is a problem:** Inconsistent error shapes make client-side error handling fragile. Consumers cannot rely on a uniform error contract.

**Suggested fix:** Adopt a standard error response envelope across all endpoints (e.g., `{ error: { code: string, message: string, details?: any } }`).

---

### A-3 [LOW] `changePassword` endpoint clears RBAC cache unnecessarily

| Field | Value |
|-------|-------|
| **File** | `src/app/api/auth/change-password/route.ts:60` |
| **Severity** | Low |

**Description:** After changing the password, the handler calls `clearPermissionCache(payload.userId)`. Password changes do not affect permissions.

**Why it is a problem:** This is either unnecessary work (cache miss + refetch) or indicates confusion about what the cache stores. It suggests that the RBAC cache keyed by userId may be invalidated on unrelated user updates, leading to performance churn.

**Suggested fix:** Remove the `clearPermissionCache` call from the change-password flow, or rename/move it if it truly serves a different purpose.

---

## Code Quality

### CQ-1 [MEDIUM] Settings page does not persist changes

| Field | Value |
|-------|-------|
| **File** | `src/app/dashboard/settings/page.tsx:20-23` |
| **Severity** | Medium |

**Description:** The `handleSave` function in the settings page only shows a "Saved!" flash message but never sends the updated `name` or `email` to the server:

```typescript
function handleSave() {
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
}
```

The password fields and "Delete Account" button are also non-functional.

**Why it is a problem:** The UI suggests that profile information is being saved, but changes are silently discarded. Users may think their name or email has been updated when it has not. The settings page is effectively a mock-up.

**Steps to reproduce:** Change the name in the settings page and click "Save Changes". The "Saved!" message appears, but on page reload the original name is restored.

**Suggested fix:** Implement API calls to persist name/email changes and password updates. Remove mock UI or add "Coming Soon" placeholders for unimplemented features.

---

### CQ-2 [MEDIUM] Modal `onClose` callback passes incorrect state value

| Field | Value |
|-------|-------|
| **File** | `src/app/dashboard/tasks/page.tsx:328` |
| **Severity** | Medium |

**Description:** The "New Task" modal's `onClose` callback is incorrectly set to open the modal instead of closing it:

```typescript
onClose={() => setShowModal(true)}
```

**Why it is a problem:** Clicking the backdrop overlay or the close button on the New Task modal re-opens the same modal. The modal becomes impossible to dismiss via normal UX (backdrop click, close button), forcing a full page reload or navigation.

**Steps to reproduce:** Open the New Task modal on the tasks dashboard page, then click the backdrop or close button. The modal closes and immediately re-opens.

**Suggested fix:** Change to `onClose={() => setShowModal(false)}`.

---

### CQ-3 [MEDIUM] Workspace creation failure leaves user in orphaned state

| Field | Value |
|-------|-------|
| **File** | `src/app/api/auth/register/route.ts:39-66` |
| **Severity** | Medium |

**Description:** During registration, the user is created first (line 39-48, committed to DB), then the workspace is created (line 58-66). If workspace creation fails, the catch block returns a 500 error, but the user already exists in the database with no workspace. The user cannot retry because the email is now taken.

**Why it is a problem:** Orphaned users with no workspace cannot use the application and cannot re-register. This requires manual database cleanup.

**Suggested fix:** Wrap the user + workspace creation in a Prisma transaction (`$transaction`). If either fails, both roll back.

---

### CQ-4 [LOW] `getInitials` can return empty string

| Field | Value |
|-------|-------|
| **File** | `src/lib/utils.ts:32-39` |
| **Severity** | Low |

**Description:** If `name` is an empty string, `name.split(" ")` returns `[""]`, and `n[0]` on each element yields `""`, resulting in `getInitials("")` returning `""`.

**Why it is a problem:** Components that display initials (Avatar, etc.) may render an empty string instead of a fallback character. An avatar with empty initials may appear broken.

**Steps to reproduce:** Render `Avatar` with `name=""`.

**Suggested fix:** Add a guard at the top of `getInitials`: `if (!name || name.trim().length === 0) return "?";` or similar.

---

### CQ-5 [LOW] Unused imports

| Field | Value |
|-------|-------|
| **Files** | `src/app/dashboard/tasks/page.tsx:24,27`, `src/app/admin/users/page.tsx:16` |
| **Severity** | Low |

**Description:** Several icons are imported but never used in JSX:

- `Filter` and `SlidersHorizontal` in tasks page
- `UserPlus` and `FolderPlus` in admin users page

**Why it is a problem:** Unused imports increase bundle size and clutter the codebase.

**Suggested fix:** Remove unused imports.

---

### CQ-6 [LOW] Cache-busting strategy uses the URL itself as the version

| Field | Value |
|-------|-------|
| **File** | `src/components/ui/avatar.tsx:55` |
| **Severity** | Low |

**Description:** The cache-busting query string parameter is the URL itself:

```typescript
const cacheBustedSrc = src ? `${src}?v=${encodeURIComponent(src)}` : undefined;
```

If the avatar URL at that `src` changes (e.g., user uploads a new avatar that overwrites the old file), the `v` parameter stays identical because it is derived from the same URL.

**Why it is a problem:** The browser may cache the old avatar because the cache key hasn't changed. The intended purpose of cache busting is defeated.

**Suggested fix:** Use a timestamp (e.g., `Date.now()` or the `avatarUploadedAt` stored in the database) as the version parameter.

---

### CQ-7 [LOW] Unnecessary `"use client"` directives on server-compatible components

| Field | Value |
|-------|-------|
| **Files** | `src/components/ui/badge.tsx`, `src/components/ui/card.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/empty-state.tsx` |
| **Severity** | Low |

**Description:** These components do not use any React hooks, event handlers, state, or browser APIs. They are purely presentational and could be server components, but are marked `"use client"`.

**Why it is a problem:** Each `"use client"` component adds to the client-side JavaScript bundle, increases the RSC boundary, and prevents server-side rendering optimizations.

**Suggested fix:** Remove `"use client"` from these components. If a forwarded ref (`forwardRef`) is needed, evaluate whether it is truly used by parent client components.

---

### CQ-8 [LOW] Inline skeleton loading UI instead of using the `Skeleton` component

| Field | Value |
|-------|-------|
| **File** | `src/app/dashboard/projects/page.tsx:135`, `src/app/dashboard/projects/[id]/page.tsx:134-138` |
| **Severity** | Low |

**Description:** The `Skeleton` component is imported in `projects/page.tsx` (line 12) but the loading state uses inline `animate-pulse bg-muted` divs directly instead of `<Skeleton>`.

**Why it is a problem:** Inconsistent loading UI patterns across the app. The `Skeleton` component provides a reusable, themed placeholder, but inline alternatives bypass it.

**Suggested fix:** Replace inline `animate-pulse bg-muted` divs with the `Skeleton` component.

---

### CQ-9 [LOW] `setShowTaskModal` is named as a setter but acts as a toggle

| Field | Value |
|-------|-------|
| **File** | `src/app/dashboard/tasks/page.tsx:154-159` |
| **Severity** | Low |

**Description:** The function is named `setShowTaskModal` (conventionally a setter that takes a value), but it acts as a toggle:

```typescript
function setShowTaskModal() {
  setShowModal(!showModal);
  ...
}
```

**Why it is a problem:** Misleading naming. A developer expecting `setShowTaskModal(false)` behavior will be surprised. The function also uses `showModal` captured in closure which may be stale.

**Suggested fix:** Rename to `toggleShowTaskModal` or make it a proper setter.

---

### CQ-10 [LOW] Unused `glass` prop on `Card` component

| Field | Value |
|-------|-------|
| **File** | `src/components/ui/card.tsx:8` |
| **Severity** | Low |

**Description:** The `Card` component defines a `glass?: boolean` prop (line 8) and applies it to the class list (line 19: `glass && "glass"`), but no CSS class `glass` is defined in the global styles or Tailwind config. No consumer passes `glass` anywhere in the codebase.

**Why it is a problem:** Dead code. If the class is intended, it should be defined. If not, the prop should be removed.

**Suggested fix:** Either define the `glass` CSS class or remove the prop.

---

### CQ-11 [LOW] ProgressRing `radius` can be negative

| Field | Value |
|-------|-------|
| **File** | `src/components/dashboard/progress-ring.tsx:24` |
| **Severity** | Low |

**Description:** The radius is calculated as `(size - strokeWidth) / 2`. If `strokeWidth > size`, the radius becomes negative.

**Why it is a problem:** A negative `r` attribute on an SVG circle will produce a rendering error (the element may not render at all, or throw a DOMException).

**Steps to reproduce:** Render `<ProgressRing size={10} strokeWidth={20} />`.

**Suggested fix:** Clamp `radius` to a minimum of 0:

```typescript
const radius = Math.max(0, (size - strokeWidth) / 2);
```

---

### CQ-12 [LOW] Toggle hover style applied regardless of checked state

| Field | Value |
|-------|-------|
| **File** | `src/components/ui/toggle.tsx:93` |
| **Severity** | Low |

**Description:** The hover style `hover:bg-primary/80` is applied to the track unconditionally when not disabled (line 93). This means the hover effect shows even when the toggle is unchecked (off state), where one would expect a muted hover.

```typescript
!disabled && "hover:bg-primary/80"
```

**Why it is a problem:** Visual inconsistency. An unchecked toggle should not show a primary-color hover effect, as that implies it is already in an "on" state.

**Suggested fix:** Change to `controlledChecked && !disabled && "hover:bg-primary/80"`.

---

### CQ-13 [LOW] Inconsistent file naming convention

| Field | Value |
|-------|-------|
| **Files** | Multiple — e.g., `ProjectColor.tsx`, `StatCard.tsx` vs. `progress-ring.tsx`, `auth-store.ts` |
| **Severity** | Low |

**Description:** Some files use `PascalCase` (`ProjectColor.tsx`, `StatCard.tsx`) while most use `kebab-case` (`progress-ring.tsx`, `avatar-upload.tsx`, `auth-store.ts`).

**Why it is a problem:** Inconsistent naming makes the codebase harder to navigate and violates the implicit convention of the majority of files.

**Suggested fix:** Adopt a single convention (recommended: `kebab-case` for files, `PascalCase` for components inside files).

---

### CQ-14 [LOW] Missing error handling for fetch calls in admin pages

| Field | Value |
|-------|-------|
| **File** | `src/app/admin/users/page.tsx:52-76` |
| **Severity** | Low |

**Description:** The `fetchUsers`, `fetchRoles`, and `fetchTeams` functions do not wrap fetch calls in try/catch. A network error will result in an uncaught promise rejection.

**Why it is a problem:** Unhandled promise rejections can crash the page or leave the UI in a loading state indefinitely.

**Suggested fix:** Add try/catch blocks to all fetch calls and set appropriate error state for the UI.

---

### CQ-15 [LOW] Polling interval not cleared on unmount in projects page

| Field | Value |
|-------|-------|
| **File** | `src/app/dashboard/projects/page.tsx:55-59` |
| **Severity** | Low |

**Description:** The polling interval is cleared on unmount, but the `fetchProjects` callback inside it may call `setProjects` and `setLoading` on an unmounted component.

**Why it is a problem:** While the interval itself is cleaned up, the initial `fetchProjects()` in the effect and the callbacks inside the interval may trigger React state updates on unmounted components (React will warn in development).

**Suggested fix:** Use an `AbortController` or a `useRef` mounted flag to prevent state updates after unmount. Or use the existing `usePolling` hook which handles this more robustly.

---

## UI / UX

### UX-1 [LOW] Password fields in settings page are not connected to functionality

| Field | Value |
|-------|-------|
| **File** | `src/app/dashboard/settings/page.tsx:141-153` |
| **Severity** | Low |

**Description:** The "Security" section of the settings page renders password input fields and an "Update Password" button, but no `onChange` handlers or `onClick` handler are connected. The inputs are uncontrolled and the button does nothing.

**Why it is a problem:** Users expect to be able to change their password from this UI. The placeholder-like implementation is misleading.

**Suggested fix:** Hook up the password fields to state and implement the change-password API call.

---

### UX-2 [LOW] No loading state for "Create User" submit button in admin page

| Field | Value |
|-------|-------|
| **File** | `src/app/admin/users/page.tsx:316-318` |
| **Severity** | Low |

**Description:** The "Create User" button shows a spinner during creation (`creating` state), but the form fields remain editable and the close button is not disabled. A user could double-submit or close the modal during creation.

**Why it is a problem:** Double-submission may create duplicate users (race condition if the first request is still in-flight).

**Suggested fix:** Disable form inputs and the close button during submission, or close the modal only after successful response.

---

## Database / Infrastructure

### D-1 [MEDIUM] SQLite in Prisma schema — unsuitable for production

| Field | Value |
|-------|-------|
| **File** | `prisma/schema.prisma` (provider) |
| **Severity** | Medium |

**Description:** The Prisma schema uses `provider = "sqlite"`. SQLite does not support concurrent writes, row-level locking, connection pooling, or the full Prisma feature set (enums, `createMany` in some cases, etc.).

**Why it is a problem:** In a multi-user web application, concurrent writes will cause `SQLITE_BUSY` errors. SQLite also lacks user management, encryption at rest, and proper access controls. It is not suitable for production deployments.

**Suggested fix:** Migrate to PostgreSQL (recommended) or MySQL. Provide a migration path in the documentation.

---

### D-2 [MEDIUM] Dockerfile references non-existent `src/generated` directory

| Field | Value |
|-------|-------|
| **File** | `Dockerfile:25` |
| **Severity** | Medium |

**Description:** The Dockerfile contains:

```dockerfile
COPY --from=builder /app/src/generated ./src/generated
```

No `src/generated` directory exists in the project. Prisma generates its client to `node_modules/.prisma/client` by default.

**Why it is a problem:** The Docker build will fail at this step because the source directory does not exist.

**Steps to reproduce:** Run `docker build .` with this Dockerfile.

**Suggested fix:** Remove the `COPY` line for `src/generated`, or create the directory and configure Prisma to generate output there if that was the intent.

---

### D-3 [MEDIUM] Avatar `Cache-Control` prevents effective caching while forcing revalidation

| Field | Value |
|-------|-------|
| **File** | `next.config.ts:12-19` |
| **Severity** | Medium |

**Description:** Avatar cache headers are configured as:

```typescript
{
  key: "Cache-Control",
  value: "public, max-age=0, must-revalidate",
}
```

`max-age=0` with `must-revalidate` forces the browser to revalidate with the server on every request. This effectively disables caching for all avatar images.

**Why it is a problem:** Avatars will be re-fetched on every page load or even on every re-render, consuming bandwidth and increasing server load. Avatars are typically immutable per URL (a new upload gets a new filename), so they can safely be cached for extended periods.

**Suggested fix:** Use a longer `max-age` (e.g., `max-age=31536000, immutable`) and rely on changing URLs when avatars are updated.

---

### D-4 [LOW] `avatarFileName` stores the original user-provided filename

| Field | Value |
|-------|-------|
| **File** | `src/app/api/user/avatar/route.ts:111` |
| **Severity** | Low |

**Description:** When saving an avatar, the original user-provided filename is stored in the database as `avatarFileName`. This filename is never sanitized beyond extension extraction.

**Why it is a problem:** The filename could contain special characters, path traversal sequences (though not used for filesystem operations), or non-UTF8 characters. While the actual file is saved with a safe generated name, the stored filename is unsanitized.

**Suggested fix:** Sanitize or truncate the stored filename. Alternatively, consider not storing the original filename at all.

---

## Configuration

### CF-1 [LOW] No `.env.example` includes all required variables

| Field | Value |
|-------|-------|
| **File** | `.env.example` (if it exists) or missing documentation |
| **Severity** | Low |

**Description:** The codebase references `JWT_SECRET` and `DATABASE_URL` as environment variables but does not provide a complete `.env.example`.

**Why it is a problem:** New developers setting up the project may miss critical configuration, leading to the hardcoded fallback secret being used (see S-1).

**Suggested fix:** Create or update `.env.example` with all required environment variables and descriptions.

---

### CF-2 [LOW] No ESLint warnings treated as errors in production builds

| Field | Value |
|-------|-------|
| **File** | `next.config.ts` / `eslint.config.mjs` |
| **Severity** | Low |

**Description:** The Next.js config does not set `eslint.ignoreDuringBuilds: false` (the default allows ESLint warnings to pass), and the ESLint config may not be strict enough to catch unused imports and other issues at build time.

**Why it is a problem:** Issues like unused imports, unhandled promises, and other code quality problems will not block a build.

**Suggested fix:** Enable `eslint.ignoreDuringBuilds: false` and consider using stricter rules.

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High     | 5 |
| Medium   | 12 |
| Low      | 15 |
| **Total** | **34** |

---

## Summary by Category

| Category | Count |
|----------|-------|
| Security | 11 |
| API | 3 |
| Code Quality | 15 |
| UI / UX | 2 |
| Database / Infrastructure | 4 |
| Configuration | 2 |
