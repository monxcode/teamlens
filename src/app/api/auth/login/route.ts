import { db } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { recordLoginAttempt } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      await recordLoginAttempt(email, false, ipAddress, userAgent);
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return Response.json(
        { error: "Account is temporarily locked. Please try again later." },
        { status: 423 }
      );
    }

    // Check if account is suspended
    if (user.status === "suspended") {
      return Response.json(
        { error: "Account has been suspended. Contact an administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      await recordLoginAttempt(email, false, ipAddress, userAgent, user.id);
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Successful login
    await recordLoginAttempt(email, true, ipAddress, userAgent, user.id);

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        forcePasswordReset: user.forcePasswordReset,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
