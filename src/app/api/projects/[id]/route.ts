import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { position: "asc" },
        },
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ project });
  } catch (error) {
    console.error("Project fetch error:", error);
    return Response.json(
      { error: "Failed to fetch project" },
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
    await db.project.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Project delete error:", error);
    return Response.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
