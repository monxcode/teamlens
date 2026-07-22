import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { canAccessTeamChat, canModerateChat } from "@/lib/chat-rbac";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, messageId } = await params;

    const canAccess = await canAccessTeamChat(payload.userId, teamId);
    if (!canAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.chatMessage.findUnique({ where: { id: messageId } });
    if (!existing) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.userId !== payload.userId) {
      return Response.json({ error: "Cannot edit another user's message" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.content?.trim()) {
      return Response.json({ error: "Message content is required" }, { status: 400 });
    }

    const message = await db.chatMessage.update({
      where: { id: messageId },
      data: {
        content: body.content.trim(),
        editedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        replyTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, role: true },
            },
          },
        },
        readReceipts: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return Response.json({ message });
  } catch (error) {
    console.error("Chat message edit error:", error);
    return Response.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, messageId } = await params;

    const canAccess = await canAccessTeamChat(payload.userId, teamId);
    if (!canAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.chatMessage.findUnique({ where: { id: messageId } });
    if (!existing) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const canModerate = await canModerateChat(payload.userId, teamId);
    if (existing.userId !== payload.userId && !canModerate) {
      return Response.json({ error: "Cannot delete this message" }, { status: 403 });
    }

    await db.chatReadReceipt.deleteMany({ where: { messageId } });
    await db.chatMessage.delete({ where: { id: messageId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Chat message delete error:", error);
    return Response.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
