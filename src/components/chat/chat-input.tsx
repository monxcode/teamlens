"use client";

import { useState, useRef, useEffect } from "react";
import { EmojiPicker } from "./emoji-picker";
import { Reply, Smile, Send, X } from "lucide-react";
import { ChatMessageData } from "@/hooks/use-chat-socket";

interface ChatInputProps {
  replyTo: ChatMessageData | null;
  onSend: (content: string, replyToId?: string) => void;
  onCancelReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ replyTo, onSend, onCancelReply, onTyping }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  function handleSubmit() {
    if (!content.trim()) return;
    onSend(content.trim(), replyTo?.id);
    setContent("");
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

  return (
    <div className="border-t bg-card px-4 py-3">
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="h-3.5 w-3.5 text-muted-foreground shrink-0 rotate-180" />
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
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full rounded-xl border bg-background px-4 py-2.5 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[120px]"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Smile className="h-4 w-4" />
              </button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
