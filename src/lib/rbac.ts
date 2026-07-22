import { db } from "./db";

// ─── Permission Cache ────────────────────────────────────────

const permissionCache = new Map<string, { permissions: string[]; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserPermissions(userId: string): Promise<string[]> {
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.name);
    }
  }

  const permsArray = Array.from(permissions);
  permissionCache.set(userId, {
    permissions: permsArray,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return permsArray;
}

export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function hasAnyPermission(userId: string, perms: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return perms.some((p) => permissions.includes(p));
}

export async function hasAllPermissions(userId: string, perms: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return perms.every((p) => permissions.includes(p));
}

// ─── Role Checks ─────────────────────────────────────────────

export async function getUserRoles(userId: string) {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role);
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some((r) => r.name === "super_admin");
}

export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some((r) => ["super_admin", "admin"].includes(r.name));
}

export async function isManagerOrAbove(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some((r) => ["super_admin", "admin", "manager"].includes(r.name));
}

// ─── Authorization Middleware ─────────────────────────────────

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
};

export async function authorize(
  user: AuthUser,
  permission: string
): Promise<{ allowed: boolean; error?: string }> {
  if (!user) {
    return { allowed: false, error: "Authentication required" };
  }

  const allowed = await hasPermission(user.userId, permission);
  if (!allowed) {
    return { allowed: false, error: "Insufficient permissions" };
  }

  return { allowed: true };
}

export async function authorizeAny(
  user: AuthUser,
  permissions: string[]
): Promise<{ allowed: boolean; error?: string }> {
  if (!user) {
    return { allowed: false, error: "Authentication required" };
  }

  const allowed = await hasAnyPermission(user.userId, permissions);
  if (!allowed) {
    return { allowed: false, error: "Insufficient permissions" };
  }

  return { allowed: true };
}

// ─── All Permissions List ────────────────────────────────────

export const ALL_PERMISSIONS = {
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  USERS_SUSPEND: "users:suspend",
  USERS_ACTIVATE: "users:activate",
  USERS_RESET_PASSWORD: "users:reset_password",
  USERS_CHANGE_ROLE: "users:change_role",
  ROLES_VIEW: "roles:view",
  ROLES_CREATE: "roles:create",
  ROLES_EDIT: "roles:edit",
  ROLES_DELETE: "roles:delete",
  ROLES_ASSIGN: "roles:assign",
  PROJECTS_VIEW: "projects:view",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_EDIT: "projects:edit",
  PROJECTS_DELETE: "projects:delete",
  PROJECTS_ARCHIVE: "projects:archive",
  PROJECTS_RESTORE: "projects:restore",
  TASKS_VIEW: "tasks:view",
  TASKS_CREATE: "tasks:create",
  TASKS_EDIT: "tasks:edit",
  TASKS_DELETE: "tasks:delete",
  TASKS_ASSIGN: "tasks:assign",
  WORKSPACES_VIEW: "workspaces:view",
  WORKSPACES_CREATE: "workspaces:create",
  WORKSPACES_EDIT: "workspaces:edit",
  WORKSPACES_DELETE: "workspaces:delete",
  TEAMS_VIEW: "teams:view",
  TEAMS_MANAGE: "teams:manage",
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",
  AUDIT_VIEW: "audit:view",
  SYSTEM_SETTINGS: "system:settings",
  SYSTEM_HEALTH: "system:health",
  SYSTEM_FEATURE_FLAGS: "system:feature_flags",
  SYSTEM_API_KEYS: "system:api_keys",
  SYSTEM_ANNOUNCEMENTS: "system:announcements",
  ACTIVITY_VIEW: "activity:view",
  NOTIFICATIONS_MANAGE: "notifications:manage",
} as const;
