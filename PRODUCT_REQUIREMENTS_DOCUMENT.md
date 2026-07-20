# WorkPulse AI — Product Requirements Document (PRD)

Status: Draft v1.0
Owner: Product / Engineering
Related: `PROJECT_OVERVIEW.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`

---

## 1. Purpose & Scope

Define the functional and non-functional requirements for WorkPulse AI, an AI-powered work intelligence SaaS platform. This PRD is the source of truth for what must be built; `SYSTEM_ARCHITECTURE.md` defines how, and `DATABASE_SCHEMA.md` defines the data model.

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Replace manual status-checking | ≥ 80% of active tasks have at least one linked Work Submission |
| Make productivity measurable | AI score generated for 100% of submissions within 60s of submission |
| Reduce reporting overhead | Automated reports replace ≥ 90% of manually-written status reports |
| Drive daily engagement | ≥ 70% of active members submit work or check dashboard daily |
| Enterprise readiness | Zero cross-tenant data leaks; SOC2-aligned audit trail from v1 |

## 3. User Roles & Permissions (RBAC)

| Role | Scope | Key Permissions |
|---|---|---|
| Super Admin | Platform-wide | Manage all organizations, billing, feature flags, system health |
| Organization Owner | Org | Full control of org, billing, roles, deletion |
| Admin | Org | Manage members, projects, settings (not billing/deletion) |
| Project Manager | Project(s) | Create/manage projects, tasks, approvals, reports |
| Team Lead | Team | Manage team members, review submissions, assign tasks |
| Developer / QA / Designer | Assigned work | Create tasks, submit work, comment, chat |
| Client | Project (read-mostly) | View project progress, reports, approve/request changes on submissions |
| Viewer | Org/Project | Read-only access |

Permissions are granular per-resource (project, task, submission, report) and enforced server-side (see Architecture doc).

## 4. Functional Requirements by Module

### 4.1 Workspaces & Organizations
- An organization contains multiple teams, departments, projects, and members.
- Full data isolation between organizations (multi-tenant).
- Org has branding (logo, colors), billing plan, and settings.

### 4.2 Authentication & Identity
- Email/password with JWT access + refresh tokens.
- OAuth: GitHub, Google.
- 2FA (TOTP) optional per-user, enforceable per-org policy.
- Device/session management (view + revoke active sessions).
- Invite-based onboarding with role pre-assignment.

### 4.3 Dashboard
- Org-level and project-level analytics: weekly/monthly productivity, task counts, work hours, today's submissions, pending approvals, review queue.
- Widgets: activity feed, top/low performers, upcoming deadlines, calendar, recent commits, recent uploads, recent screenshots, notifications.
- Skeleton loading states; empty states for new orgs with zero data (no mock data — genuine "get started" prompts).

### 4.4 Projects
- CRUD projects with status: Planning, Active, Paused, Completed, Archived.
- Each project contains: members, tasks, files, discussions, timeline, reports, activity log, milestones.
- Project-level role assignment (a member's org role can differ from their project role).

### 4.5 Tasks
- Task, subtask, checklist items.
- Priority, deadline, assignee(s), labels, attachments, dependencies (blocks/blocked-by).
- Comments, activity history, version history.
- Recurring tasks, task templates.
- Views: Kanban, Calendar, Timeline (Gantt-style), List.

### 4.6 Work Submission (Core Feature)
- Any task (or standalone work item) can have one or more Work Submissions.
- Submission fields: title, description, hours worked, GitHub link, live demo URL, deployment URL, screenshot(s), screen recording, ZIP, APK, design file, documents, video, notes, blockers, next plan.
- All submission content is indexed for global search.
- Submissions are versioned; edits after submission are tracked in history.

### 4.7 AI Work Analysis
- On submission, an async job computes: Work Quality, Complexity, Estimated Effort, Risk, Documentation Quality, Communication Quality, Code Quality (when code is linked), Overall Score.
- AI generates four summary variants per submission: Professional, Manager, Client, Technical.
- Scores and summaries are re-computable (e.g., after a "Need Changes" revision).
- All AI outputs are stored (not just displayed) for historical reporting and auditability.

### 4.8 GitHub Integration
- OAuth connection per-user and per-org (org-level GitHub App preferred for repo access).
- Auto-fetch: repositories, commits, branches, PRs, reviews, merged PRs, files changed, lines added/deleted, commit frequency, contribution graph.
- Commits/PRs can be linked to tasks/submissions automatically (via branch naming or manual link) or manually.
- No manual upload required for GitHub-sourced evidence.

### 4.9 Screenshot Timeline
- Submissions may include a chronological screenshot sequence: Before / Progress / Final.
- Manager-facing compare view (side-by-side / slider).

### 4.10 Team Feed
- Realtime, chronological activity feed per project/org ("X submitted Y", "Z approved").
- Filterable by project, member, activity type.

### 4.11 Approval Flow
- States: Draft → Submitted → In Review → Approved / Need Changes / Rejected → Completed.
- State transitions require permission and are fully audit-logged (actor, timestamp, reason/comment).
- Configurable approval chains per project (single approver vs. multi-step).

### 4.12 Comments
- Rich text, @mentions, attachments, emoji reactions, code snippets (syntax highlighted), threaded replies.
- Available on tasks, submissions, and projects.

### 4.13 Chat
- Realtime messaging: organization-wide, project, task-scoped, and private 1:1.
- Typing indicators, seen/read receipts, file sharing, voice notes.

### 4.14 AI Reports
- Automated generation: Daily, Weekly, Monthly, Quarterly.
- Reports summarize submissions, scores, approvals, blockers, and trends per member/team/project.
- Exportable (PDF); schedulable delivery (email/Slack/Discord).

### 4.15 Leaderboard
- Categories: Top Contributors, Most Helpful (reviews/comments), Fastest (turnaround), Highest Quality (AI score), Best Reviewer, Longest Streak (consecutive active days).
- Time-windowed (weekly/monthly/all-time) and scoped to team/org.

### 4.16 Productivity Analytics
- Heatmaps (activity by day/hour), burndown, velocity, completion rate, average work hours, approval time, review time, average delay vs. deadline.

### 4.17 Attendance
- Clock in/out, break tracking.
- Idle time, active time, focus time (derived from activity signals, not keystroke capture) — opt-in and disclosed to members.

### 4.18 Audit Log
- Immutable log of: login/logout, task edits/deletes, submissions, approvals, role changes, settings changes.
- Filterable, exportable, retained per org's plan (see Billing).

### 4.19 Notifications
- Channels: in-app (realtime), email, push, Slack, Discord.
- Per-user notification preferences per event type.

### 4.20 Global Search
- Cross-entity search: projects, members, tasks, files, commits, messages, reports.
- Debounced, permission-scoped results, keyboard-driven (Command Palette, `⌘K`).

### 4.21 Files
- Upload, preview (images, PDFs, video, code), versioning, folders, tags, search.
- Virus/type validation on upload.

### 4.22 Security
- RBAC, JWT + refresh rotation, rate limiting, CSRF protection, XSS/SQLi protection (parameterized queries via Prisma), audit logs, encryption at rest/in transit, 2FA, device session management.

### 4.23 Settings
- Organization profile, billing, branding/theme, email (SMTP/provider), storage provider config, notification defaults, security policy (2FA enforcement, session timeout), API keys, webhooks.

### 4.24 AI Manager (Conversational Analytics)
- Natural-language query interface for managers, e.g.:
  - "Who worked least today?"
  - "Which project is delayed?"
  - "Generate this week's client report."
- Answers are grounded in the org's actual data (tasks, submissions, scores, attendance) — no hallucinated figures; the system must cite the underlying records.
- Output can be inline chat answer, chart, or generated PDF report depending on query type.

### 4.25 Billing & Pricing
- Plans: Free, Starter, Pro, Enterprise.
- Stripe subscription billing, usage-based add-ons (e.g., extra seats, extra storage), invoices, plan upgrade/downgrade, dunning emails.

### 4.26 Admin Panel (Super Admin)
- Full system analytics, user/org management, payments/subscriptions overview, audit access, feature flags, health monitoring, email queue status, background job monitoring.

### 4.27 Landing Page
- Hero, features, screenshots, testimonials, pricing, FAQ, blog, contact, footer, SEO-optimized, animated.

## 5. Non-Functional Requirements

- **Performance:** P95 API response < 300ms for read endpoints; dashboard first paint < 1.5s.
- **Scalability:** Horizontally scalable API layer; queue-based processing (BullMQ) for AI analysis, report generation, GitHub sync.
- **Availability:** 99.9% target uptime for paid tiers.
- **Security & Compliance:** RBAC enforced at API layer (never trust client), full audit trail, encrypted secrets, GDPR-aware data export/delete for org offboarding.
- **Accessibility:** WCAG 2.1 AA for core flows.
- **Internationalization-ready:** UI strings externalized even if only English ships first.
- **Observability:** Structured logging, error tracking, job queue monitoring from day one.

## 6. Out of Scope for MVP (Explicitly Deferred)

- Native mobile apps (mobile-responsive web only in MVP).
- Slack/Discord *bidirectional* bot commands (v1 ships outbound notifications only).
- Custom AI model fine-tuning (v1 uses a general LLM via API for scoring/summarization).
- Marketplace/plugin ecosystem.

## 7. Build Phases (High-Level — see `DEVELOPMENT_RULES.md` for detail)

1. Architecture & schema foundation
2. Auth & RBAC
3. Layout & design system
4. Dashboard
5. Projects & Tasks
6. Work Submission
7. AI Analysis
8. GitHub Integration
9. Reports
10. Chat
11. Billing
12. Deployment & hardening

## 8. Open Questions

- Which LLM provider(s) power AI scoring/summarization, and what's the fallback if the primary provider is unavailable?
- Attendance/focus-time tracking: what specific signals are ethically and legally acceptable per target market (esp. EU)?
- Screenshot capture: client-initiated upload only, or optional automated capture via desktop agent (future)?