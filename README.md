# Pulse

**Team Management & Real-Time Collaboration Platform with Full Admin Panel & RBAC**

---

## Overview

Pulse is a full-stack team management and collaboration platform built with Next.js. It provides teams with a centralized workspace to manage projects, track tasks, collaborate through real-time chat, and monitor team performance — all through a modern, responsive interface.

The application includes a complete **Admin Panel with Role-Based Access Control (RBAC)**, supporting 6 user roles with 40 granular permissions, comprehensive audit logging, and system management tools. Real-time communication is powered by **Socket.IO** with team chat, media sharing, typing indicators, and read receipts.

**Why it was built:** Teams need a lightweight, self-hostable alternative to heavy project management and communication tools. Pulse delivers project tracking, task management with Kanban boards, real-time team chat with file sharing, and activity monitoring — with enterprise-grade access control — in a single deployable application.

**Who it is for:** Small to medium development teams, project managers, and administrators who want visibility into team productivity and real-time collaboration with minimal setup overhead.

---

## Features

### Authentication & Security
- User registration with automatic workspace creation
- Login with email and password
- JWT-based authentication with 7-day token expiry
- Password hashing with bcrypt (12 rounds)
- Authenticated route protection with automatic redirect
- Account lockout after 5 failed login attempts (30-minute window)
- Login attempt tracking and history
- Session management with validation
- Forced password reset on first login for bootstrap admin

### Admin Panel
- Dedicated admin dashboard with system-wide metrics
- Full RBAC system with 6 roles and 40 permissions
- User management (create, edit, delete, suspend, activate)
- Role management with granular permission assignment
- Project management across all workspaces
- Task management across all projects with bulk operations
- Workspace overview
- Team performance monitoring with per-member stats
- System analytics dashboard
- Activity feed with filtering
- Audit log with before/after state snapshots
- Login history tracking
- Feature flag management
- System settings configuration
- System health monitoring
- Announcement broadcasting with targeted delivery

### Role-Based Access Control (RBAC)
- **Super Admin** — Full system access
- **Admin** — User and project management
- **Manager** — Project and task management
- **Team Lead** — Task management and team view
- **Member** — Standard task operations
- **Viewer** — Read-only access

### Team Management
- Create and manage teams within workspaces
- Team member listing with avatars and role badges
- Per-member stats: total tasks, completed tasks, efficiency rating
- Team summary cards (total members, avg efficiency, tasks completed)
- Team-level project and task assignments
- Team lead designation

### Project Management
- Create projects with name, description, and color coding
- View all projects in a grid layout with progress indicators
- Project detail page with Kanban board view
- Search and filter projects
- Task count and completion tracking per project
- Project archiving and restoration
- Per-project member management

### Task Management
- Create tasks with title, description, status, priority, and project assignment
- Four status columns: To Do, In Progress, In Review, Done
- Four priority levels: Low, Medium, High, Urgent
- Inline task status toggle
- Filter tasks by status and priority
- Search tasks by title
- Due date display and management
- Bulk task operations
- Task comments

### Kanban Board
- Per-project Kanban view with four columns
- Quick status transition buttons on each card
- Task count badges per column

### Team Chat (Real-Time)
- Real-time messaging powered by Socket.IO
- Per-team chat rooms with access control
- Online user presence indicators
- Typing indicators
- Read receipts with per-message tracking
- Message editing (15-minute edit window)
- Message deletion (author, admin, or team lead)
- Message pinning (admin or team lead)
- Threaded replies
- Context menu for message actions
- Emoji picker
- Auto-scroll with unread message indicators

### Media Sharing
- File and image uploads in team chat
- Support for images, videos, audio, and documents
- Image/video dimension metadata
- Attachment renderer with file type icons
- Upload progress tracking
- Lightbox viewer for image previews

### Announcements
- System-wide or targeted announcements
- Target by audience: everyone, specific teams, roles, or users
- Announcement types: info, warning, critical
- Expiration dates for time-limited announcements
- Read tracking per user
- Announcement banner component
- Real-time read receipt via Socket.IO

### Notifications
- Notification bell with unread count badge
- Dropdown notification panel
- Mark all as read functionality
- Notification types: info, warning, error, success
- Deep link support for notification actions

### Activity Tracking
- Automatic activity logging for key actions
- Activity feed with filtering
- User activity history
- Task-linked activity context

### Audit Logs
- Every admin action generates an audit log entry
- Before/after JSON state snapshots
- IP address, user agent, and device tracking
- Indexed queries on admin, action, resource, and timestamp

### User Profiles & Avatar System
- Profile settings with editable fields
- Avatar upload with file validation
- Avatar metadata tracking (file name, MIME type, size, upload time)
- Avatar caching headers for performance
- Theme preferences (Light / Dark / System)

### Feature Flags
- Admin-managed feature toggles
- Enable/disable system features dynamically
- Feature flag CRUD with audit trail

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16.2.10 (App Router) |
| **Language** | TypeScript 5 |
| **React** | React 19.2.4 |
| **Database** | SQLite |
| **ORM** | Prisma 6.19.3 |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **Real-Time** | Socket.IO 4.8.3 (WebSocket + polling) |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand 5.0.14 |
| **Animation** | Framer Motion 12.42.2 |
| **Charts** | Recharts 3.9.2 |
| **Validation** | Zod 4.4.3 |
| **Icons** | Lucide React |
| **Date Utilities** | date-fns 4.4.0 |
| **Toasts** | Sonner 2.0.7 |
| **Build Tool** | Next.js (Turbopack) |
| **Runtime** | tsx (TypeScript execution) |
| **Linting** | ESLint 9 with eslint-config-next |
| **Containerization** | Docker (multi-stage build) |

---

## Project Architecture

```
teamlens/
├── prisma/
│   ├── schema.prisma          # Database schema (25+ models)
│   └── seed.ts                # Database seeder (roles, permissions, settings, bootstrap admin)
├── public/                    # Static assets (SVG icons)
├── src/
│   ├── app/
│   │   ├── api/               # REST API endpoints
│   │   │   ├── auth/          # Authentication (login, register, me, change-password)
│   │   │   ├── admin/         # Admin API (15+ route groups)
│   │   │   ├── announcements/ # Announcement CRUD and read tracking
│   │   │   ├── chat/          # Chat file uploads
│   │   │   ├── projects/      # Project CRUD
│   │   │   ├── tasks/         # Task CRUD
│   │   │   ├── teams/         # Team listing and chat
│   │   │   ├── activities/    # Activity feed
│   │   │   ├── notifications/ # Notifications
│   │   │   └── user/          # User avatar management
│   │   ├── admin/             # Admin panel pages (16 pages)
│   │   │   ├── dashboard/     # Admin overview with metrics
│   │   │   ├── users/         # User management with CRUD
│   │   │   ├── roles/         # Role management with permissions
│   │   │   ├── permissions/   # Permission catalog by module
│   │   │   ├── projects/      # Project management
│   │   │   ├── tasks/         # Task management with bulk ops
│   │   │   ├── workspaces/    # Workspace overview
│   │   │   ├── teams/         # Team management and chat
│   │   │   ├── analytics/     # System analytics
│   │   │   ├── activity/      # Activity feed
│   │   │   ├── audit/         # Audit logs with snapshots
│   │   │   ├── login-history/ # Login attempt history
│   │   │   ├── announcements/ # System announcements
│   │   │   ├── feature-flags/ # Feature flag management
│   │   │   ├── settings/      # System settings
│   │   │   └── health/        # System health
│   │   ├── dashboard/         # User dashboard pages
│   │   │   ├── projects/      # Project list and detail
│   │   │   ├── tasks/         # Task board
│   │   │   ├── team/          # Team view and chat
│   │   │   ├── announcements/ # User announcements
│   │   │   └── settings/      # User settings
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── change-password/   # Password change page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── announcements/     # Announcement banner
│   │   ├── auth/              # Login, register, change-password forms
│   │   ├── chat/              # Real-time chat components (9 files)
│   │   ├── dashboard/         # Dashboard widgets (stat cards, progress ring, skeleton)
│   │   ├── landing/           # Landing page
│   │   ├── layout/            # Shell, header, sidebar
│   │   ├── providers/         # Theme and auth providers
│   │   └── ui/                # Reusable UI primitives (14 components)
│   ├── hooks/
│   │   ├── use-chat-socket.ts # Socket.IO chat hook
│   │   ├── use-file-upload.ts # File upload hook
│   │   └── use-polling.ts     # Polling hook
│   ├── lib/
│   │   ├── auth.ts            # JWT + bcrypt utilities
│   │   ├── rbac.ts            # RBAC: permissions, roles, authorization
│   │   ├── chat-rbac.ts       # Chat-specific access control
│   │   ├── audit.ts           # Audit logging system
│   │   ├── security.ts        # Rate limiting, sessions, login tracking
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── socket-server.ts   # Socket.IO server (chat, presence, pins)
│   │   ├── socket-client.ts   # Socket.IO client wrapper
│   │   ├── utils.ts           # cn(), date formatting, helpers
│   │   └── validations.ts     # Zod schemas
│   └── stores/
│       ├── auth-store.ts      # Auth state
│       ├── sidebar-store.ts   # Sidebar state
│       └── theme-store.ts     # Theme state
├── server.ts                  # Custom Node.js server with Socket.IO
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## RBAC Architecture

### Permission System

Every protected API endpoint checks the user's permissions before executing. The system uses a three-layer model:

1. **Permission** — A granular action (e.g., `users:create`, `projects:delete`)
2. **Role** — A collection of permissions (e.g., `admin` has 24 permissions)
3. **UserRole** — Links a user to one or more roles

### Permission Matrix

| Module | Permission | Super Admin | Admin | Manager | Team Lead | Member | Viewer |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Users** | view | ✓ | ✓ | | | | |
| | create | ✓ | ✓ | | | | |
| | edit | ✓ | ✓ | | | | |
| | delete | ✓ | | | | | |
| | suspend | ✓ | ✓ | | | | |
| | activate | ✓ | ✓ | | | | |
| | reset_password | ✓ | | | | | |
| | change_role | ✓ | | | | | |
| **Roles** | view | ✓ | ✓ | | | | |
| | create | ✓ | | | | | |
| | edit | ✓ | | | | | |
| | delete | ✓ | | | | | |
| | assign | ✓ | | | | | |
| **Projects** | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ | | | |
| | edit | ✓ | ✓ | ✓ | | | |
| | delete | ✓ | | | | | |
| | archive | ✓ | ✓ | ✓ | | | |
| | restore | ✓ | ✓ | | | | |
| **Tasks** | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ | ✓ | ✓ | |
| | edit | ✓ | ✓ | ✓ | ✓ | ✓ | |
| | delete | ✓ | ✓ | ✓ | ✓ | | |
| | assign | ✓ | ✓ | ✓ | ✓ | | |
| **Workspaces** | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | edit | ✓ | ✓ | | | | |
| **Teams** | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | manage | ✓ | ✓ | | | | |
| **Analytics** | view | ✓ | ✓ | ✓ | ✓ | | ✓ |
| | export | ✓ | ✓ | | | | |
| **Audit** | view | ✓ | ✓ | | | | |
| **System** | settings | ✓ | | | | | |
| | health | ✓ | | | | | |
| | feature_flags | ✓ | | | | | |
| | api_keys | ✓ | | | | | |
| | announcements | ✓ | | | | | |
| **Activity** | view | ✓ | ✓ | ✓ | ✓ | | ✓ |
| **Notifications** | manage | ✓ | ✓ | | | | |

### Authorization Flow

```
Request → JWT Verification → getUserPermissions() → hasPermission() → Route Handler
                                      ↓
                              Permission Cache (5min TTL)
```

All admin routes follow this pattern:
1. Extract JWT from `Authorization: Bearer <token>` header
2. Verify token and extract user payload
3. Check user has required permission via `hasPermission(userId, "resource:action")`
4. If authorized, proceed; otherwise return 403

---

## Real-Time Communication (Socket.IO)

Pulse uses Socket.IO for real-time features. The server is initialized in `server.ts` alongside the Next.js HTTP server.

### Events

| Event | Direction | Description |
|---|---|---|
| `chat:join` | Client → Server | Join a team chat room |
| `chat:leave` | Client → Server | Leave a team chat room |
| `chat:message` | Bidirectional | Send/receive chat messages |
| `chat:edit` | Bidirectional | Edit a message (15-min window) |
| `chat:delete` | Bidirectional | Delete a message |
| `chat:pin` | Bidirectional | Pin/unpin a message |
| `chat:typing` | Bidirectional | Typing indicator broadcast |
| `chat:read` | Client → Server | Mark messages as read |
| `chat:read-receipt` | Server → Client | Read receipt broadcast |
| `chat:online` | Server → Client | Online user presence update |
| `chat:error` | Server → Client | Error notification |
| `announcement:read` | Client → Server | Mark announcement as read |

### Access Control

- Chat access is verified per team membership
- Admins and Super Admins can access all team chats
- Message editing is restricted to the author within 15 minutes
- Message deletion requires authorship, admin role, or team lead status
- Message pinning requires admin or team lead role

---

## Admin Routes

| Route | Description |
|---|---|
| `/admin/dashboard` | System overview with key metrics |
| `/admin/users` | User list with search, filter, pagination, CRUD |
| `/admin/users/[id]` | User detail with stats and roles |
| `/admin/roles` | Role management with permission assignment |
| `/admin/permissions` | Permission catalog by module |
| `/admin/projects` | All projects with archive/restore/delete |
| `/admin/tasks` | All tasks with filters and bulk delete |
| `/admin/workspaces` | Workspace listing |
| `/admin/teams` | Team management and performance |
| `/admin/teams/[id]` | Team detail with member stats |
| `/admin/teams/chat` | Team chat overview |
| `/admin/analytics` | System-wide analytics |
| `/admin/activity` | Activity feed |
| `/admin/audit` | Audit logs with before/after snapshots |
| `/admin/login-history` | Login attempt history |
| `/admin/announcements` | System announcements |
| `/admin/feature-flags` | Feature flag management |
| `/admin/settings` | System settings by category |
| `/admin/health` | System health and database stats |
| `/admin/assignments` | Team assignment management |

---

## Audit Logging

Every admin action generates an audit log entry with:

| Field | Description |
|---|---|
| `adminId` | ID of the admin who performed the action |
| `action` | Action performed (e.g., `user.created`, `role.updated`) |
| `resource` | Resource type (e.g., `user`, `role`, `project`) |
| `resourceId` | ID of the affected resource |
| `before` | JSON snapshot of state before the change |
| `after` | JSON snapshot of state after the change |
| `ipAddress` | Client IP address |
| `userAgent` | Browser user agent string |
| `device` | Device type (Desktop/Mobile/Tablet) |
| `timestamp` | When the action occurred |

---

## Security

| Feature | Implementation |
|---|---|
| **Password Hashing** | bcrypt with 12 salt rounds |
| **JWT Authentication** | Tokens signed with secret, 7-day expiry |
| **Input Validation** | Zod schemas on all API inputs |
| **RBAC** | Permission-based authorization on all admin routes |
| **Server-side Auth** | All protected routes verify JWT + permissions server-side |
| **Rate Limiting** | Database-backed rate limiting per key |
| **Account Lockout** | Locks after 5 failed login attempts (30 min) |
| **Login Tracking** | All login attempts logged with IP, device, user agent |
| **Session Management** | Token-based sessions with expiry validation |
| **CSRF Tokens** | Cryptographically secure random tokens |
| **Input Sanitization** | XSS prevention on user inputs |
| **Password Strength** | Client-side password strength checker |
| **Server Info Hidden** | `poweredByHeader: false` |
| **Env Exclusion** | `.env` files excluded from git and Docker |
| **React Strict Mode** | Enabled for catching common bugs |
| **Socket.IO Auth** | JWT verification on WebSocket handshake |
| **Chat RBAC** | Team membership verification for chat access |

---

## Database

### Schema Overview

| Model | Description |
|---|---|
| `User` | User accounts with auth fields, status, avatar metadata, lockout |
| `Session` | Active user sessions with IP and device tracking |
| `Role` | RBAC roles (system + custom) |
| `Permission` | Granular permissions (40 total) |
| `RolePermission` | Role-permission mapping |
| `UserRole` | User-role mapping |
| `Workspace` | Workspaces grouping projects and teams |
| `WorkspaceMember` | User-workspace membership |
| `Team` | Teams within workspaces |
| `TeamMember` | Team membership with role (member/lead) |
| `TeamAssignment` | Team-level project and task assignments |
| `ChatMessage` | Real-time chat messages with threading |
| `ChatAttachment` | File attachments for chat messages |
| `ChatReadReceipt` | Per-message read receipt tracking |
| `Project` | Projects with status (active/archived) |
| `ProjectMember` | Per-project member management |
| `Task` | Tasks with status, priority, position, and assignee |
| `Comment` | Task comments |
| `Activity` | User activity log |
| `AuditLog` | Admin action audit trail with state snapshots |
| `LoginHistory` | Login attempt history |
| `Notification` | User notifications |
| `FeatureFlag` | Feature toggles |
| `SystemSetting` | Application settings |
| `ApiKey` | API key management |
| `Announcement` | System announcements with targeting |
| `AnnouncementRead` | Per-user announcement read tracking |
| `RateLimit` | Rate limiting counters |

### Migrations

```bash
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema to database
npx prisma studio            # Open Prisma Studio
npm run db:seed              # Seed roles, permissions, settings, and bootstrap admin
npm run db:reset             # Reset and reseed database
```

---

## Installation

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd teamlens

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database with roles, permissions, settings, and bootstrap admin
npm run db:seed
```

### Initial Super Admin

During the first database seed, the system automatically creates a bootstrap Super Admin account:

- **Email:** `admin@pulse.com`
- **Password:** Must be changed on first login (forced)

This account is created only if no Super Admin exists in the system. After the first successful login, you will be required to set a new password before accessing the dashboard.

All subsequent users who register receive the default Member role. Only a Super Admin can assign other roles.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

### Docker

```bash
docker build -t pulse .
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e JWT_SECRET="your-secret-key" \
  pulse
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string. Default: `file:./dev.db` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `NEXTAUTH_URL` | No | Base URL. Default: `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL for Socket.IO CORS. Default: `http://localhost:3000` |
| `NODE_ENV` | No | `development`, `production`, or `test` |
| `PORT` | No | Server port. Default: `3000` |

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch server.ts` | Start development server with Socket.IO |
| `build` | `next build` | Create production build |
| `start` | `NODE_ENV=production tsx server.ts` | Start production server with Socket.IO |
| `server` | `tsx server.ts` | Start server (uses current NODE_ENV) |
| `lint` | `eslint` | Run ESLint |
| `db:seed` | `npx tsx prisma/seed.ts` | Seed database |
| `db:reset` | `npx prisma db push --force-reset && npx tsx prisma/seed.ts` | Reset and seed database |
| `db:studio` | `npx prisma studio` | Open Prisma Studio |

---

## API Documentation

### Authentication

#### POST `/api/auth/login`
- **Auth Required:** No
- **Body:** `{ email, password }`
- **Response:** `{ user, token }`

#### POST `/api/auth/register`
- **Auth Required:** No
- **Body:** `{ name, email, password }`
- **Response:** `{ user, token, workspace }`

#### GET `/api/auth/me`
- **Auth Required:** Yes (Bearer token)
- **Response:** `{ user }`

#### POST `/api/auth/change-password`
- **Auth Required:** Yes (Bearer token)
- **Body:** `{ currentPassword, newPassword }`

### Admin — Users

#### GET `/api/admin/users`
- **Auth Required:** Yes + `users:view` permission
- **Query:** `page`, `limit`, `search`, `status`, `role`
- **Response:** `{ users, total, page, totalPages }`

#### POST `/api/admin/users`
- **Auth Required:** Yes + `users:create` permission
- **Body:** `{ name, email, password, role, status }`

#### GET `/api/admin/users/[id]`
- **Auth Required:** Yes + `users:view` permission

#### PATCH `/api/admin/users/[id]`
- **Auth Required:** Yes + `users:edit` permission

#### DELETE `/api/admin/users/[id]`
- **Auth Required:** Yes + `users:delete` permission

#### PATCH `/api/admin/users/[id]/suspend`
- **Auth Required:** Yes + `users:suspend` or `users:activate`
- **Body:** `{ suspend: boolean }`

#### POST `/api/admin/users/[id]/reset-password`
- **Auth Required:** Yes + `users:reset_password`
- **Body:** `{ newPassword, forceReset }`

#### PATCH `/api/admin/users/[id]/role`
- **Auth Required:** Yes + `users:change_role`
- **Body:** `{ roleId }`

### Admin — Roles

#### GET `/api/admin/roles`
- **Auth Required:** Yes + `roles:view`
- **Response:** `{ roles }` with permissions and user counts

#### POST `/api/admin/roles`
- **Auth Required:** Yes + `roles:create`

#### PATCH `/api/admin/roles/[id]`
- **Auth Required:** Yes + `roles:edit`

#### DELETE `/api/admin/roles/[id]`
- **Auth Required:** Yes + `roles:delete` (system roles cannot be deleted)

#### PUT `/api/admin/roles/[id]/permissions`
- **Auth Required:** Yes + `roles:assign`
- **Body:** `{ permissionIds: string[] }`

### Admin — Permissions

#### GET `/api/admin/permissions`
- **Auth Required:** Yes + `roles:view`
- **Response:** `{ permissions, grouped }` grouped by module

### Admin — Projects

#### GET `/api/admin/projects`
- **Auth Required:** Yes + `projects:view`
- **Query:** `page`, `limit`, `search`, `status`

#### PATCH `/api/admin/projects/[id]`
- **Auth Required:** Yes + `projects:edit`

#### DELETE `/api/admin/projects/[id]`
- **Auth Required:** Yes + `projects:delete`

### Admin — Tasks

#### GET `/api/admin/tasks`
- **Auth Required:** Yes + `tasks:view`
- **Query:** `page`, `limit`, `search`, `status`, `priority`, `projectId`

#### PATCH `/api/admin/tasks/[id]`
- **Auth Required:** Yes + `tasks:edit`

#### DELETE `/api/admin/tasks/[id]`
- **Auth Required:** Yes + `tasks:delete`

### Admin — Teams

#### GET `/api/admin/teams`
- **Auth Required:** Yes + `teams:view`
- **Response:** Teams with member counts and stats

#### GET `/api/admin/teams/[id]`
- **Auth Required:** Yes + `teams:view`
- **Response:** Team detail with members and assignments

#### GET `/api/admin/teams/[id]/chat`
- **Auth Required:** Yes + `teams:view`
- **Response:** Team chat messages

#### GET `/api/admin/teams/[id]/members`
- **Auth Required:** Yes + `teams:view`
- **Response:** Team member list

### Admin — Other Endpoints

| Method | Route | Permission | Description |
|---|---|---|---|
| GET | `/api/admin/analytics` | `analytics:view` | System analytics |
| GET | `/api/admin/activity` | `activity:view` | Activity feed |
| GET | `/api/admin/audit` | `audit:view` | Audit logs |
| GET | `/api/admin/assignments` | `teams:view` | Team assignments |
| GET | `/api/admin/workspaces` | `workspaces:view` | Workspace listing |
| GET | `/api/admin/health` | `system:health` | System health |
| GET | `/api/admin/settings` | `system:settings` | System settings |
| PATCH | `/api/admin/settings/[id]` | `system:settings` | Update setting |
| GET | `/api/admin/feature-flags` | `system:feature_flags` | Feature flags |
| POST | `/api/admin/feature-flags` | `system:feature_flags` | Create flag |
| PATCH | `/api/admin/feature-flags/[id]` | `system:feature_flags` | Toggle flag |
| DELETE | `/api/admin/feature-flags/[id]` | `system:feature_flags` | Delete flag |
| GET | `/api/admin/login-history` | `audit:view` | Login history |
| GET | `/api/admin/announcements` | — | List announcements |
| POST | `/api/admin/announcements` | `system:announcements` | Create announcement |

### User Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/chat/upload` | Upload file for chat |
| GET/POST | `/api/notifications` | List/create notifications |
| POST | `/api/user/avatar` | Upload user avatar |
| GET | `/api/announcements` | List active announcements |
| POST | `/api/announcements/[id]/read` | Mark announcement as read |
| POST | `/api/announcements/read-all` | Mark all announcements as read |

---

## Performance

- **Standalone Output:** Next.js standalone mode for minimal production deployments
- **Package Import Optimization:** `optimizePackageImports` for lucide-react and recharts
- **Skeleton Loading:** Perceived performance through skeleton placeholders
- **Parallel Data Fetching:** Dashboard fetches multiple endpoints simultaneously
- **Permission Caching:** 5-minute TTL cache for user permissions
- **Database Indexing:** AuditLog indexed on adminId, action, resource, createdAt; LoginHistory indexed on userId, email
- **Avatar Cache Headers:** `Cache-Control` headers for avatar image optimization

---

## Responsive Design

| Breakpoint | Behavior |
|---|---|
| Mobile (< 640px) | Single column, mobile sidebar drawer |
| Tablet (640px - 1024px) | 2-column grids, collapsible sidebar |
| Desktop (> 1024px) | Full sidebar, 3-4 column grids |

---

## Deployment

### Vercel
1. Push to GitHub
2. Import on vercel.com
3. Set environment variables
4. Deploy

> **Note:** Vercel's serverless functions do not support Socket.IO. For real-time chat, deploy with the custom server (`server.ts`) on a VPS or Docker.

### Docker
```bash
docker build -t pulse .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  pulse
```

### Self-Hosted
```bash
npm run build && npm run start
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run the linter: `npm run lint`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Credits

Built with:

- [Next.js](https://nextjs.org/) — React framework
- [React](https://react.dev/) — UI library
- [Prisma](https://www.prisma.io/) — Database ORM
- [Socket.IO](https://socket.io/) — Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Recharts](https://recharts.org/) — Charting library
- [Zod](https://zod.dev/) — Schema validation
- [Lucide](https://lucide.dev/) — Icon library
- [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) — Password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JWT tokens
- [Sonner](https://sonner.emilkowal.dev/) — Toast notifications
- [date-fns](https://date-fns.org/) — Date utilities
