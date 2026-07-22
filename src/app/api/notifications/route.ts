import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await db.notification.count({
      where: { userId: payload.userId, read: false },
    });

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: payload.userId, read: false },
      data: { read: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Notifications update error:", error);
    return Response.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.notification.deleteMany({
      where: { userId: payload.userId },
    });

    return Response.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error("Notifications delete error:", error);
    return Response.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
