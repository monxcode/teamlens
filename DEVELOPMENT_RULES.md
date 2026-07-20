# WorkPulse AI — Development Rules

Status: Draft v1.0
Related: `PROJECT_OVERVIEW.md`, `PRODUCT_REQUIREMENTS_DOCUMENT.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`

---

## 1. Mindset

Build like a CTO shipping a product that must survive an enterprise security review, not a demo. Every file, function, and table should look like it was written by a senior engineer who expects to still own this code in two years.

## 2. Non-Negotiable Quality Rules

- No TODOs left in committed code — if it's not done, it's not merged.
- No mock/fake/hardcoded data anywhere, including "temporary" seed data disguised as real data (use explicit, labeled seed scripts instead).
- No placeholder pages or Lorem Ipsum — every screen that ships is real or doesn't ship.
- No duplicate logic — extract to a shared service/hook/utility the moment a second use case appears.
- No inline CSS, no inline SQL (all queries through Prisma).
- No `any` type — TypeScript strict mode is on everywhere, front and back.
- Every component/service must be reusable and composable, not copy-pasted per feature.
- Accessibility (WCAG 2.1 AA) and SEO are requirements, not polish passes.
- Performance: lazy loading and code splitting are the default for route-level and heavy components; error boundaries wrap every major UI region; all async operations show loading and error states.
- Logging and structured error handling are present from the first commit of every module, not added retroactively.
- Tests are written alongside the feature, not after: unit tests for services/utilities, integration tests for API endpoints, and at least smoke-level E2E coverage for critical flows (auth, submission → approval, billing).

## 3. Folder & Module Conventions

Follow the structures defined in `SYSTEM_ARCHITECTURE.md` exactly:

- Frontend: `app/`, `components/`, `features/`, `hooks/`, `lib/`, `types/`.
- Backend: `modules/*/{controllers,services,repositories,dto,strategies}`, `common/{guards,interceptors,middlewares,filters}`, `jobs/`, `workers/`, `config/`, `lib/`, `types/`, `tests/`.
- A new feature never lives in one giant file — it is split by responsibility (controller vs. service vs. repository vs. validation schema) from the first commit.
- Cross-cutting concerns (auth guards, logging interceptors, exception filters) live in `common/`, never duplicated per module.

## 4. Coding Standards

- **TypeScript strict mode** on in both `apps/web` and `apps/api`.
- **Validation:** every external input (API body, query param, WebSocket payload) validated via Zod/class-validator DTOs before it touches a service.
- **Repository pattern:** services never call Prisma directly for anything beyond trivial reads — a repository layer owns query construction, especially tenant-scoping (`organization_id` filters) and soft-delete filtering.
- **Error handling:** services throw typed domain exceptions; a global exception filter maps them to consistent API error shapes. Never leak raw stack traces or DB errors to the client.
- **Naming:** consistent, descriptive names — no abbreviations that require tribal knowledge (`sub` for "submission" is fine in local scope, never in public APIs/types).
- **Comments:** explain *why*, not *what* — the code should already say what it does.

## 5. Security Rules (Enforced, Not Optional)

- RBAC checks happen server-side via guards on every mutating and sensitive-read endpoint — the frontend hiding a button is UX, not security.
- Every tenant-scoped query is filtered by `organization_id` at the repository layer; this is structurally enforced (base repository / Prisma middleware), not left to individual developers to remember per query.
- All secrets (API keys, OAuth secrets, encryption keys) come from environment/secret manager — never committed, never hardcoded, never logged.
- Rate limiting applied to all public-facing and auth endpoints.
- All file uploads validated for type/size server-side regardless of client-side checks.
- Audit log entries are written for every sensitive action (role change, approval, deletion, settings change, login) — this is part of the feature's definition of done, not a follow-up ticket.

## 6. Git & PR Workflow

- Trunk-based development with short-lived feature branches: `feature/<module>-<short-description>`.
- Every PR: passes lint, typecheck, and full test suite in CI before merge (GitHub Actions).
- PR description must state: what changed, why, how it was tested, and any schema/migration impact.
- Database schema changes always ship as a Prisma migration in the same PR as the code that depends on them, and `DATABASE_SCHEMA.md` is updated in the same PR.
- No direct commits to `main`; no merging with failing CI, regardless of urgency.

## 7. Build Order (Do Not Skip Ahead)

Each phase must be **fully complete** — architecture, backend, frontend, tests — before starting the next:

1. **Architecture & planning** — confirm/refresh the four foundation docs.
2. **Folder structure** — scaffold both apps per `SYSTEM_ARCHITECTURE.md`.
3. **Database schema** — Prisma schema + initial migration matching `DATABASE_SCHEMA.md`.
4. **Authentication** — JWT, refresh tokens, OAuth (GitHub, Google), RBAC guards, 2FA.
5. **Layout system** — app shell, navigation, command palette, responsive breakpoints.
6. **Design system** — theme tokens, shadcn/ui customization, shared components, skeletons, empty states.
7. **Dashboard** — real aggregate queries wired to real (even if sparse) data; no mock widgets.
8. **Projects** — CRUD, status lifecycle, members, milestones.
9. **Tasks** — full task model, views (Kanban/Calendar/Timeline/List), dependencies, templates.
10. **Work Submission** — the core feature; submission model, attachments, screenshot timeline, approval flow.
11. **AI** — scoring pipeline, summaries, provider abstraction, AI Manager query interface.
12. **GitHub Integration** — App install, sync jobs, webhook handling, task linking.
13. **Reports** — scheduled generation, PDF export, leaderboard computation.
14. **Chat** — realtime gateway, channels, presence, voice notes.
15. **Billing** — Stripe integration, plan gating, webhook reconciliation.
16. **Deployment** — Docker images, CI/CD pipelines, staging → production promotion, monitoring/alerting live before general availability.

## 8. Definition of Done (Per Feature)

A feature is done only when:

- [ ] Server-side validation and RBAC enforcement are in place.
- [ ] Tenant isolation is verified (tested against a second org).
- [ ] Loading, empty, and error states exist in the UI.
- [ ] Unit + integration tests pass in CI.
- [ ] Audit logging is emitted for sensitive actions.
- [ ] No `any` types, no TODOs, no dead code.
- [ ] Relevant doc (`PRODUCT_REQUIREMENTS_DOCUMENT.md` / `DATABASE_SCHEMA.md` / `SYSTEM_ARCHITECTURE.md`) updated if behavior or schema changed.

## 9. What "Production-Ready" Means Here

Not "it runs on my machine." It means: a new engineer can clone the repo, follow `SYSTEM_ARCHITECTURE.md`, and understand the system without tribal knowledge; a security reviewer can trace RBAC and audit coverage end-to-end; and an operator can deploy, monitor, and roll back without guessing.