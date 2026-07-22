import { db } from "./db";

export interface AuditLogEntry {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    await db.auditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        before: entry.before ? JSON.stringify(entry.before) : null,
        after: entry.after ? JSON.stringify(entry.after) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        device: entry.device || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function getClientInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const device = parseDevice(userAgent);
  return { ipAddress, userAgent, device };
}

function parseDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "Mobile";
  if (/tablet/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.adminId) where.adminId = params.adminId;
  if (params.action) where.action = { contains: params.action };
  if (params.resource) where.resource = params.resource;
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(params.startDate);
    if (params.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(params.endDate);
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
