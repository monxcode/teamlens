"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useChatSocket, ChatMessageData, TypingUser, OnlineUsers, ReadReceipt } from "@/hooks/use-chat-socket";
import { MessagesSquare, Users, MessageSquare } from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  members: TeamMember[];
  _count: { members: number };
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  myRole: string;
  members: TeamMember[];
  _count: { members: number };
}

const MANAGEMENT_ROLES = ["super_admin", "admin"];

function getDateSeparator(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function isConsecutive(prev: ChatMessageData, curr: ChatMessageData): boolean {
  if (prev.userId !== curr.userId) return false;
  const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diff < 5 * 60 * 1000;
}

export default function AdminTeamChatPage() {
  const { user: authUser, token } = useAuthStore();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const currentUserId = authUser?.id || "";
  const canModerate = true;
  const canPin = true;

  const handlers = useMemo(
    () => ({
      onMessage: (message: ChatMessageData) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (autoScroll) {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          });
        }
      },
      onEdit: (message: ChatMessageData) => {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      },
      onDelete: (data: { teamId: string; messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      },
      onPin: (message: ChatMessageData) => {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
        setPinnedMessages((prev) => {
          if (message.pinned) {
            return [{ id: message.id, content: message.content, user: message.user, pinnedAt: message.pinnedAt }, ...prev];
          }
          return prev.filter((p) => p.id !== message.id);
        });
      },
      onTyping: (data: TypingUser) => {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            if (prev.some((u) => u.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, name: data.name }];
          }
          return prev.filter((u) => u.userId !== data.userId);
        });
      },
      onOnline: (data: OnlineUsers) => {
        setOnlineUserIds(data.userIds);
      },
      onReadReceipt: (data: ReadReceipt) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (data.messageIds.includes(m.id)) {
              const existing = m.readReceipts.some((r) => r.userId === data.userId);
              if (existing) return m;
              return {
                ...m,
                readReceipts: [
                  ...m.readReceipts,
                  {
                    id: data.userId + m.id,
                    readAt: data.readAt,
                    userId: data.userId,
                    user: { id: data.userId, name: "" },
                  },
                ],
              };
            }
            return m;
          })
        );
      },
      onError: (data: { message: string }) => {
        console.error("Chat error:", data.message);
      },
    }),
    [autoScroll]
  );

  const { emit } = useChatSocket(selectedTeamId, handlers);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTeams();
  }, [token, router]);

  useEffect(() => {
    if (!selectedTeamId) return;
    fetchMessages();
  }, [selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId || !searchQuery) return;
    const timer = setTimeout(() => {
      fetchMessages(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTeamId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    function handleScroll() {
      const scrollTop = container!.scrollTop;
      const scrollHeight = container!.scrollHeight;
      const clientHeight = container!.clientHeight;
      setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);

      if (scrollTop < 50 && hasMore && !loadingMore && nextCursor) {
        loadMore();
      }
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, nextCursor]);

  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, autoScroll]);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/admin/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTeams(data.teams || []);
      if (data.teams?.length > 0) {
        setSelectedTeamId(data.teams[0].id);
      }
    } catch {
      console.error("Failed to fetch teams");
    } finally {
      setLoadingTeams(false);
    }
  }

  async function fetchMessages(reset = true) {
    if (!selectedTeamId) return;
    setLoadingChat(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "50");

      const res = await fetch(`/api/teams/${selectedTeamId}/chat?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setMessages(data.messages || []);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
        }
        setPinnedMessages(data.pinnedMessages || []);

        if (data.messages?.length > 0 && reset) {
          const unreadIds = data.messages
            .filter((m: ChatMessageData) => m.userId !== currentUserId)
            .map((m: ChatMessageData) => m.id);
          if (unreadIds.length > 0) {
            emit("chat:read", { teamId: selectedTeamId, messageIds: unreadIds });
          }
        }
      }
    } catch {
      console.error("Failed to fetch messages");
    } finally {
      setLoadingChat(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("cursor", nextCursor);
      params.set("limit", "50");

      const res = await fetch(`/api/teams/${selectedTeamId}/chat?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...(data.messages || []), ...prev]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch {
      console.error("Failed to load more messages");
    } finally {
      setLoadingMore(false);
    }
  }

  const handleSend = useCallback(
    (content: string, replyToId?: string) => {
      if (!selectedTeamId) return;
      emit("chat:message", { teamId: selectedTeamId, content, replyToId });
    },
    [selectedTeamId, emit]
  );

  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      if (!selectedTeamId) return;
      emit("chat:edit", { teamId: selectedTeamId, messageId, content });
    },
    [selectedTeamId, emit]
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      if (!selectedTeamId) return;
      emit("chat:delete", { teamId: selectedTeamId, messageId });
    },
    [selectedTeamId, emit]
  );

  const handlePin = useCallback(
    (messageId: string) => {
      if (!selectedTeamId) return;
      emit("chat:pin", { teamId: selectedTeamId, messageId });
    },
    [selectedTeamId, emit]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!selectedTeamId) return;
      emit("chat:typing", { teamId: selectedTeamId, isTyping });
    },
    [selectedTeamId, emit]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query) {
      fetchMessages(true);
    }
  }, []);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <div className="hidden lg:flex flex-col w-64 rounded-xl border bg-card overflow-hidden shrink-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            All Teams
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingTeams ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No teams found
            </div>
          ) : (
            teams.map((team) => {
              const isSelected = team.id === selectedTeamId;
              const onlineCount = team.members.filter((m) => onlineUserIds.includes(m.user.id)).length;
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    setMessages([]);
                    setPinnedMessages([]);
                    setSearchQuery("");
                    setReplyTo(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-red-500/10 text-red-500"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{team.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-2 shrink-0">
                      {team._count.members}
                    </Badge>
                  </div>
                  {isSelected && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {onlineCount} online
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-xl border bg-card overflow-hidden">
        {!selectedTeamId ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={<MessageSquare className="h-8 w-8" />}
              title="Select a team"
              description="Choose a team from the sidebar to view and manage its chat."
            />
          </div>
        ) : loadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full max-w-2xl p-4">
              <div className="h-16 rounded-xl bg-muted" />
              <div className="h-[400px] rounded-xl bg-muted" />
              <div className="h-16 rounded-xl bg-muted" />
            </div>
          </div>
        ) : (
          <>
            <ChatHeader
              team={selectedTeam as any}
              onlineUserIds={onlineUserIds}
              pinnedMessages={pinnedMessages}
              onSearch={handleSearch}
              searchQuery={searchQuery}
            />

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
              {loadingMore && (
                <div className="flex justify-center py-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}

              {messages.length === 0 && !searchQuery ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyState
                    icon={<MessagesSquare className="h-8 w-8" />}
                    title="No messages yet"
                    description="This team chat is empty. Start the conversation!"
                  />
                </div>
              ) : messages.length === 0 && searchQuery ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyState
                    icon={<MessagesSquare className="h-8 w-8" />}
                    title="No results"
                    description={`No messages matching "${searchQuery}"`}
                  />
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const prev = i > 0 ? messages[i - 1] : null;
                    const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
                    const grouped = prev ? isConsecutive(prev, msg) : false;

                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                              {getDateSeparator(msg.createdAt)}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}
                        <ChatMessage
                          message={msg}
                          isOwn={msg.userId === currentUserId}
                          canModerate={canModerate}
                          canPin={canPin}
                          onlineUserIds={onlineUserIds}
                          currentUserId={currentUserId}
                          isGrouped={grouped}
                          onReply={setReplyTo}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onPin={handlePin}
                        />
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}

              <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} />
            </div>

            <ChatInput
              replyTo={replyTo}
              onSend={handleSend}
              onCancelReply={() => setReplyTo(null)}
              onTyping={handleTyping}
            />
          </>
        )}
      </div>

      <div className="hidden lg:flex flex-col w-72 rounded-xl border bg-card overflow-hidden shrink-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            {selectedTeam ? selectedTeam.name : "Members"}
          </h3>
          {selectedTeam && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {onlineUserIds.length} online &middot; {selectedTeam.members.length} total
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {selectedTeam ? (
            selectedTeam.members.map((member) => {
              const isMemberOnline = onlineUserIds.includes(member.user.id);
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" />
                    {isMemberOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user.name}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Select a team to view members
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
