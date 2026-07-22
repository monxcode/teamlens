import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";
import { broadcastToAll } from "@/lib/socket-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:announcements");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const announcement = await db.announcement.update({
      where: { id },
      data: { active: body.active },
    });

    return Response.json({ announcement });
  } catch (error) {
    console.error("Announcement update error:", error);
    return Response.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:announcements");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Fetch the announcement before deletion for audit log
    const announcement = await db.announcement.findUnique({
      where: { id },
      select: { id: true, title: true, type: true, targetType: true },
    });

    // Delete read records first, then the announcement
    await db.announcementRead.deleteMany({ where: { announcementId: id } });
    await db.announcement.delete({ where: { id } });

    // Broadcast deletion to all connected users
    broadcastToAll("announcement:deleted", { announcementId: id });

    // Audit log
    if (announcement) {
      const { ipAddress, userAgent, device } = getClientInfo(request);
      await createAuditLog({
        adminId: payload.userId,
        action: "announcement.deleted",
        resource: "announcement",
        resourceId: id,
        before: { title: announcement.title, type: announcement.type, targetType: announcement.targetType },
        ipAddress, userAgent, device,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Announcement delete error:", error);
    return Response.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
