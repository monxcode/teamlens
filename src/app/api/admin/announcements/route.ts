import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";
import { broadcastToUser, broadcastToAll } from "@/lib/socket-server";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:announcements");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const announcements = await db.announcement.findMany({
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reads: { select: { userId: true, readAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = announcements.map((a) => {
      const totalTargeted = a.targetType === "everyone" ? 0 : JSON.parse(a.targetIds).length;
      return {
        ...a,
        readCount: a.reads.length,
        totalTargeted: a.targetType === "everyone" ? "all" : totalTargeted,
        targetIds: JSON.parse(a.targetIds),
      };
    });

    return Response.json({ announcements: enriched });
  } catch (error) {
    console.error("Admin announcements fetch error:", error);
    return Response.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:announcements");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, message, type, targetType, targetIds, expiresAt } = body;

    if (!title || !message) return Response.json({ error: "Title and message are required" }, { status: 400 });

    const announcement = await db.announcement.create({
      data: {
        title,
        message,
        type: type || "info",
        targetType: targetType || "everyone",
        targetIds: JSON.stringify(targetIds || []),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorId: payload.userId,
      },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    // Resolve targeted user IDs for broadcasting (NOT for creating read records)
    const userIds = await resolveTargetUsers(targetType || "everyone", targetIds || []);

    // Broadcast to all targeted users via socket
    const broadcastData = {
      ...announcement,
      targetIds: JSON.parse(announcement.targetIds),
      readCount: 0,
      totalTargeted: targetType === "everyone" ? "all" : userIds.length,
      isRead: false,
    };

    for (const userId of userIds) {
      broadcastToUser(userId, "announcement:new", broadcastData);
    }

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "announcement.created",
      resource: "announcement",
      resourceId: announcement.id,
      after: { title, type, targetType, targetCount: userIds.length },
      ipAddress, userAgent, device,
    });

    return Response.json({ announcement: broadcastData });
  } catch (error) {
    console.error("Admin announcement create error:", error);
    return Response.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

async function resolveTargetUsers(targetType: string, targetIds: string[]): Promise<string[]> {
  switch (targetType) {
    case "everyone": {
      const users = await db.user.findMany({ select: { id: true } });
      return users.map((u) => u.id);
    }
    case "teams": {
      if (!targetIds.length) return [];
      const members = await db.teamMember.findMany({
        where: { teamId: { in: targetIds } },
        select: { userId: true },
      });
      return [...new Set(members.map((m) => m.userId))];
    }
    case "roles": {
      if (!targetIds.length) return [];
      const users = await db.user.findMany({
        where: { role: { in: targetIds } },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }
    case "users": {
      return targetIds;
    }
    default:
      return [];
  }
}
