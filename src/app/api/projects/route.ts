import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { projectSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await db.project.findMany({
      include: {
        tasks: { select: { id: true, status: true } },
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        workspace: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = projects.map((project) => ({
      ...project,
      taskCount: project.tasks.length,
      completedCount: project.tasks.filter((t) => t.status === "done").length,
    }));

    return Response.json({ projects: enriched });
  } catch (error) {
    console.error("Projects fetch error:", error);
    return Response.json(
      { error: "Failed to fetch projects" },
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
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const workspace = await db.workspace.findFirst({
      where: { members: { some: { userId: payload.userId } } },
    });

    if (!workspace) {
      return Response.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const project = await db.project.create({
      data: {
        ...result.data,
        color: result.data.color || "#6366f1",
        workspaceId: workspace.id,
        ownerId: payload.userId,
      },
      include: {
        tasks: { select: { id: true, status: true } },
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await db.activity.create({
      data: {
        type: "project.created",
        details: `Created project '${project.name}'`,
        userId: payload.userId,
      },
    });

    return Response.json({
      project: {
        ...project,
        taskCount: project.tasks.length,
        completedCount: project.tasks.filter((t) => t.status === "done").length,
      },
    });
  } catch (error) {
    console.error("Project create error:", error);
    return Response.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
