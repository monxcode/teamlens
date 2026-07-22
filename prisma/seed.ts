import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Users
  { name: "users:view", module: "users", action: "view" },
  { name: "users:create", module: "users", action: "create" },
  { name: "users:edit", module: "users", action: "edit" },
  { name: "users:delete", module: "users", action: "delete" },
  { name: "users:suspend", module: "users", action: "suspend" },
  { name: "users:activate", module: "users", action: "activate" },
  { name: "users:reset_password", module: "users", action: "reset_password" },
  { name: "users:change_role", module: "users", action: "change_role" },
  // Roles
  { name: "roles:view", module: "roles", action: "view" },
  { name: "roles:create", module: "roles", action: "create" },
  { name: "roles:edit", module: "roles", action: "edit" },
  { name: "roles:delete", module: "roles", action: "delete" },
  { name: "roles:assign", module: "roles", action: "assign" },
  // Projects
  { name: "projects:view", module: "projects", action: "view" },
  { name: "projects:create", module: "projects", action: "create" },
  { name: "projects:edit", module: "projects", action: "edit" },
  { name: "projects:delete", module: "projects", action: "delete" },
  { name: "projects:archive", module: "projects", action: "archive" },
  { name: "projects:restore", module: "projects", action: "restore" },
  // Tasks
  { name: "tasks:view", module: "tasks", action: "view" },
  { name: "tasks:create", module: "tasks", action: "create" },
  { name: "tasks:edit", module: "tasks", action: "edit" },
  { name: "tasks:delete", module: "tasks", action: "delete" },
  { name: "tasks:assign", module: "tasks", action: "assign" },
  // Workspaces
  { name: "workspaces:view", module: "workspaces", action: "view" },
  { name: "workspaces:create", module: "workspaces", action: "create" },
  { name: "workspaces:edit", module: "workspaces", action: "edit" },
  { name: "workspaces:delete", module: "workspaces", action: "delete" },
  // Teams
  { name: "teams:view", module: "teams", action: "view" },
  { name: "teams:manage", module: "teams", action: "manage" },
  // Analytics
  { name: "analytics:view", module: "analytics", action: "view" },
  { name: "analytics:export", module: "analytics", action: "export" },
  // Audit
  { name: "audit:view", module: "audit", action: "view" },
  // System
  { name: "system:settings", module: "system", action: "settings" },
  { name: "system:health", module: "system", action: "health" },
  { name: "system:feature_flags", module: "system", action: "feature_flags" },
  { name: "system:api_keys", module: "system", action: "api_keys" },
  { name: "system:announcements", module: "system", action: "announcements" },
  // Activity
  { name: "activity:view", module: "activity", action: "view" },
  // Notifications
  { name: "notifications:manage", module: "notifications", action: "manage" },
];

const ROLES = [
  {
    name: "super_admin",
    description: "Full system access. Can manage all users, roles, settings, and system configuration.",
    isSystem: true,
    isDefault: false,
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: "admin",
    description: "Administrative access. Can manage users, projects, and view analytics.",
    isSystem: true,
    isDefault: false,
    permissions: [
      "users:view", "users:create", "users:edit", "users:suspend", "users:activate",
      "roles:view",
      "projects:view", "projects:create", "projects:edit", "projects:delete", "projects:archive", "projects:restore",
      "tasks:view", "tasks:create", "tasks:edit", "tasks:delete", "tasks:assign",
      "workspaces:view", "workspaces:edit",
      "teams:view", "teams:manage",
      "analytics:view", "analytics:export",
      "audit:view",
      "activity:view",
      "notifications:manage",
    ],
  },
  {
    name: "manager",
    description: "Can manage projects, tasks, and team members within their scope.",
    isSystem: true,
    isDefault: false,
    permissions: [
      "projects:view", "projects:create", "projects:edit", "projects:archive",
      "tasks:view", "tasks:create", "tasks:edit", "tasks:delete", "tasks:assign",
      "workspaces:view",
      "teams:view",
      "analytics:view",
      "activity:view",
    ],
  },
  {
    name: "team_lead",
    description: "Can manage tasks and view team analytics.",
    isSystem: true,
    isDefault: false,
    permissions: [
      "projects:view",
      "tasks:view", "tasks:create", "tasks:edit", "tasks:delete", "tasks:assign",
      "teams:view",
      "analytics:view",
      "activity:view",
    ],
  },
  {
    name: "member",
    description: "Standard team member. Can view and manage assigned tasks.",
    isSystem: true,
    isDefault: true,
    permissions: [
      "projects:view",
      "tasks:view", "tasks:create", "tasks:edit",
      "teams:view",
    ],
  },
  {
    name: "viewer",
    description: "Read-only access. Can view projects, tasks, and analytics.",
    isSystem: true,
    isDefault: false,
    permissions: [
      "projects:view",
      "tasks:view",
      "teams:view",
      "analytics:view",
      "activity:view",
    ],
  },
];

async function main() {
  console.log("Seeding roles and permissions...");

  // Create permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`  Created ${PERMISSIONS.length} permissions`);

  // Create roles with permissions
  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description, isSystem: roleData.isSystem, isDefault: roleData.isDefault },
      create: {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        isDefault: roleData.isDefault,
      },
    });

    // Assign permissions to role
    for (const permName of roleData.permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
    console.log(`  Created role: ${roleData.name} (${roleData.permissions.length} permissions)`);
  }

  // Create default system settings
  const settings = [
    { key: "site_name", value: "Pulse", category: "general" },
    { key: "site_description", value: "Team Analytics & Productivity Intelligence", category: "general" },
    { key: "allow_registration", value: "true", category: "auth" },
    { key: "require_email_verification", value: "false", category: "auth" },
    { key: "max_login_attempts", value: "5", category: "security" },
    { key: "lockout_duration_minutes", value: "30", category: "security" },
    { key: "session_timeout_hours", value: "168", category: "auth" },
    { key: "enable_2fa", value: "false", category: "auth" },
    { key: "rate_limit_requests", value: "100", category: "security" },
    { key: "rate_limit_window_minutes", value: "15", category: "security" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`  Created ${settings.length} system settings`);

  // Create default feature flags
  const flags = [
    { name: "dark_mode", description: "Enable dark mode toggle", enabled: true },
    { name: "notifications", description: "Enable notification system", enabled: true },
    { name: "analytics_dashboard", description: "Enable analytics dashboard", enabled: true },
    { name: "two_factor_auth", description: "Enable two-factor authentication", enabled: false },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: { enabled: flag.enabled },
      create: flag,
    });
  }
  console.log(`  Created ${flags.length} feature flags`);

  // ─── Bootstrap Super Admin ──────────────────────────────────
  // Create the initial Super Admin account only if none exists.
  // This account must change its password on first login.
  const bcrypt = await import("bcryptjs");
  const existingSuperAdmin = await prisma.userRole.findFirst({
    where: { role: { name: "super_admin" } },
  });

  if (!existingSuperAdmin) {
    const bootstrapEmail = "admin@pulse.com";
    const existingUser = await prisma.user.findUnique({ where: { email: bootstrapEmail } });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("password123", 12);
      const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });

      const adminUser = await prisma.user.create({
        data: {
          email: bootstrapEmail,
          name: "Administrator",
          password: hashedPassword,
          role: "super_admin",
          status: "active",
          emailVerified: true,
          forcePasswordReset: true,
        },
      });

      if (superAdminRole) {
        await prisma.userRole.create({
          data: { userId: adminUser.id, roleId: superAdminRole.id },
        });
      }

      // Create a workspace for the admin
      await prisma.workspace.create({
        data: {
          name: "Administration",
          slug: "administration",
          members: {
            create: { userId: adminUser.id, role: "owner" },
          },
        },
      });

      console.log(`  Bootstrap Super Admin created: ${bootstrapEmail}`);
      console.log("  IMPORTANT: Change the default password immediately after first login.");
    } else {
      console.log(`  Bootstrap Skipped: User ${bootstrapEmail} already exists.`);
    }
  } else {
    console.log("  Bootstrap Skipped: Super Admin already exists in the system.");
  }

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
