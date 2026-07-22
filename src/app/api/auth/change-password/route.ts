import { db } from "@/lib/db";
import { getUserFromRequest, verifyPassword, hashPassword } from "@/lib/auth";
import { clearPermissionCache } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return Response.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id: payload.userId },
      data: {
        password: hashedPassword,
        forcePasswordReset: false,
      },
    });

    clearPermissionCache(payload.userId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
