import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const announcements = await db.announcement.findMany({
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ announcements });
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
    const { title, message, type } = body;

    if (!title || !message) return Response.json({ error: "Title and message are required" }, { status: 400 });

    const announcement = await db.announcement.create({
      data: { title, message, type: type || "info", authorId: payload.userId },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "announcement.created",
      resource: "announcement",
      resourceId: announcement.id,
      after: { title, type },
      ipAddress, userAgent, device,
    });

    return Response.json({ announcement });
  } catch (error) {
    console.error("Admin announcement create error:", error);
    return Response.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
