import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "tasks:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    // Get current task state
    const before = await db.task.findUnique({
      where: { id },
      select: { title: true, status: true, priority: true, assigneeId: true, projectId: true },
    });

    if (!before) return Response.json({ error: "Task not found" }, { status: 404 });

    // Validate new assignee if provided
    if (body.assigneeId !== undefined && body.assigneeId !== null) {
      const assignee = await db.user.findUnique({ where: { id: body.assigneeId } });
      if (!assignee) {
        return Response.json({ error: "Assignee not found" }, { status: 404 });
      }
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Notify on assignee change
    if (body.assigneeId !== undefined && body.assigneeId !== before.assigneeId) {
      if (body.assigneeId) {
        // New assignee
        await db.notification.create({
          data: {
            userId: body.assigneeId,
            title: "Task Assigned",
            message: `You have been assigned to task "${task.title}"`,
            type: "info",
          },
        });
      }
      if (before.assigneeId && body.assigneeId !== before.assigneeId) {
        // Old assignee removed
        await db.notification.create({
          data: {
            userId: before.assigneeId,
            title: "Task Unassigned",
            message: `You have been unassigned from task "${task.title}"`,
            type: "warning",
          },
        });
      }
    }

    // Notify on status change
    if (body.status && body.status !== before.status && task.assigneeId) {
      await db.notification.create({
        data: {
          userId: task.assigneeId,
          title: "Task Status Updated",
          message: `Task "${task.title}" status changed to ${body.status}`,
          type: "info",
        },
      });
    }

    // Log activity
    await db.activity.create({
      data: {
        type: body.status === "done" ? "task.completed" : "task.updated",
        details: `Updated task '${task.title}'`,
        taskId: task.id,
        userId: payload.userId,
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "task.updated",
      resource: "task",
      resourceId: id,
      before,
      after: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee?.name || null,
      },
      ipAddress, userAgent, device,
    });

    return Response.json({ task });
  } catch (error) {
    console.error("Admin task update error:", error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "tasks:delete");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const task = await db.task.findUnique({ where: { id }, select: { title: true, assigneeId: true } });

    if (task?.assigneeId) {
      await db.notification.create({
        data: {
          userId: task.assigneeId,
          title: "Task Deleted",
          message: `Task "${task.title}" has been deleted`,
          type: "warning",
        },
      });
    }

    await db.task.delete({ where: { id } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "task.deleted",
      resource: "task",
      resourceId: id,
      before: { title: task?.title },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin task delete error:", error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
