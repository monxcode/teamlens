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

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) return Response.json({ error: "User ID is required" }, { status: 400 });

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // Check if already a member
    const existing = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: id } },
    });
    if (existing) return Response.json({ error: "User is already a member of this team" }, { status: 409 });

    // Remove from other teams in the same workspace first
    const team = await db.team.findUnique({ where: { id }, select: { workspaceId: true, name: true } });
    if (team) {
      const otherTeams = await db.team.findMany({
        where: { workspaceId: team.workspaceId, id: { not: id } },
        select: { id: true },
      });
      for (const otherTeam of otherTeams) {
        await db.teamMember.deleteMany({
          where: { userId, teamId: otherTeam.id },
        });
      }
    }

    const member = await db.teamMember.create({
      data: {
        userId,
        teamId: id,
        role: role || "member",
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Inherit active team assignments
    const activeAssignments = await db.teamAssignment.findMany({
      where: { teamId: id, status: "active" },
    });

    let inheritedProjects = 0;
    let inheritedTasks = 0;

    for (const assignment of activeAssignments) {
      if (assignment.type === "project" && assignment.projectId) {
        await db.projectMember.upsert({
          where: { userId_projectId: { userId, projectId: assignment.projectId } },
          update: {},
          create: { userId, projectId: assignment.projectId, role: "member" },
        });
        inheritedProjects++;
      }
      if (assignment.type === "task" && assignment.taskId) {
        inheritedTasks++;
      }
    }

    // Create notification for the user
    const inheritanceMsg = inheritedProjects > 0 || inheritedTasks > 0
      ? ` You have also inherited ${inheritedProjects} project(s) and ${inheritedTasks} task(s) from team assignments.`
      : "";
    await db.notification.create({
      data: {
        userId,
        title: "Team Assignment",
        message: `You have been assigned to team "${team?.name || "Unknown"}".${inheritanceMsg}`,
        type: "info",
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "team.member_added",
      resource: "team",
      resourceId: id,
      after: { userId, userName: user.name, role: role || "member" },
      ipAddress, userAgent, device,
    });

    return Response.json({ member });
  } catch (error) {
    console.error("Admin team member add error:", error);
    return Response.json({ error: "Failed to add team member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const userId = searchParams.get("userId");

    if (!teamId || !userId) {
      return Response.json({ error: "teamId and userId are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });

    await db.teamMember.deleteMany({
      where: { userId, teamId },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: "Removed from Team",
        message: `You have been removed from a team`,
        type: "warning",
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "team.member_removed",
      resource: "team",
      resourceId: teamId,
      before: { userId, userName: user?.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin team member remove error:", error);
    return Response.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { userId, teamId, newTeamId, role } = body;

    // Move user to another team
    if (newTeamId && teamId && userId) {
      await db.teamMember.deleteMany({ where: { userId, teamId } });
      await db.teamMember.create({
        data: { userId, teamId: newTeamId, role: role || "member" },
      });

      const newTeam = await db.team.findUnique({ where: { id: newTeamId }, select: { name: true } });
      await db.notification.create({
        data: {
          userId,
          title: "Team Transfer",
          message: `You have been moved to team "${newTeam?.name || "Unknown"}"`,
          type: "info",
        },
      });

      const { ipAddress, userAgent, device } = getClientInfo(request);
      await createAuditLog({
        adminId: payload.userId,
        action: "team.member_moved",
        resource: "team",
        resourceId: teamId,
        before: { userId, fromTeamId: teamId },
        after: { userId, toTeamId: newTeamId },
        ipAddress, userAgent, device,
      });

      return Response.json({ success: true });
    }

    // Change team lead
    if (userId && teamId && role) {
      await db.teamMember.updateMany({
        where: { userId, teamId },
        data: { role },
      });

      const { ipAddress, userAgent, device } = getClientInfo(request);
      await createAuditLog({
        adminId: payload.userId,
        action: role === "lead" ? "team.lead_assigned" : "team.lead_removed",
        resource: "team",
        resourceId: teamId,
        after: { userId, role },
        ipAddress, userAgent, device,
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Admin team member update error:", error);
    return Response.json({ error: "Failed to update team member" }, { status: 500 });
  }
}
