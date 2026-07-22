import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { taskSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ tasks });
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = taskSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
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

    await db.activity.create({
      data: {
        type: "task.created",
        details: `Created task '${task.title}'`,
        taskId: task.id,
        userId: payload.userId,
      },
    });

    return Response.json({ task });
  } catch (error) {
    console.error("Task create error:", error);
    return Response.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
