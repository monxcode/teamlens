import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

// Admin roles that should NOT be counted as team members
const MANAGEMENT_ROLES = ["super_admin", "admin"];

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    const where: Record<string, unknown> = {};
    if (workspaceId) where.workspaceId = workspaceId;

    const teams = await db.team.findMany({
      where,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
        },
        workspace: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter out management roles from member lists
    const enrichedTeams = teams.map((team) => {
      const filteredMembers = team.members.filter(
        (m) => !MANAGEMENT_ROLES.includes(m.user.role)
      );
      return {
        ...team,
        members: filteredMembers,
        _count: { members: filteredMembers.length },
        rawMemberCount: team._count.members,
      };
    });

    return Response.json({ teams: enrichedTeams });
  } catch (error) {
    console.error("Admin teams fetch error:", error);
    return Response.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "teams:manage");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, description, workspaceId } = body;

    if (!name) return Response.json({ error: "Team name is required" }, { status: 400 });

    // Find workspace if not provided
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const workspace = await db.workspace.findFirst();
      if (!workspace) return Response.json({ error: "No workspace found" }, { status: 404 });
      targetWorkspaceId = workspace.id;
    }

    const team = await db.team.create({
      data: {
        name,
        description,
        workspaceId: targetWorkspaceId,
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "team.created",
      resource: "team",
      resourceId: team.id,
      after: { name, description },
      ipAddress, userAgent, device,
    });

    return Response.json({ team });
  } catch (error) {
    console.error("Admin team create error:", error);
    return Response.json({ error: "Failed to create team" }, { status: 500 });
  }
}
