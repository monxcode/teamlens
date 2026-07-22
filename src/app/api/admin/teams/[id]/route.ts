import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const MANAGEMENT_ROLES = ["super_admin", "admin"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, lastLoginAt: true } },
          },
        },
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!team) return Response.json({ error: "Team not found" }, { status: 404 });

    // Filter out management roles from member list
    const filteredMembers = team.members.filter(
      (m) => !MANAGEMENT_ROLES.includes(m.user.role)
    );

    const memberUserIds = filteredMembers.map((m) => m.user.id);

    // Get tasks assigned to team members
    const tasks = await db.task.findMany({
      where: { assigneeId: { in: memberUserIds } },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get projects team members are assigned to
    const projectMembers = await db.projectMember.findMany({
      where: { userId: { in: memberUserIds } },
      include: {
        project: {
          include: {
            tasks: { select: { id: true, status: true, assigneeId: true } },
            owner: { select: { id: true, name: true } },
          },
        },
        user: { select: { id: true, name: true } },
      },
    });

    // Get unique projects
    const projectMap = new Map<string, typeof projectMembers[0]["project"] & { members: string[] }>();
    for (const pm of projectMembers) {
      if (!projectMap.has(pm.project.id)) {
        projectMap.set(pm.project.id, { ...pm.project, members: [] });
      }
      projectMap.get(pm.project.id)!.members.push(pm.user.name);
    }
    const projects = Array.from(projectMap.values());

    // Get team assignments
    const teamAssignments = await db.teamAssignment.findMany({
      where: { teamId: id, status: "active" },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    });

    // Get recent activity related to team members
    const activities = await db.activity.findMany({
      where: { userId: { in: memberUserIds } },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get audit logs for this team
    const auditLogs = await db.auditLog.findMany({
      where: {
        OR: [
          { resource: "team", resourceId: id },
          { resourceId: { in: memberUserIds } },
        ],
      },
      include: {
        admin: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate member stats
    const memberStats = await Promise.all(
      filteredMembers.map(async (m) => {
        const memberTasks = tasks.filter((t) => t.assigneeId === m.user.id);
        const completedTasks = memberTasks.filter((t) => t.status === "done").length;
        const pendingTasks = memberTasks.filter((t) => t.status !== "done").length;
        const overdueTasks = memberTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
        ).length;

        const lastActivity = await db.activity.findFirst({
          where: { userId: m.user.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, details: true },
        });

        return {
          ...m,
          stats: {
            totalTasks: memberTasks.length,
            completedTasks,
            pendingTasks,
            overdueTasks,
            efficiency: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0,
          },
          lastActivity: lastActivity ? { time: lastActivity.createdAt, details: lastActivity.details } : null,
        };
      })
    );

    // Team statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const pendingTasks = tasks.filter((t) => t.status !== "done").length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length;

    const teamStats = {
      totalMembers: filteredMembers.length,
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };

    return Response.json({
      team: {
        ...team,
        members: memberStats,
        _count: { members: filteredMembers.length },
      },
      projects,
      tasks,
      teamAssignments,
      activities,
      auditLogs,
      stats: teamStats,
    });
  } catch (error) {
    console.error("Admin team fetch error:", error);
    return Response.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const before = await db.team.findUnique({ where: { id }, select: { name: true, status: true } });

    const team = await db.team.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: body.status === "archived" ? "team.archived" : body.status === "active" ? "team.restored" : "team.updated",
      resource: "team",
      resourceId: id,
      before,
      after: { name: team.name, status: team.status },
      ipAddress, userAgent, device,
    });

    return Response.json({ team });
  } catch (error) {
    console.error("Admin team update error:", error);
    return Response.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const team = await db.team.findUnique({ where: { id }, select: { name: true } });

    // Remove all members first
    await db.teamMember.deleteMany({ where: { teamId: id } });
    await db.teamAssignment.deleteMany({ where: { teamId: id } });
    await db.team.delete({ where: { id } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "team.deleted",
      resource: "team",
      resourceId: id,
      before: { name: team?.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin team delete error:", error);
    return Response.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
