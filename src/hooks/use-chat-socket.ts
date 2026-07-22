"use client";

import { useEffect, useRef, useCallback } from "react";
import { connectSocket, getSocket, disconnectSocket } from "@/lib/socket-client";
import { useAuthStore } from "@/stores/auth-store";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export interface ChatMessageData {
  id: string;
  content: string;
  type: string;
  editedAt: string | null;
  pinned: boolean;
  pinnedAt: string | null;
  pinnedBy: string | null;
  replyToId: string | null;
  createdAt: string;
  teamId: string;
  userId: string;
  user: ChatUser;
  pinner: { id: string; name: string } | null;
  replyTo: {
    id: string;
    content: string;
    user: { id: string; name: string; avatarUrl: string | null };
  } | null;
  readReceipts: {
    id: string;
    readAt: string;
    userId: string;
    user: { id: string; name: string };
  }[];
}

export interface TypingUser {
  teamId: string;
  userId: string;
  name: string;
  isTyping: boolean;
}

export interface OnlineUsers {
  teamId: string;
  userIds: string[];
}

export interface ReadReceipt {
  teamId: string;
  messageIds: string[];
  userId: string;
  readAt: string;
}

interface ChatEventHandlers {
  onMessage?: (message: ChatMessageData) => void;
  onEdit?: (message: ChatMessageData) => void;
  onDelete?: (data: { teamId: string; messageId: string }) => void;
  onPin?: (message: ChatMessageData) => void;
  onTyping?: (data: TypingUser) => void;
  onOnline?: (data: OnlineUsers) => void;
  onReadReceipt?: (data: ReadReceipt) => void;
  onError?: (data: { message: string }) => void;
}

export function useChatSocket(teamId: string | null, handlers: ChatEventHandlers) {
  const token = useAuthStore((s) => s.token);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const emit = useCallback(
    (event: string, data: unknown) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit(event, data);
      }
    },
    []
  );

  useEffect(() => {
    if (!token || !teamId) return;

    const socket = connectSocket(token);

    socket.on("connect", () => {
      socket.emit("chat:join", { teamId });
    });

    socket.on("chat:message", (message: ChatMessageData) => {
      handlersRef.current.onMessage?.(message);
    });

    socket.on("chat:edit", (message: ChatMessageData) => {
      handlersRef.current.onEdit?.(message);
    });

    socket.on("chat:delete", (data: { teamId: string; messageId: string }) => {
      handlersRef.current.onDelete?.(data);
    });

    socket.on("chat:pin", (message: ChatMessageData) => {
      handlersRef.current.onPin?.(message);
    });

    socket.on("chat:typing", (data: TypingUser) => {
      handlersRef.current.onTyping?.(data);
    });

    socket.on("chat:online", (data: OnlineUsers) => {
      handlersRef.current.onOnline?.(data);
    });

    socket.on("chat:read-receipt", (data: ReadReceipt) => {
      handlersRef.current.onReadReceipt?.(data);
    });

    socket.on("chat:error", (data: { message: string }) => {
      handlersRef.current.onError?.(data);
    });

    return () => {
      socket.emit("chat:leave", { teamId });
      socket.off("chat:message");
      socket.off("chat:edit");
      socket.off("chat:delete");
      socket.off("chat:pin");
      socket.off("chat:typing");
      socket.off("chat:online");
      socket.off("chat:read-receipt");
      socket.off("chat:error");
      socket.off("connect");
    };
  }, [token, teamId]);

  return { emit, socket: getSocket };
}
