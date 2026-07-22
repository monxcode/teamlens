"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useChatSocket, ChatMessageData, TypingUser, OnlineUsers, ReadReceipt } from "@/hooks/use-chat-socket";
import { formatRelativeTime } from "@/lib/utils";
import { MessagesSquare, Users } from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
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

export default function TeamChatPage() {
  const { user: authUser, token } = useAuthStore();
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const teamId = team?.id || null;

  const currentUserId = authUser?.id || "";
  const isTeamLead = team?.myRole === "lead";
  const isAdmin = authUser?.role === "super_admin" || authUser?.role === "admin";
  const canModerate = isAdmin || isTeamLead;
  const canPin = canModerate;

  const teamRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    if (team) {
      for (const member of team.members) {
        map.set(member.user.id, member.role);
      }
    }
    return map;
  }, [team]);

  const userRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    if (team) {
      for (const member of team.members) {
        map.set(member.user.id, member.user.role);
      }
    }
    return map;
  }, [team]);

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

  const { emit } = useChatSocket(teamId, handlers);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTeam();
  }, [token, router]);

  useEffect(() => {
    if (!teamId) return;
    fetchMessages();
  }, [teamId]);

  useEffect(() => {
    if (!teamId || !searchQuery) return;
    const timer = setTimeout(() => {
      fetchMessages(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, teamId]);

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

  async function fetchTeam() {
    try {
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.myTeam) {
        setTeam({
          ...data.myTeam,
          members: data.myTeam.members.filter(
            (m: TeamMember) => !MANAGEMENT_ROLES.includes(m.user.role)
          ),
        });
      } else {
        setTeam(null);
      }
    } catch {
      console.error("Failed to fetch team");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(reset = true) {
    if (!teamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "50");

      const res = await fetch(`/api/teams/${teamId}/chat?${params}`, {
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
            emit("chat:read", { teamId, messageIds: unreadIds });
          }
        }
      }
    } catch {
      console.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("cursor", nextCursor);
      params.set("limit", "50");

      const res = await fetch(`/api/teams/${teamId}/chat?${params}`, {
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
      if (!teamId) return;
      emit("chat:message", { teamId, content, replyToId });
    },
    [teamId, emit]
  );

  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      if (!teamId) return;
      emit("chat:edit", { teamId, messageId, content });
    },
    [teamId, emit]
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      if (!teamId) return;
      emit("chat:delete", { teamId, messageId });
    },
    [teamId, emit]
  );

  const handlePin = useCallback(
    (messageId: string) => {
      if (!teamId) return;
      emit("chat:pin", { teamId, messageId });
    },
    [teamId, emit]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!teamId) return;
      emit("chat:typing", { teamId, isTyping });
    },
    [teamId, emit]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query) {
      fetchMessages(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-16 rounded-xl bg-muted" />
          <div className="h-[400px] rounded-xl bg-muted" />
          <div className="h-16 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Card className="p-12 max-w-md">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No team assigned"
            description="You haven't been assigned to a team yet. Contact your administrator to be added to a team to access the chat."
          />
        </Card>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    lead: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    member: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <div className="flex-1 flex flex-col rounded-xl border bg-card overflow-hidden">
        <ChatHeader
          team={team}
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
                description="Start the conversation! This is the beginning of your team chat."
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
                      teamRoleMap={teamRoleMap}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}

          <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} teamRoleMap={teamRoleMap} userRoleMap={userRoleMap} />
        </div>

        <ChatInput
          replyTo={replyTo}
          onSend={handleSend}
          onCancelReply={() => setReplyTo(null)}
          onTyping={handleTyping}
          teamRoleMap={teamRoleMap}
        />
      </div>

      <div className="hidden lg:flex flex-col w-72 rounded-xl border bg-card overflow-hidden shrink-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {onlineUserIds.length} online &middot; {team.members.length} total
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {team.members.map((member) => {
            const isMemberOnline = onlineUserIds.includes(member.user.id);
            return (
              <div
                key={member.id}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar
                  name={member.user.name}
                  src={member.user.avatarUrl}
                  size="sm"
                  role={member.user.role}
                  teamRole={member.role}
                  isOnline={isMemberOnline}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.name}
                  </p>
                </div>
                {member.role === "lead" && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                    Lead
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
