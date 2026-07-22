import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// Admin roles that should NOT be counted as team members
const MANAGEMENT_ROLES = ["super_admin", "admin"];

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user to find their workspace
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Find user's workspace membership
    const workspaceMember = await db.workspaceMember.findFirst({
      where: { userId: payload.userId },
      select: { workspaceId: true },
    });

    if (!workspaceMember) {
      return Response.json({ teams: [], myTeam: null });
    }

    // Get all teams in the workspace
    const teams = await db.team.findMany({
      where: { workspaceId: workspaceMember.workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true, avatarUrl: true, role: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter out management roles from member lists and counts
    const enrichedTeams = teams.map((team) => {
      const filteredMembers = team.members.filter(
        (m) => !MANAGEMENT_ROLES.includes(m.user.role)
      );
      return {
        ...team,
        members: filteredMembers,
        _count: { members: filteredMembers.length },
      };
    });

    // Find the current user's team
    const myTeamMembership = await db.teamMember.findFirst({
      where: { userId: payload.userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true, name: true, email: true, avatarUrl: true, role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let myTeam = null;
    if (myTeamMembership) {
      const team = myTeamMembership.team;
      const filteredMembers = team.members.filter(
        (m) => !MANAGEMENT_ROLES.includes(m.user.role)
      );
      myTeam = {
        ...team,
        members: filteredMembers,
        myRole: myTeamMembership.role,
        _count: { members: filteredMembers.length },
      };
    }

    // Get tasks assigned to current user
    const myTasks = await db.task.findMany({
      where: { assigneeId: payload.userId },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get projects the user owns or is a member of
    const myProjects = await db.project.findMany({
      where: {
        OR: [
          { ownerId: payload.userId },
          { members: { some: { userId: payload.userId } } },
        ],
      },
      include: {
        tasks: { select: { id: true, status: true, assigneeId: true } },
      },
    });

    // Team statistics
    const teamStats = {
      totalTeams: enrichedTeams.length,
      totalMembers: enrichedTeams.reduce((sum, t) => sum + t._count.members, 0),
      myTeamName: myTeam?.name || null,
      myTasks: myTasks.length,
      myCompletedTasks: myTasks.filter((t) => t.status === "done").length,
      myProjects: myProjects.length,
    };

    return Response.json({
      teams: enrichedTeams,
      myTeam,
      myTasks,
      myProjects,
      stats: teamStats,
    });
  } catch (error) {
    console.error("Teams fetch error:", error);
    return Response.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
