# WorkPulse AI — Database Schema

Status: Draft v1.0
Database: PostgreSQL (via Prisma ORM)
Related: `SYSTEM_ARCHITECTURE.md`

---

## 1. Conventions

- **Primary keys:** `id UUID` (default `gen_random_uuid()`) on every table.
- **Multi-tenancy:** every tenant-scoped table has `organization_id UUID` with a foreign key + index; no cross-org joins are ever permitted at the query layer.
- **Soft deletes:** tenant-facing tables include `deleted_at TIMESTAMPTZ NULL`; queries default to `WHERE deleted_at IS NULL` (enforced via a Prisma middleware, not per-query discipline).
- **Timestamps:** `created_at`, `updated_at` (`TIMESTAMPTZ`, defaulted/auto-updated) on every table.
- **Auditability:** sensitive tables pair with an append-only history/audit record (see §14).
- **Naming:** snake_case columns, plural table names.
- **Foreign keys:** always indexed; `ON DELETE RESTRICT` by default, `CASCADE` only where domain logic requires it (e.g., deleting a task cascades its checklist items).

---

## 2. Core Identity & Tenancy

### `organizations`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | |
| slug | TEXT UNIQUE | |
| logo_url | TEXT NULL | |
| brand_color | TEXT NULL | |
| plan_id | UUID FK → plans.id | current plan |
| settings | JSONB | notification defaults, security policy, etc. |
| created_at / updated_at / deleted_at | | |

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| password_hash | TEXT NULL | null if OAuth-only |
| full_name | TEXT | |
| avatar_url | TEXT NULL | |
| two_factor_enabled | BOOLEAN DEFAULT false | |
| two_factor_secret | TEXT NULL | encrypted at rest |
| created_at / updated_at / deleted_at | | |

### `organization_members`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK → organizations.id | indexed |
| user_id | UUID FK → users.id | indexed |
| role_id | UUID FK → roles.id | org-level role |
| status | ENUM(invited, active, suspended) | |
| invited_by | UUID FK → users.id NULL | |
| joined_at | TIMESTAMPTZ NULL | |
| created_at / updated_at / deleted_at | | |
| UNIQUE(organization_id, user_id) | | |

### `roles`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK NULL | NULL = system-defined role |
| name | TEXT | Super Admin, Owner, Admin, PM, Team Lead, Developer, QA, Designer, Client, Viewer |
| is_system | BOOLEAN | |

### `permissions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| key | TEXT UNIQUE | e.g. `project.create`, `submission.approve` |
| description | TEXT | |

### `role_permissions`
| Column | Type | Notes |
|---|---|---|
| role_id | UUID FK → roles.id | |
| permission_id | UUID FK → permissions.id | |
| PRIMARY KEY(role_id, permission_id) | | |

### `oauth_accounts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | indexed |
| provider | ENUM(github, google) | |
| provider_account_id | TEXT | |
| access_token | TEXT | encrypted |
| refresh_token | TEXT NULL | encrypted |
| UNIQUE(provider, provider_account_id) | | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | indexed |
| refresh_token_hash | TEXT | |
| device_info | JSONB | UA, IP, platform |
| revoked_at | TIMESTAMPTZ NULL | |
| expires_at | TIMESTAMPTZ | |
| created_at | | |

---

## 3. Teams, Departments & Workspaces

### `teams`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK | indexed |
| name | TEXT | |
| department | TEXT NULL | |
| created_at / updated_at / deleted_at | | |

### `team_members`
| Column | Type | Notes |
|---|---|---|
| team_id | UUID FK → teams.id | |
| organization_member_id | UUID FK → organization_members.id | |
| PRIMARY KEY(team_id, organization_member_id) | | |

---

## 4. Projects & Tasks

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK | indexed |
| name | TEXT | |
| description | TEXT NULL | |
| status | ENUM(planning, active, paused, completed, archived) | indexed |
| owner_id | UUID FK → users.id | |
| start_date / due_date | DATE NULL | |
| created_at / updated_at / deleted_at | | |

### `project_members`
| Column | Type | Notes |
|---|---|---|
| project_id | UUID FK → projects.id | |
| organization_member_id | UUID FK → organization_members.id | |
| project_role_id | UUID FK → roles.id NULL | overrides org role in-project |
| PRIMARY KEY(project_id, organization_member_id) | | |

### `milestones`
| id UUID PK, project_id FK, title, due_date, status, created_at/updated_at |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK | indexed |
| project_id | UUID FK → projects.id | indexed |
| parent_task_id | UUID FK → tasks.id NULL | subtasks |
| title | TEXT | |
| description | TEXT NULL | |
| priority | ENUM(low, medium, high, urgent) | indexed |
| status | ENUM(todo, in_progress, in_review, done, blocked) | indexed |
| due_date | TIMESTAMPTZ NULL | indexed |
| recurrence_rule | TEXT NULL | iCal RRULE format |
| template_id | UUID FK → task_templates.id NULL | |
| created_by | UUID FK → users.id | |
| created_at / updated_at / deleted_at | | |

### `task_assignees`
| task_id FK, organization_member_id FK, PRIMARY KEY(task_id, organization_member_id) |

### `task_labels` / `labels`
`labels(id, organization_id, name, color)`; `task_labels(task_id, label_id)` composite PK.

### `task_checklist_items`
| id, task_id FK, title, is_done BOOLEAN, position INT, created_at/updated_at |

### `task_dependencies`
| task_id FK, depends_on_task_id FK, type ENUM(blocks, relates_to), PRIMARY KEY(task_id, depends_on_task_id) |

### `task_templates`
| id, organization_id FK, name, default_fields JSONB |

### `task_history`
Append-only: `id, task_id FK, changed_by FK, field, old_value, new_value, changed_at`.

---

## 5. Work Submissions (Core Entity)

### `submissions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK | indexed |
| task_id | UUID FK → tasks.id NULL | may be standalone |
| project_id | UUID FK → projects.id | indexed |
| submitted_by | UUID FK → users.id | indexed |
| version | INT DEFAULT 1 | incremented on resubmission |
| title | TEXT | |
| description | TEXT | |
| hours_worked | NUMERIC(5,2) NULL | |
| github_url | TEXT NULL | |
| live_demo_url | TEXT NULL | |
| deployment_url | TEXT NULL | |
| notes | TEXT NULL | |
| blockers | TEXT NULL | |
| next_plan | TEXT NULL | |
| status | ENUM(draft, submitted, in_review, need_changes, approved, rejected, completed) | indexed |
| search_vector | TSVECTOR | GIN index for full-text search |
| created_at / updated_at / deleted_at | | |

### `submission_attachments`
| id, submission_id FK, file_id FK → files.id, kind ENUM(screenshot, recording, zip, apk, design, document, video), created_at |

### `submission_screenshots` (timeline)
| id, submission_id FK, file_id FK, stage ENUM(before, progress, final), position INT, captured_at |

### `submission_status_history`
Append-only: `id, submission_id FK, from_status, to_status, changed_by FK, comment TEXT NULL, changed_at`.

---

## 6. AI Analysis

### `ai_analyses`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| submission_id | UUID FK → submissions.id | indexed |
| submission_version | INT | ties analysis to a specific version |
| work_quality_score | NUMERIC(4,1) | 0–100 |
| complexity_score | NUMERIC(4,1) | |
| effort_estimate_hours | NUMERIC(6,2) NULL | |
| risk_score | NUMERIC(4,1) | |
| documentation_score | NUMERIC(4,1) | |
| communication_score | NUMERIC(4,1) | |
| code_quality_score | NUMERIC(4,1) NULL | null if no code linked |
| overall_score | NUMERIC(4,1) | |
| summary_professional | TEXT | |
| summary_manager | TEXT | |
| summary_client | TEXT | |
| summary_technical | TEXT | |
| model_provider | TEXT | e.g. "anthropic:claude-sonnet" |
| created_at | | |

---

## 7. GitHub Integration

### `github_installations`
| id, organization_id FK, installation_id TEXT, account_login TEXT, created_at |

### `github_repositories`
| id, organization_id FK, installation_id FK, full_name TEXT, default_branch TEXT, created_at |

### `github_commits`
| id, repository_id FK, sha TEXT UNIQUE, author_user_id FK → users.id NULL, message TEXT, additions INT, deletions INT, files_changed INT, committed_at TIMESTAMPTZ, linked_task_id FK → tasks.id NULL |

### `github_pull_requests`
| id, repository_id FK, number INT, title TEXT, author_user_id FK NULL, state ENUM(open, merged, closed), merged_at NULL, review_count INT, linked_task_id FK NULL |

---

## 8. Comments, Feed, Chat

### `comments`
| id, organization_id FK, commentable_type ENUM(task, submission, project), commentable_id UUID, author_id FK → users.id, body TEXT, parent_comment_id FK NULL (threading), created_at/updated_at/deleted_at |

### `feed_events`
| id, organization_id FK, project_id FK NULL, actor_id FK → users.id, event_type TEXT, payload JSONB, created_at | indexed on (organization_id, created_at) |

### `chat_channels`
| id, organization_id FK, type ENUM(organization, project, task, direct), project_id FK NULL, task_id FK NULL, created_at |

### `chat_channel_members`
| channel_id FK, user_id FK, last_read_at TIMESTAMPTZ, PRIMARY KEY(channel_id, user_id) |

### `chat_messages`
| id, channel_id FK, sender_id FK → users.id, body TEXT NULL, attachment_file_id FK NULL, voice_note_file_id FK NULL, created_at | indexed on (channel_id, created_at) |

---

## 9. Attendance

### `attendance_sessions`
| id, organization_member_id FK, clock_in TIMESTAMPTZ, clock_out TIMESTAMPTZ NULL, active_minutes INT DEFAULT 0, idle_minutes INT DEFAULT 0, focus_minutes INT DEFAULT 0, created_at |

### `attendance_breaks`
| id, attendance_session_id FK, started_at, ended_at NULL |

---

## 10. Notifications

### `notifications`
| id, organization_id FK, recipient_id FK → users.id, type TEXT, payload JSONB, read_at TIMESTAMPTZ NULL, created_at | indexed on (recipient_id, read_at) |

### `notification_preferences`
| user_id FK, event_type TEXT, channel ENUM(in_app, email, push, slack, discord), enabled BOOLEAN, PRIMARY KEY(user_id, event_type, channel) |

---

## 11. Files & Storage

### `files`
| id, organization_id FK, uploaded_by FK → users.id, storage_provider ENUM(supabase, r2), storage_key TEXT, file_name TEXT, mime_type TEXT, size_bytes BIGINT, folder_id FK → file_folders.id NULL, version INT DEFAULT 1, previous_version_id FK → files.id NULL, created_at/deleted_at |

### `file_folders`
| id, organization_id FK, project_id FK NULL, name, parent_folder_id FK NULL |

### `file_tags` / `tags`
`tags(id, organization_id, name)`; `file_tags(file_id, tag_id)`.

---

## 12. Reports & Leaderboard

### `reports`
| id, organization_id FK, project_id FK NULL, type ENUM(daily, weekly, monthly, quarterly, client, custom), period_start, period_end, generated_for ENUM(organization, project, team, member), target_id UUID NULL, content JSONB, pdf_file_id FK NULL, created_at |

### `leaderboard_snapshots`
| id, organization_id FK, period ENUM(weekly, monthly, all_time), category ENUM(top_contributor, most_helpful, fastest, highest_quality, best_reviewer, longest_streak), organization_member_id FK, rank INT, score NUMERIC, computed_at |

---

## 13. Billing

### `plans`
| id, name ENUM(free, starter, pro, enterprise), price_monthly, price_yearly, seat_limit, storage_limit_gb, feature_flags JSONB |

### `subscriptions`
| id, organization_id FK, plan_id FK, stripe_customer_id TEXT, stripe_subscription_id TEXT, status ENUM(trialing, active, past_due, canceled), current_period_end TIMESTAMPTZ |

### `invoices`
| id, subscription_id FK, stripe_invoice_id TEXT, amount_due, amount_paid, status, issued_at |

---

## 14. Audit & System

### `audit_logs` (append-only, immutable)
| id, organization_id FK, actor_id FK → users.id NULL, action TEXT, resource_type TEXT, resource_id UUID NULL, metadata JSONB, ip_address TEXT NULL, created_at | indexed on (organization_id, created_at), (resource_type, resource_id) |

### `feature_flags`
| id, key TEXT UNIQUE, description, is_enabled_globally BOOLEAN, enabled_for_organization_ids UUID[] NULL |

### `webhooks`
| id, organization_id FK, target_url TEXT, event_types TEXT[], secret TEXT (encrypted), is_active BOOLEAN |

---

## 15. Indexing Strategy (Summary)

- Every `organization_id` column: indexed (tenant scoping is the most common filter).
- Every foreign key: indexed.
- `tasks(project_id, status)`, `submissions(project_id, status)`: composite indexes for board/list views.
- `submissions.search_vector`: GIN index for full-text search.
- `audit_logs(organization_id, created_at)`, `feed_events(organization_id, created_at)`: composite indexes for time-ordered pagination.
- Partial indexes on `deleted_at IS NULL` for hot tenant tables to keep soft-deleted rows out of common scans.

## 16. Notes on Evolution

This schema is additive-first: new work-evidence types, AI score dimensions, or integration sources should be added as new tables/columns rather than overloading existing JSONB blobs, except where the data is genuinely schema-less (e.g., `feed_events.payload`, `organizations.settings`). Prisma migrations are the single source of truth; this document is kept in sync with `schema.prisma` on every schema change.