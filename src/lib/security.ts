import { db } from "./db";

// ─── Rate Limiting ───────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const existing = await db.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStart) {
    // New window or expired window
    if (existing) {
      await db.rateLimit.update({
        where: { key },
        data: { count: 1, windowStart: new Date() },
      });
    } else {
      await db.rateLimit.create({
        data: { key, count: 1, windowStart: new Date() },
      });
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.windowStart.getTime() + windowMinutes * 60 * 1000),
    };
  }

  await db.rateLimit.update({
    where: { key },
    data: { count: existing.count + 1 },
  });

  return {
    allowed: true,
    remaining: maxRequests - existing.count - 1,
    resetAt: new Date(existing.windowStart.getTime() + windowMinutes * 60 * 1000),
  };
}

// ─── Login Attempt Tracking ──────────────────────────────────

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  userId?: string
) {
  const device = /mobile/i.test(userAgent || "") ? "Mobile" : /tablet/i.test(userAgent || "") ? "Tablet" : "Desktop";

  await db.loginHistory.create({
    data: {
      userId: userId || "",
      email,
      success,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      device,
      reason: success ? null : "Invalid credentials",
    },
  });

  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      if (success) {
        await db.user.update({
          where: { id: userId },
          data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
      } else {
        const attempts = user.loginAttempts + 1;
        const maxAttempts = 5;
        const lockoutMinutes = 30;

        await db.user.update({
          where: { id: userId },
          data: {
            loginAttempts: attempts,
            lockedUntil: attempts >= maxAttempts
              ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
              : null,
          },
        });
      }
    }
  }
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (!user.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

export async function getLoginHistory(params: {
  userId?: string;
  email?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.userId) where.userId = params.userId;
  if (params.email) where.email = params.email;

  const [history, total] = await Promise.all([
    db.loginHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.loginHistory.count({ where }),
  ]);

  return {
    history,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── CSRF Token ──────────────────────────────────────────────

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Input Sanitization ──────────────────────────────────────

export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ─── Password Strength ───────────────────────────────────────

export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Password should be at least 8 characters");

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else feedback.push("Include both uppercase and lowercase letters");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Include at least one number");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Include at least one special character");

  return { score, feedback };
}

// ─── Session Management ──────────────────────────────────────

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const token = generateCSRFToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return db.session.create({
    data: {
      userId,
      token,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });
}

export async function validateSession(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  // Update last active
  await db.session.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  });

  return session;
}

export async function deleteSession(token: string) {
  return db.session.deleteMany({ where: { token } });
}

export async function deleteAllUserSessions(userId: string) {
  return db.session.deleteMany({ where: { userId } });
}
