import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { taskSchema } from "@/lib/validations";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "tasks:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const projectId = searchParams.get("projectId") || "";
    const assigneeId = searchParams.get("assigneeId") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) where.title = { contains: search };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assigneeId) {
      if (assigneeId === "unassigned") {
        where.assigneeId = null;
      } else {
        where.assigneeId = assigneeId;
      }
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          project: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.task.count({ where }),
    ]);

    return Response.json({ tasks, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin tasks fetch error:", error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "tasks:create");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const result = taskSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Validate assignee exists if provided
    if (result.data.assigneeId) {
      const assignee = await db.user.findUnique({ where: { id: result.data.assigneeId } });
      if (!assignee) {
        return Response.json({ error: "Assignee not found" }, { status: 404 });
      }
    }

    const task = await db.task.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        status: result.data.status || "todo",
        priority: result.data.priority || "medium",
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        projectId: result.data.projectId,
        assigneeId: result.data.assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    // Notify assignee
    if (result.data.assigneeId) {
      const project = await db.project.findUnique({ where: { id: result.data.projectId }, select: { name: true } });
      await db.notification.create({
        data: {
          userId: result.data.assigneeId,
          title: "Task Assigned",
          message: `You have been assigned to task "${task.title}" in project "${project?.name}"`,
          type: "info",
        },
      });
    }

    // Log activity
    await db.activity.create({
      data: {
        type: "task.created",
        details: `Created task '${task.title}'`,
        taskId: task.id,
        userId: payload.userId,
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "task.created",
      resource: "task",
      resourceId: task.id,
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
    console.error("Admin task create error:", error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}
