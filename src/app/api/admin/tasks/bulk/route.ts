import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "tasks:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { action, taskIds, data } = body;

    if (!action || !taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return Response.json({ error: "action and taskIds are required" }, { status: 400 });
    }

    const { ipAddress, userAgent, device } = getClientInfo(request);
    let updatedCount = 0;

    switch (action) {
      case "assign": {
        const { assigneeId } = data;
        if (!assigneeId) return Response.json({ error: "assigneeId is required" }, { status: 400 });

        const result = await db.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assigneeId },
        });
        updatedCount = result.count;

        // Notify assigned user
        const assignee = await db.user.findUnique({ where: { id: assigneeId }, select: { name: true } });
        await db.notification.create({
          data: {
            userId: assigneeId,
            title: "Tasks Assigned",
            message: `You have been assigned ${taskIds.length} task(s)`,
            type: "info",
          },
        });

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_assigned",
          resource: "task",
          after: { taskIds, assigneeId, assigneeName: assignee?.name, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      case "reassign": {
        const { fromAssigneeId, toAssigneeId } = data;
        if (!toAssigneeId) return Response.json({ error: "toAssigneeId is required" }, { status: 400 });

        const where: Record<string, unknown> = { id: { in: taskIds } };
        if (fromAssigneeId) where.assigneeId = fromAssigneeId;

        const result = await db.task.updateMany({
          where,
          data: { assigneeId: toAssigneeId },
        });
        updatedCount = result.count;

        const newAssignee = await db.user.findUnique({ where: { id: toAssigneeId }, select: { name: true } });
        await db.notification.create({
          data: {
            userId: toAssigneeId,
            title: "Tasks Reassigned",
            message: `${taskIds.length} task(s) have been reassigned to you`,
            type: "info",
          },
        });

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_reassigned",
          resource: "task",
          before: { fromAssigneeId },
          after: { toAssigneeId, toAssigneeName: newAssignee?.name, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      case "unassign": {
        const result = await db.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assigneeId: null },
        });
        updatedCount = result.count;

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_unassigned",
          resource: "task",
          after: { taskIds, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      case "changeStatus": {
        const { status } = data;
        if (!status) return Response.json({ error: "status is required" }, { status: 400 });

        const result = await db.task.updateMany({
          where: { id: { in: taskIds } },
          data: { status },
        });
        updatedCount = result.count;

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_status_changed",
          resource: "task",
          after: { taskIds, status, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      case "changePriority": {
        const { priority } = data;
        if (!priority) return Response.json({ error: "priority is required" }, { status: 400 });

        const result = await db.task.updateMany({
          where: { id: { in: taskIds } },
          data: { priority },
        });
        updatedCount = result.count;

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_priority_changed",
          resource: "task",
          after: { taskIds, priority, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      case "changeDueDate": {
        const { dueDate } = data;
        const result = await db.task.updateMany({
          where: { id: { in: taskIds } },
          data: { dueDate: dueDate ? new Date(dueDate) : null },
        });
        updatedCount = result.count;

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_due_date_changed",
          resource: "task",
          after: { taskIds, dueDate, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      case "delete": {
        const result = await db.task.deleteMany({
          where: { id: { in: taskIds } },
        });
        updatedCount = result.count;

        await createAuditLog({
          adminId: payload.userId,
          action: "task.bulk_deleted",
          resource: "task",
          before: { taskIds, count: taskIds.length },
          ipAddress, userAgent, device,
        });
        break;
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    return Response.json({ success: true, updatedCount });
  } catch (error) {
    console.error("Admin bulk task error:", error);
    return Response.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
