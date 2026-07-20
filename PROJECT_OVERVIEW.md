# WorkPulse AI — Project Overview

## 1. What This Is

**WorkPulse AI** is an AI-powered Work Intelligence Platform. It is not a task manager. Task managers (Jira, Trello, Asana, ClickUp, Linear) answer *"what needs to be done."* WorkPulse AI answers a different, harder question that every manager actually asks every day:

> **"What did my team actually do, how good was it, and who is really working?"**

Tasks and projects exist in the product only as the *container* for the real unit of value: the **Work Submission** — verifiable proof of work, automatically analyzed and scored by AI.

## 2. Tagline

*"Know who worked, what they built, and how productive your team really is."*

## 3. The Problem

Managers and founders waste enormous time on manual status-checking:

- "What did you do today?"
- "Who actually completed this?"
- "Is anyone actually working right now?"
- "How much work got done this sprint?"
- "Who's been quiet for a week?"
- "Who deserves a raise or promotion?"
- "Who is drowning in work?"

Standup meetings, Slack pings, and "mark as done" checkboxes are self-reported and unverifiable. There is no system of record that ties a claim of work ("I finished the login page") to *evidence* of work (a commit, a screenshot, a deployed URL, an APK, a design file) and then *scores* that evidence consistently.

## 4. The Solution

WorkPulse AI turns "done" into a structured, evidenced, AI-scored artifact:

1. A member does work.
2. They submit **proof** (GitHub link, live demo URL, screenshots, recordings, files, hours worked, blockers, next steps).
3. AI analyzes the submission for quality, complexity, effort, risk, and communication clarity, and produces role-specific summaries (manager / client / technical).
4. The submission flows through an **approval pipeline** (Draft → Submitted → In Review → Approved / Need Changes / Rejected → Completed), fully audit-logged.
5. Aggregated scores power dashboards, leaderboards, reports, and a conversational **AI Manager** that answers questions like "who worked least today?" or "generate this week's client report" in natural language.

Tasks, projects, GitHub activity, chat, and attendance all feed this same evidence pipeline — the platform's job is to make "how productive is my team" a queryable, auditable fact instead of a guess.

## 5. Who It's For

- **Founders / CEOs** of remote-first or distributed teams who cannot see day-to-day output.
- **Engineering Managers / Project Managers** who need objective delivery data, not vibes.
- **Agencies and outsourced dev shops** who must prove work to clients with evidence, not just invoices.
- **HR / People Ops** making promotion, bonus, and performance-review decisions.
- **Clients** who want transparent, real-time visibility into contracted work without micromanaging.

## 6. Core Differentiators vs. Jira/Asana/ClickUp/Trello/Linear

| Dimension | Traditional PM Tools | WorkPulse AI |
|---|---|---|
| Unit of truth | Task status (self-reported) | Work Submission (evidence-backed) |
| Verification | None | GitHub commits, screenshots, recordings, live URLs |
| Scoring | None | AI-generated quality/complexity/risk/effort scores |
| Reporting | Manual export | Auto-generated daily/weekly/monthly/quarterly AI reports |
| Manager interface | Dashboards only | Dashboards **+ conversational AI Manager** |
| Productivity visibility | Burndown/velocity only | Burndown + attendance + focus time + leaderboards + screenshot timelines |

## 7. Product Pillars

1. **Evidence over self-reporting** — every "done" requires proof.
2. **AI as the analyst, not a chatbot bolt-on** — AI scores, summarizes, and answers questions across the entire org's work graph.
3. **Radical transparency with dignity** — visibility into work, not surveillance theater (no keystroke logging; focus time and screenshots are opt-in per organization policy).
4. **Enterprise-grade from day one** — multi-tenant isolation, RBAC, audit logs, 2FA — not bolted on later.
5. **Beautiful, fast, native-feeling UI** — Apple/Linear/Notion/Stripe-level design quality; this is a tool people *want* to open.

## 8. High-Level Module Map

- **Identity & Access**: Auth, RBAC, Organizations, Teams, Workspaces
- **Delivery**: Projects, Tasks, Subtasks, Kanban/Calendar/Timeline/List views
- **Evidence**: Work Submissions, Screenshot Timelines, GitHub Integration
- **Intelligence**: AI Work Analysis, AI Daily/Weekly/Monthly/Quarterly Reports, AI Manager (conversational analytics)
- **Collaboration**: Comments, Team Feed, Chat (org/project/task/private)
- **Operations**: Approval Flow, Attendance, Audit Log, Notifications
- **Insight**: Dashboard, Productivity Analytics, Leaderboard, Global Search
- **Platform**: Files/Storage, Settings, Billing (Stripe), Admin Panel
- **Growth**: Landing Page, Pricing, SEO

## 9. Tech Stack (Summary)

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Zustand, React Hook Form, Zod
**Backend:** Node.js, NestJS, REST + WebSocket (Socket.io), Prisma ORM, PostgreSQL, Redis, BullMQ
**Auth:** JWT + Refresh Tokens, RBAC, OAuth (GitHub, Google), 2FA
**Storage:** Supabase Storage or Cloudflare R2
**Payments:** Stripe
**Infra:** Docker, GitHub Actions CI/CD

See `SYSTEM_ARCHITECTURE.md` for details.

## 10. Related Documents

- `PRODUCT_REQUIREMENTS_DOCUMENT.md` — full functional/non-functional requirements per module
- `SYSTEM_ARCHITECTURE.md` — architecture, folder structure, integration design
- `DATABASE_SCHEMA.md` — normalized PostgreSQL schema
- `DEVELOPMENT_RULES.md` — engineering standards, build order, quality gates