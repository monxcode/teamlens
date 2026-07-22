import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

// Admin roles that should be excluded from team member counts
const MANAGEMENT_ROLES = ["super_admin", "admin"];

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "project" | "task"
    const teamId = searchParams.get("teamId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (teamId) where.teamId = teamId;

    const assignments = await db.teamAssignment.findMany({
      where,
      include: {
        team: {
          select: {
            id: true, name: true,
            members: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
        project: { select: { id: true, name: true, color: true, status: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter management roles from team member counts
    const enriched = assignments.map((a) => ({
      ...a,
      team: {
        ...a.team,
        members: a.team.members.filter((m) => !MANAGEMENT_ROLES.includes(m.user.role)),
        memberCount: a.team.members.filter((m) => !MANAGEMENT_ROLES.includes(m.user.role)).length,
      },
    }));

    return Response.json({ assignments: enriched });
  } catch (error) {
    console.error("Assignments fetch error:", error);
    return Response.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { type, teamId, projectId, taskId } = body;

    if (!type || !teamId) {
      return Response.json({ error: "type and teamId are required" }, { status: 400 });
    }

    if (type === "project" && !projectId) {
      return Response.json({ error: "projectId is required for project assignment" }, { status: 400 });
    }

    if (type === "task" && !taskId) {
      return Response.json({ error: "taskId is required for task assignment" }, { status: 400 });
    }

    // Check if team exists
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) return Response.json({ error: "Team not found" }, { status: 404 });

    // Check if project/task exists
    if (type === "project") {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (type === "task") {
      const task = await db.task.findUnique({ where: { id: taskId } });
      if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
    }

    // Check for existing assignment
    const existingWhere: Record<string, unknown> = { teamId, type };
    if (projectId) existingWhere.projectId = projectId;
    if (taskId) existingWhere.taskId = taskId;

    const existing = await db.teamAssignment.findFirst({ where: existingWhere });
    if (existing) {
      return Response.json({ error: "This team is already assigned to this resource" }, { status: 409 });
    }

    // Create the team assignment
    const assignment = await db.teamAssignment.create({
      data: {
        type,
        teamId,
        projectId: projectId || null,
        taskId: taskId || null,
        assignedBy: payload.userId,
      },
      include: {
        team: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Auto-assign to all current team members
    const teamMembers = await db.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    const memberUserIds = teamMembers.map((m) => m.userId);

    if (type === "project" && projectId) {
      // Add all team members as project members
      for (const userId of memberUserIds) {
        await db.projectMember.upsert({
          where: { userId_projectId: { userId, projectId } },
          update: {},
          create: { userId, projectId, role: "member" },
        });
      }

      // Notify team members
      const project = await db.project.findUnique({ where: { id: projectId }, select: { name: true } });
      for (const userId of memberUserIds) {
        await db.notification.create({
          data: {
            userId,
            title: "Project Assigned",
            message: `Your team has been assigned to project "${project?.name}"`,
            type: "info",
          },
        });
      }
    }

    if (type === "task" && taskId) {
      // Assign task to first team member (or keep unassigned for team tasks)
      // The task itself stays with its current assignee, but the team is linked
      const task = await db.task.findUnique({ where: { id: taskId }, select: { title: true } });
      for (const userId of memberUserIds) {
        await db.notification.create({
          data: {
            userId,
            title: "Task Assigned",
            message: `Your team has been assigned to task "${task?.title}"`,
            type: "info",
          },
        });
      }
    }

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: `assignment.created`,
      resource: "assignment",
      resourceId: assignment.id,
      after: {
        type,
        teamId,
        teamName: team.name,
        projectId: projectId || null,
        taskId: taskId || null,
        memberCount: memberUserIds.length,
      },
      ipAddress, userAgent, device,
    });

    return Response.json({ assignment, assignedTo: memberUserIds.length });
  } catch (error) {
    console.error("Assignment create error:", error);
    return Response.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return Response.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const assignment = await db.teamAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        team: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!assignment) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Remove assignment from team members
    const teamMembers = await db.teamMember.findMany({
      where: { teamId: assignment.teamId },
      select: { userId: true },
    });

    if (assignment.type === "project" && assignment.projectId) {
      for (const member of teamMembers) {
        await db.projectMember.deleteMany({
          where: { userId: member.userId, projectId: assignment.projectId },
        });
      }
    }

    // Delete the assignment
    await db.teamAssignment.delete({ where: { id: assignmentId } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "assignment.removed",
      resource: "assignment",
      resourceId: assignmentId,
      before: {
        type: assignment.type,
        teamName: assignment.team.name,
        projectName: assignment.project?.name,
        taskTitle: assignment.task?.title,
      },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Assignment delete error:", error);
    return Response.json({ error: "Failed to remove assignment" }, { status: 500 });
  }
}
