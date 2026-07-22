"use client";

interface TypingIndicatorProps {
  typingUsers: { userId: string; name: string }[];
  currentUserId: string;
}

export function TypingIndicator({ typingUsers, currentUserId }: TypingIndicatorProps) {
  const others = typingUsers.filter((u) => u.userId !== currentUserId);

  if (others.length === 0) return null;

  const text =
    others.length === 1
      ? `${others[0].name} is typing...`
      : `${others[0].name} and ${others.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{text}</span>
    </div>
  );
}
