```
teamlens/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ public/
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ src/
│  ├─ app/
│  │  ├─ admin/
│  │  │  ├─ activity/
│  │  │  │  └─ page.tsx
│  │  │  ├─ analytics/
│  │  │  │  └─ page.tsx
│  │  │  ├─ announcements/
│  │  │  │  └─ page.tsx
│  │  │  ├─ assignments/
│  │  │  │  └─ page.tsx
│  │  │  ├─ audit/
│  │  │  │  └─ page.tsx
│  │  │  ├─ dashboard/
│  │  │  │  └─ page.tsx
│  │  │  ├─ feature-flags/
│  │  │  │  └─ page.tsx
│  │  │  ├─ health/
│  │  │  │  └─ page.tsx
│  │  │  ├─ login-history/
│  │  │  │  └─ page.tsx
│  │  │  ├─ permissions/
│  │  │  │  └─ page.tsx
│  │  │  ├─ projects/
│  │  │  │  └─ page.tsx
│  │  │  ├─ roles/
│  │  │  │  └─ page.tsx
│  │  │  ├─ settings/
│  │  │  │  └─ page.tsx
│  │  │  ├─ tasks/
│  │  │  │  └─ page.tsx
│  │  │  ├─ teams/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ chat/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ users/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ workspaces/
│  │  │  │  └─ page.tsx
│  │  │  └─ layout.tsx
│  │  ├─ api/
│  │  │  ├─ activities/
│  │  │  │  └─ route.ts
│  │  │  ├─ admin/
│  │  │  │  ├─ activity/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ analytics/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ announcements/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ assignments/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ audit/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ feature-flags/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ health/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ login-history/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ permissions/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ projects/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  ├─ members/
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ roles/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  ├─ permissions/
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ settings/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ tasks/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ bulk/
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ teams/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  ├─ chat/
│  │  │  │  │  │  │  ├─ [messageId]/
│  │  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  ├─ members/
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ users/
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  ├─ reset-password/
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  ├─ role/
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  ├─ suspend/
│  │  │  │  │  │  │  └─ route.ts
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ workspaces/
│  │  │  │     └─ route.ts
│  │  │  ├─ announcements/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ read/
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ read-all/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ auth/
│  │  │  │  ├─ change-password/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ login/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ me/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ register/
│  │  │  │     └─ route.ts
│  │  │  ├─ chat/
│  │  │  │  └─ upload/
│  │  │  │     └─ route.ts
│  │  │  ├─ notifications/
│  │  │  │  └─ route.ts
│  │  │  ├─ projects/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ tasks/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ teams/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ chat/
│  │  │  │  │     ├─ [messageId]/
│  │  │  │  │     │  └─ route.ts
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ user/
│  │  │     └─ avatar/
│  │  │        └─ route.ts
│  │  ├─ change-password/
│  │  │  └─ page.tsx
│  │  ├─ dashboard/
│  │  │  ├─ announcements/
│  │  │  │  └─ page.tsx
│  │  │  ├─ projects/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ settings/
│  │  │  │  └─ page.tsx
│  │  │  ├─ tasks/
│  │  │  │  └─ page.tsx
│  │  │  ├─ team/
│  │  │  │  ├─ chat/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  ├─ register/
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ announcements/
│  │  │  └─ announcement-banner.tsx
│  │  ├─ auth/
│  │  │  ├─ change-password-form.tsx
│  │  │  ├─ login-form.tsx
│  │  │  └─ register-form.tsx
│  │  ├─ chat/
│  │  │  ├─ attachment-button.tsx
│  │  │  ├─ attachment-renderer.tsx
│  │  │  ├─ chat-header.tsx
│  │  │  ├─ chat-input.tsx
│  │  │  ├─ chat-message.tsx
│  │  │  ├─ context-menu.tsx
│  │  │  ├─ emoji-picker.tsx
│  │  │  ├─ lightbox.tsx
│  │  │  └─ typing-indicator.tsx
│  │  ├─ dashboard/
│  │  │  ├─ progress-ring.tsx
│  │  │  ├─ project-color.tsx
│  │  │  ├─ skeleton.tsx
│  │  │  └─ stat-card.tsx
│  │  ├─ landing/
│  │  │  └─ landing-page.tsx
│  │  ├─ layout/
│  │  │  ├─ dashboard-shell.tsx
│  │  │  ├─ header.tsx
│  │  │  └─ sidebar.tsx
│  │  ├─ providers/
│  │  │  ├─ auth-provider.tsx
│  │  │  └─ theme-provider.tsx
│  │  └─ ui/
│  │     ├─ avatar-upload.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ date-time-picker.tsx
│  │     ├─ empty-state.tsx
│  │     ├─ input.tsx
│  │     ├─ modal.tsx
│  │     ├─ select.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ textarea.tsx
│  │     └─ toggle.tsx
│  ├─ hooks/
│  │  ├─ use-chat-socket.ts
│  │  ├─ use-file-upload.ts
│  │  └─ use-polling.ts
│  ├─ lib/
│  │  ├─ audit.ts
│  │  ├─ auth.ts
│  │  ├─ chat-rbac.ts
│  │  ├─ db.ts
│  │  ├─ rbac.ts
│  │  ├─ security.ts
│  │  ├─ socket-client.ts
│  │  ├─ socket-server.ts
│  │  ├─ utils.ts
│  │  └─ validations.ts
│  └─ stores/
│     ├─ auth-store.ts
│     ├─ sidebar-store.ts
│     └─ theme-store.ts
├─ SYSTEM_DOC/
│  ├─ BUG.md
│  ├─ DESIGN.md
│  ├─ FOLDER_STRUCTURE.md
│  └─ PRD.md
├─ .dockerignore
├─ .env.example
├─ .gitignore
├─ Dockerfile
├─ README.md
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.ts
├─ package.json
├─ postcss.config.mjs
├─ server.ts
└─ tsconfig.json
```
