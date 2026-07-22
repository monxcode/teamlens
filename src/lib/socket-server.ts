import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "pulse-jwt-secret-fallback";

interface AuthPayload {
  userId: string;
  email: string;
  name: string;
}

const onlineUsers = new Map<string, Set<string>>();

function getOnlineUserIds(teamId: string): string[] {
  return Array.from(onlineUsers.get(teamId) || []);
}

export function initSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user as AuthPayload;

    socket.on("chat:join", async ({ teamId }: { teamId: string }) => {
      if (!teamId) return;

      const canAccess = await canAccessTeamChat(user.userId, teamId);
      if (!canAccess) {
        socket.emit("chat:error", { message: "Access denied" });
        return;
      }

      socket.join(`team:${teamId}`);

      if (!onlineUsers.has(teamId)) {
        onlineUsers.set(teamId, new Set());
      }
      onlineUsers.get(teamId)!.add(user.userId);

      io.to(`team:${teamId}`).emit("chat:online", {
        teamId,
        userIds: getOnlineUserIds(teamId),
      });
    });

    socket.on("chat:leave", ({ teamId }: { teamId: string }) => {
      socket.leave(`team:${teamId}`);

      if (onlineUsers.has(teamId)) {
        onlineUsers.get(teamId)!.delete(user.userId);
        if (onlineUsers.get(teamId)!.size === 0) {
          onlineUsers.delete(teamId);
        }
      }

      io.to(`team:${teamId}`).emit("chat:online", {
        teamId,
        userIds: getOnlineUserIds(teamId),
      });
    });

    socket.on("chat:typing", ({ teamId, isTyping }: { teamId: string; isTyping: boolean }) => {
      socket.to(`team:${teamId}`).emit("chat:typing", {
        teamId,
        userId: user.userId,
        name: user.name,
        isTyping,
      });
    });

    socket.on("chat:read", async ({ teamId, messageIds }: { teamId: string; messageIds: string[] }) => {
      if (!messageIds?.length) return;

      try {
        const now = new Date();
        for (const messageId of messageIds) {
          await db.chatReadReceipt.upsert({
            where: { messageId_userId: { messageId, userId: user.userId } },
            update: { readAt: now },
            create: { messageId, userId: user.userId, readAt: now },
          });
        }

        io.to(`team:${teamId}`).emit("chat:read-receipt", {
          teamId,
          messageIds,
          userId: user.userId,
          readAt: now.toISOString(),
        });
      } catch (error) {
        console.error("Chat read receipt error:", error);
      }
    });

    socket.on("chat:message", async ({ teamId, content, replyToId }: { teamId: string; content: string; replyToId?: string }) => {
      if (!teamId || !content?.trim()) return;

      try {
        const canAccess = await canAccessTeamChat(user.userId, teamId);
        if (!canAccess) {
          socket.emit("chat:error", { message: "Access denied" });
          return;
        }

        const message = await db.chatMessage.create({
          data: {
            content: content.trim(),
            teamId,
            userId: user.userId,
            replyToId: replyToId || null,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, role: true },
            },
            replyTo: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
            readReceipts: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });

        io.to(`team:${teamId}`).emit("chat:message", message);
      } catch (error) {
        console.error("Chat message error:", error);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    socket.on("chat:edit", async ({ teamId, messageId, content }: { teamId: string; messageId: string; content: string }) => {
      if (!messageId || !content?.trim()) return;

      try {
        const existing = await db.chatMessage.findUnique({ where: { id: messageId } });
        if (!existing || existing.userId !== user.userId) {
          socket.emit("chat:error", { message: "Cannot edit this message" });
          return;
        }

        const updated = await db.chatMessage.update({
          where: { id: messageId },
          data: { content: content.trim(), editedAt: new Date() },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, role: true },
            },
            replyTo: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
            readReceipts: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        });

        io.to(`team:${teamId}`).emit("chat:edit", updated);
      } catch (error) {
        console.error("Chat edit error:", error);
        socket.emit("chat:error", { message: "Failed to edit message" });
      }
    });

    socket.on("chat:delete", async ({ teamId, messageId }: { teamId: string; messageId: string }) => {
      if (!messageId) return;

      try {
        const existing = await db.chatMessage.findUnique({ where: { id: messageId } });
        if (!existing) return;

        const userRole = await getUserRole(user.userId);
        const isAdmin = userRole === "super_admin" || userRole === "admin";
        const isTeamLead = await isUserTeamLead(user.userId, teamId);

        if (existing.userId !== user.userId && !isAdmin && !isTeamLead) {
          socket.emit("chat:error", { message: "Cannot delete this message" });
          return;
        }

        await db.chatReadReceipt.deleteMany({ where: { messageId } });
        await db.chatMessage.delete({ where: { id: messageId } });

        io.to(`team:${teamId}`).emit("chat:delete", { teamId, messageId });
      } catch (error) {
        console.error("Chat delete error:", error);
        socket.emit("chat:error", { message: "Failed to delete message" });
      }
    });

    socket.on("chat:pin", async ({ teamId, messageId }: { teamId: string; messageId: string }) => {
      if (!messageId) return;

      try {
        const existing = await db.chatMessage.findUnique({ where: { id: messageId } });
        if (!existing) return;

        const userRole = await getUserRole(user.userId);
        const isTeamLead = await isUserTeamLead(user.userId, teamId);
        const canPin = userRole === "super_admin" || userRole === "admin" || isTeamLead;

        if (!canPin) {
          socket.emit("chat:error", { message: "Cannot pin messages" });
          return;
        }

        const now = existing.pinned ? null : new Date();
        const updated = await db.chatMessage.update({
          where: { id: messageId },
          data: {
            pinned: !existing.pinned,
            pinnedAt: now,
            pinnedBy: now ? user.userId : null,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, role: true },
            },
            pinner: {
              select: { id: true, name: true },
            },
          },
        });

        io.to(`team:${teamId}`).emit("chat:pin", updated);
      } catch (error) {
        console.error("Chat pin error:", error);
        socket.emit("chat:error", { message: "Failed to pin message" });
      }
    });

    socket.on("disconnect", () => {
      for (const [teamId, userIds] of onlineUsers.entries()) {
        if (userIds.has(user.userId)) {
          userIds.delete(user.userId);
          if (userIds.size === 0) {
            onlineUsers.delete(teamId);
          }
          io.to(`team:${teamId}`).emit("chat:online", {
            teamId,
            userIds: getOnlineUserIds(teamId),
          });
        }
      }
    });
  });

  return io;
}

async function canAccessTeamChat(userId: string, teamId: string): Promise<boolean> {
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

async function getUserRole(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role || null;
}

async function isUserTeamLead(userId: string, teamId: string): Promise<boolean> {
  const membership = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return membership?.role === "lead";
}
