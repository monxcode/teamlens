import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const task = await db.task.update({
      where: { id },
      data: body,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    if (body.status) {
      await db.activity.create({
        data: {
          type: `task.${body.status === "done" ? "completed" : "updated"}`,
          details: `Updated task '${task.title}' status to ${body.status}`,
          taskId: task.id,
          userId: payload.userId,
        },
      });
    }

    return Response.json({ task });
  } catch (error) {
    console.error("Task update error:", error);
    return Response.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.task.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Task delete error:", error);
    return Response.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
