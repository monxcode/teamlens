"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EmojiPicker } from "./emoji-picker";
import { AttachmentButton } from "./attachment-button";
import { Avatar } from "@/components/ui/avatar";
import { Reply, Smile, Send, X } from "lucide-react";
import { ChatMessageData } from "@/hooks/use-chat-socket";
import { useFileUpload, UploadedAttachment } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  replyTo: ChatMessageData | null;
  onSend: (content: string, replyToId?: string, attachmentIds?: string[]) => void;
  onCancelReply: () => void;
  onTyping: (isTyping: boolean) => void;
  teamRoleMap?: Map<string, string>;
  teamId?: string;
}

export function ChatInput({ replyTo, onSend, onCancelReply, onTyping, teamRoleMap, teamId }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { uploads, uploadFiles, removeUpload, clearUploads, retryUpload } = useFileUpload();

  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  function handleChange(value: string) {
    setContent(value);

    if (value.trim()) {
      onTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else {
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }

  async function handleSubmit() {
    const hasContent = content.trim();
    const hasUploads = uploads.some((u) => u.status === "complete");

    if (!hasContent && !hasUploads) return;

    const attachmentIds = uploads
      .filter((u) => u.status === "complete" && u.attachmentId)
      .map((u) => u.attachmentId!);

    onSend(content.trim(), replyTo?.id, attachmentIds.length > 0 ? attachmentIds : undefined);
    setContent("");
    clearUploads();
    onCancelReply();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleEmojiSelect(emoji: string) {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }

  async function handleFilesSelected(files: File[]) {
    if (!teamId) return;
    await uploadFiles(files, teamId);
  }

  // Drag and drop on the entire input area
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!teamId) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await uploadFiles(files, teamId);
      }
    },
    [teamId, uploadFiles]
  );

  // Paste handler for images/files
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!teamId) return;
      const items = Array.from(e.clipboardData.items);
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        await uploadFiles(files, teamId);
      }
    },
    [teamId, uploadFiles]
  );

  const hasUploads = uploads.length > 0;
  const isUploading = uploads.some((u) => u.status === "uploading");

  return (
    <div
      className={cn(
        "border-t bg-card px-4 py-3 transition-colors",
        isDragging && "bg-primary/5 border-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="h-3.5 w-3.5 text-muted-foreground shrink-0 rotate-180" />
            <div className="relative shrink-0">
              <Avatar name={replyTo.user.name} src={replyTo.user.avatarUrl} size="sm" role={replyTo.user.role} teamRole={teamRoleMap?.get(replyTo.user.id)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Replying to <span className="text-foreground">{replyTo.user.name}</span>
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
            </div>
          </div>
          <button onClick={onCancelReply} className="shrink-0">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <AttachmentButton
          onFilesSelected={handleFilesSelected}
          uploads={uploads}
          onRemoveUpload={removeUpload}
          onRetryUpload={(fileId) => teamId && retryUpload(fileId, teamId)}
          disabled={!teamId}
        />

        <button
          ref={emojiButtonRef}
          onClick={() => setShowEmoji(!showEmoji)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Smile className="h-5 w-5" />
        </button>
        {showEmoji && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmoji(false)}
            anchorRef={emojiButtonRef}
          />
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isDragging ? "Drop files here..." : "Type a message..."}
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[120px]"
        />

        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && !hasUploads) || isUploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none z-50">
          <p className="text-sm font-medium text-primary">Drop files here</p>
        </div>
      )}
    </div>
  );
}
