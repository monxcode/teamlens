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

    const allowed = await hasPermission(payload.userId, "projects:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const before = await db.project.findUnique({ where: { id }, select: { name: true, status: true } });

    const project = await db.project.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.color && { color: body.color }),
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: `project.${body.status === "archived" ? "archived" : body.status === "active" ? "restored" : "updated"}`,
      resource: "project",
      resourceId: id,
      before,
      after: { name: project.name, status: project.status },
      ipAddress, userAgent, device,
    });

    return Response.json({ project });
  } catch (error) {
    console.error("Admin project update error:", error);
    return Response.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "projects:delete");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const project = await db.project.findUnique({ where: { id }, select: { name: true } });
    await db.project.delete({ where: { id } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "project.deleted",
      resource: "project",
      resourceId: id,
      before: { name: project?.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin project delete error:", error);
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
