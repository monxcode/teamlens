"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Reply, Copy, Download, Trash2, Pin, PinOff, Edit3,
  Info, Hash, ExternalLink, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageData } from "@/hooks/use-chat-socket";

interface ContextMenuProps {
  message: ChatMessageData;
  position: { x: number; y: number };
  onClose: () => void;
  isOwn: boolean;
  canModerate: boolean;
  canPin: boolean;
  canEdit: boolean;
  onReply: (msg: ChatMessageData) => void;
  onEdit: (msgId: string) => void;
  onDelete: (msgId: string) => void;
  onPin: (msgId: string) => void;
  onCopyText: (text: string) => void;
  onCopyLink: (url: string) => void;
  onDownload: (url: string, name: string) => void;
  onViewDetails: (msg: ChatMessageData) => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

export function ContextMenu({
  message: msg,
  position,
  onClose,
  isOwn,
  canModerate,
  canPin,
  canEdit,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopyText,
  onCopyLink,
  onDownload,
  onViewDetails,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + rect.width > viewportW - 8) x = viewportW - rect.width - 8;
    if (y + rect.height > viewportH - 8) y = viewportH - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    setAdjustedPos({ x, y });
  }, [position]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const hasAttachments = msg.attachments && msg.attachments.length > 0;
  const hasText = msg.content && msg.content.trim().length > 0;
  const firstAttachment = hasAttachments ? msg.attachments[0] : null;

  const menuItems: MenuItem[] = [
    {
      label: "Reply",
      icon: <Reply className="h-4 w-4" />,
      onClick: () => { onReply(msg); onClose(); },
    },
  ];

  if (hasText) {
    menuItems.push({
      label: "Copy Text",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => { onCopyText(msg.content); onClose(); },
    });
  }

  if (firstAttachment) {
    menuItems.push({
      label: "Copy Link",
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: () => { onCopyLink(firstAttachment.url); onClose(); },
    });
    menuItems.push({
      label: "Download",
      icon: <Download className="h-4 w-4" />,
      onClick: () => { onDownload(firstAttachment.url, firstAttachment.originalName); onClose(); },
    });
  }

  menuItems.push({
    label: "Forward",
    icon: <Share2 className="h-4 w-4" />,
    onClick: () => onClose(),
    disabled: true,
  });

  menuItems.push({
    label: "View Details",
    icon: <Info className="h-4 w-4" />,
    onClick: () => { onViewDetails(msg); onClose(); },
  });

  // Separator before owner/moderator actions
  if (canEdit || (isOwn || canModerate) || canPin) {
    menuItems.push({ label: "", icon: null, onClick: () => {}, separator: true });
  }

  if (canEdit) {
    menuItems.push({
      label: "Edit",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: () => { onEdit(msg.id); onClose(); },
    });
  }

  if (isOwn || canModerate) {
    menuItems.push({
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => { onDelete(msg.id); onClose(); },
      danger: true,
    });
  }

  if (canPin) {
    menuItems.push({
      label: msg.pinned ? "Unpin" : "Pin",
      icon: msg.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />,
      onClick: () => { onPin(msg.id); onClose(); },
    });
  }

  // Admin-only actions
  if (canModerate) {
    menuItems.push({
      label: "Copy Message ID",
      icon: <Hash className="h-4 w-4" />,
      onClick: () => { navigator.clipboard.writeText(msg.id); onClose(); },
    });
  }

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[10000] w-56 rounded-xl border bg-card shadow-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {menuItems.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="my-1 border-t" />
        ) : (
          <button
            key={item.label}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
              item.disabled
                ? "text-muted-foreground/50 cursor-not-allowed"
                : item.danger
                ? "text-destructive hover:bg-destructive/10"
                : "text-foreground hover:bg-muted"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  );
}
