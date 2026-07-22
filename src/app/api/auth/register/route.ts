import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if registration is allowed
    const allowRegistration = await db.systemSetting.findUnique({ where: { key: "allow_registration" } });
    if (allowRegistration && allowRegistration.value === "false") {
      return Response.json({ error: "Registration is currently disabled" }, { status: 403 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // All registered users get the default "member" role.
    // Super Admin is created via the bootstrap seed script.
    const defaultRole = await db.role.findUnique({ where: { name: "member" } });

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "member",
        status: "active",
        emailVerified: true,
      },
    });

    // Assign role
    if (defaultRole) {
      await db.userRole.create({
        data: { userId: user.id, roleId: defaultRole.id },
      });
    }

    // Create workspace for the new user
    const workspace = await db.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
