import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: teamId, messageId } = await params;

    const existing = await db.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    if (!existing) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    await db.chatReadReceipt.deleteMany({ where: { messageId } });
    await db.chatMessage.delete({ where: { id: messageId } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "chat.message_deleted",
      resource: "chat",
      resourceId: messageId,
      before: {
        content: existing.content,
        userId: existing.userId,
        userName: existing.user.name,
        teamId,
      },
      ipAddress,
      userAgent,
      device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin chat message delete error:", error);
    return Response.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
