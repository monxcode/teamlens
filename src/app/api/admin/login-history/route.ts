import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { getLoginHistory } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "audit:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId") || undefined;
    const email = searchParams.get("email") || undefined;

    const result = await getLoginHistory({ userId, email, page, limit });
    return Response.json(result);
  } catch (error) {
    console.error("Admin login history error:", error);
    return Response.json({ error: "Failed to fetch login history" }, { status: 500 });
  }
}
