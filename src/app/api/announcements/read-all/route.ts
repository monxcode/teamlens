import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, teamMemberships: { select: { teamId: true } } },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const teamIds = user.teamMemberships.map((tm) => tm.teamId);
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
      select: { id: true },
    });

    for (const a of announcements) {
      await db.announcementRead.upsert({
        where: { announcementId_userId: { announcementId: a.id, userId: payload.userId } },
        update: {},
        create: { announcementId: a.id, userId: payload.userId },
      }).catch(() => {});
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Announcements mark all read error:", error);
    return Response.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
