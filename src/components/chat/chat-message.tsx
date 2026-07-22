"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ChatMessageData } from "@/hooks/use-chat-socket";
import {
  MessageSquare,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  CheckCheck,
  Check,
  Reply,
  X,
} from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageData;
  isOwn: boolean;
  canModerate: boolean;
  canPin: boolean;
  onlineUserIds: string[];
  currentUserId: string;
  isGrouped: boolean;
  onReply: (message: ChatMessageData) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
}

export function ChatMessage({
  message: msg,
  isOwn,
  canModerate,
  canPin,
  onlineUserIds,
  currentUserId,
  isGrouped,
  onReply,
  onEdit,
  onDelete,
  onPin,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [showActions, setShowActions] = useState(false);

  const isOnline = onlineUserIds.includes(msg.userId);
  const readBy = msg.readReceipts
    .filter((r) => r.userId !== msg.userId)
    .map((r) => r.user.name);

  function handleSaveEdit() {
    if (editContent.trim() && editContent !== msg.content) {
      onEdit(msg.id, editContent.trim());
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(msg.content);
    }
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-0.5 hover:bg-muted/30 transition-colors",
        !isGrouped && "pt-3"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isGrouped ? (
        <div className="w-9 shrink-0 flex justify-center">
          <div className="text-[10px] text-muted-foreground font-medium leading-none pt-1">
            {formatRelativeTime(msg.createdAt)}
          </div>
        </div>
      ) : (
        <div className="relative shrink-0">
          <Avatar name={msg.user.name} src={msg.user.avatarUrl} size="sm" />
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-0.5">
        {!isGrouped && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{msg.user.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(msg.createdAt)}
            </span>
            {msg.editedAt && (
              <span className="text-[10px] text-muted-foreground">(edited)</span>
            )}
          </div>
        )}

        {msg.replyTo && (
          <button
            onClick={() => {}}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-0.5"
          >
            <Reply className="h-3 w-3 rotate-180" />
            <span className="truncate max-w-[200px]">
              Replying to <span className="font-medium">{msg.replyTo.user.name}</span>: {msg.replyTo.content}
            </span>
          </button>
        )}

        {isEditing ? (
          <div className="space-y-1">
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="text-xs text-primary hover:underline"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(msg.content);
                }}
                className="text-xs text-muted-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
        )}

        {msg.pinned && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
            <Pin className="h-3 w-3" />
            <span>
              Pinned by {msg.pinner?.name || "Unknown"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          {isOwn && readBy.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5" title={`Read by ${readBy.join(", ")}`}>
              <CheckCheck className="h-3 w-3 text-primary" />
              {readBy.length}
            </span>
          )}
          {isOwn && readBy.length === 0 && (
            <span className="text-[10px] text-muted-foreground">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-0.5 shrink-0 -mr-1">
          <button
            onClick={() => onReply(msg)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reply"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          {(isOwn || canModerate) && (
            <button
              onClick={() => onDelete(msg.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canPin && (
            <button
              onClick={() => onPin(msg.id)}
              className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors ${
                msg.pinned ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
              }`}
              title={msg.pinned ? "Unpin" : "Pin"}
            >
              {msg.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
