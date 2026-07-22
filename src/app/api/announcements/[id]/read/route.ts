import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await db.announcementRead.upsert({
      where: { announcementId_userId: { announcementId: id, userId: payload.userId } },
      update: { readAt: new Date() },
      create: { announcementId: id, userId: payload.userId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Announcement mark read error:", error);
    return Response.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
