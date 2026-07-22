"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Search, Pin, Users, X } from "lucide-react";

interface TeamInfo {
  id: string;
  name: string;
  myRole: string;
  members: { id: string; role: string; user: { id: string; name: string; avatarUrl: string | null; role: string } }[];
}

interface PinnedMessage {
  id: string;
  content: string;
  user: { id: string; name: string; role: string; avatarUrl?: string | null };
  pinnedAt: string;
}

interface ChatHeaderProps {
  team: TeamInfo;
  onlineUserIds: string[];
  pinnedMessages: PinnedMessage[];
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function ChatHeader({ team, onlineUserIds, pinnedMessages, onSearch, searchQuery }: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{team.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              {onlineUserIds.length > 0
                ? `${onlineUserIds.length} online`
                : `${team.members.length} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {pinnedMessages.length > 0 && (
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors ${
                showPinned ? "bg-muted text-primary" : ""
              }`}
              title="Pinned messages"
            >
              <Pin className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors ${
              showSearch ? "bg-muted text-primary" : ""
            }`}
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full h-9 pl-9 pr-8 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {showPinned && pinnedMessages.length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Pin className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Pinned messages</p>
          </div>
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="flex items-center gap-2 text-xs text-muted-foreground truncate py-0.5">
              <Avatar
                name={msg.user.name}
                src={msg.user.avatarUrl}
                size="xs"
                role={msg.user.role}
              />
              <span className="truncate">
                <span className="font-medium">{msg.user.name}:</span> {msg.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
