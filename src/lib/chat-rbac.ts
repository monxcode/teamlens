import { db } from "./db";

export async function canAccessTeamChat(userId: string, teamId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;

  const membership = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  return !!membership;
}

export async function canModerateChat(userId: string, teamId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;

  const membership = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return membership?.role === "lead";
}

export async function canPinMessages(userId: string, teamId: string): Promise<boolean> {
  return canModerateChat(userId, teamId);
}
