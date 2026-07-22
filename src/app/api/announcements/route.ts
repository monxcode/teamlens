import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, teamMemberships: { select: { teamId: true } } },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const teamIds = user.teamMemberships.map((tm) => tm.teamId);

    // Find announcements targeted to this user
    const now = new Date();
    const announcements = await db.announcement.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [
              { targetType: "everyone" },
              { targetType: "roles", targetIds: { contains: user.role } },
              { targetType: "teams", AND: teamIds.map((tid) => ({ targetIds: { contains: tid } })) },
              { targetType: "users", targetIds: { contains: payload.userId } },
            ],
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reads: {
          where: { userId: payload.userId },
          select: { readAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      createdAt: a.createdAt,
      author: a.author,
      isRead: a.reads.length > 0,
      readAt: a.reads[0]?.readAt || null,
    }));

    const unreadCount = enriched.filter((a) => !a.isRead).length;

    return Response.json({ announcements: enriched, unreadCount });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return Response.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}
