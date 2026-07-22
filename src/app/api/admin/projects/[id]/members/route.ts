import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "projects:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) return Response.json({ error: "User ID is required" }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const existing = await db.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });
    if (existing) return Response.json({ error: "User is already a member of this project" }, { status: 409 });

    const member = await db.projectMember.create({
      data: {
        userId,
        projectId: id,
        role: role || "member",
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const project = await db.project.findUnique({ where: { id }, select: { name: true } });
    await db.notification.create({
      data: {
        userId,
        title: "Project Assignment",
        message: `You have been added to project "${project?.name || "Unknown"}"`,
        type: "info",
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "project.member_added",
      resource: "project",
      resourceId: id,
      after: { userId, userName: user.name, projectName: project?.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ member });
  } catch (error) {
    console.error("Admin project member add error:", error);
    return Response.json({ error: "Failed to add project member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "projects:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    if (!projectId || !userId) {
      return Response.json({ error: "projectId and userId are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    await db.projectMember.deleteMany({ where: { userId, projectId } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "project.member_removed",
      resource: "project",
      resourceId: projectId,
      before: { userId, userName: user?.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin project member remove error:", error);
    return Response.json({ error: "Failed to remove project member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "projects:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { projectId, newOwnerId } = body;

    if (!projectId || !newOwnerId) {
      return Response.json({ error: "projectId and newOwnerId are required" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId }, select: { name: true, ownerId: true } });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const newOwner = await db.user.findUnique({ where: { id: newOwnerId }, select: { name: true } });

    await db.project.update({
      where: { id: projectId },
      data: { ownerId: newOwnerId },
    });

    // Ensure new owner is a project member
    await db.projectMember.upsert({
      where: { userId_projectId: { userId: newOwnerId, projectId } },
      update: { role: "admin" },
      create: { userId: newOwnerId, projectId, role: "admin" },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "project.ownership_transferred",
      resource: "project",
      resourceId: projectId,
      before: { ownerId: project.ownerId },
      after: { ownerId: newOwnerId, ownerName: newOwner?.name },
      ipAddress, userAgent, device,
    });

    await db.notification.create({
      data: {
        userId: newOwnerId,
        title: "Project Ownership Transferred",
        message: `You are now the owner of project "${project.name}"`,
        type: "success",
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin project transfer error:", error);
    return Response.json({ error: "Failed to transfer project ownership" }, { status: 500 });
  }
}
