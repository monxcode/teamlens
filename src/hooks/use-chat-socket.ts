"use client";

import { useEffect, useRef, useCallback } from "react";
import { connectSocket, getSocket } from "@/lib/socket-client";
import { useAuthStore } from "@/stores/auth-store";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
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
    user: { id: string; name: string; avatarUrl: string | null; role: string };
  } | null;
  readReceipts: {
    id: string;
    readAt: string;
    userId: string;
    user: { id: string; name: string };
  }[];
  attachments: ChatAttachment[];
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
  const joinedRoomRef = useRef<string | null>(null);

  // Emit with automatic retry: if socket not connected, wait briefly then retry once
  const emit = useCallback(
    (event: string, data: unknown) => {
      const socket = getSocket();
      if (!socket) return;
      if (socket.connected) {
        socket.emit(event, data);
      } else {
        // Queue for when connection is established
        const onConnect = () => {
          socket.emit(event, data);
          socket.off("connect", onConnect);
        };
        socket.on("connect", onConnect);
      }
    },
    []
  );

  useEffect(() => {
    if (!token || !teamId) return;

    const socket = connectSocket(token);

    // Join room immediately if connected, otherwise wait for connect
    const joinRoom = () => {
      if (joinedRoomRef.current !== teamId) {
        // Leave previous room if switching teams
        if (joinedRoomRef.current) {
          socket.emit("chat:leave", { teamId: joinedRoomRef.current });
        }
        socket.emit("chat:join", { teamId });
        joinedRoomRef.current = teamId;
      }
    };

    if (socket.connected) {
      joinRoom();
    }

    // Also join on (re)connect
    socket.on("connect", joinRoom);

    // Track connection state for rejoining after disconnect
    socket.on("disconnect", () => {
      joinedRoomRef.current = null;
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
      joinedRoomRef.current = null;
      socket.off("connect", joinRoom);
      socket.off("disconnect");
      socket.off("chat:message");
      socket.off("chat:edit");
      socket.off("chat:delete");
      socket.off("chat:pin");
      socket.off("chat:typing");
      socket.off("chat:online");
      socket.off("chat:read-receipt");
      socket.off("chat:error");
    };
  }, [token, teamId]);

  return { emit, socket: getSocket };
}
