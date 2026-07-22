import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { canAccessTeamChat } from "@/lib/chat-rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = (await params).id;

    const canAccess = await canAccessTeamChat(payload.userId, teamId);
    if (!canAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const pinned = searchParams.get("pinned");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: Record<string, unknown> = { teamId };

    if (search) {
      where.content = { contains: search };
    }

    if (pinned === "true") {
      where.pinned = true;
    }

    const messages = await db.chatMessage.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    const unreadCount = await db.chatMessage.count({
      where: {
        teamId,
        userId: { not: payload.userId },
        readReceipts: { none: { userId: payload.userId } },
      },
    });

    const pinnedMessages = await db.chatMessage.findMany({
      where: { teamId, pinned: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        pinner: {
          select: { id: true, name: true },
        },
      },
      orderBy: { pinnedAt: "desc" },
    });

    return Response.json({
      messages: items.reverse(),
      pinnedMessages,
      unreadCount,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Chat messages fetch error:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = (await params).id;

    const canAccess = await canAccessTeamChat(payload.userId, teamId);
    if (!canAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content, replyToId } = body;

    if (!content?.trim()) {
      return Response.json({ error: "Message content is required" }, { status: 400 });
    }

    const message = await db.chatMessage.create({
      data: {
        content: content.trim(),
        teamId,
        userId: payload.userId,
        replyToId: replyToId || null,
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

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Chat message create error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
