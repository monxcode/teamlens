import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(payload.userId, "teams:view");
    if (!allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = (await params).id;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: Record<string, unknown> = { teamId };
    if (search) {
      where.content = { contains: search };
    }

    const messages = await db.chatMessage.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return Response.json({
      messages: items.reverse(),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Admin chat fetch error:", error);
    return Response.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
