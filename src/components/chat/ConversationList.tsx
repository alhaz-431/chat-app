"use client";

import clsx from "clsx";
import { formatDistanceToNowStrict } from "date-fns";
import { Users, Plus } from "lucide-react";
import { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
}

function conversationLabel(conversation: Conversation, currentUserId: string) {
  if (conversation.isGroup) return conversation.name ?? "Unnamed group";
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.name ?? "Unknown user";
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  loading,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  return (
    <div className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
          Chats
        </h2>
        <button
          onClick={onNewConversation}
          aria-label="Start a new conversation"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <p className="p-4 text-sm text-[var(--muted)]">Loading conversations…</p>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-[var(--muted)]">
            <p className="font-medium text-[var(--foreground)]">
              No conversations yet
            </p>
            <p className="text-sm">Start one to say hello.</p>
          </div>
        )}

        {conversations.map((conversation) => {
          const isActive = conversation.id === activeId;
          const label = conversationLabel(conversation, currentUserId);
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={clsx(
                "flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition",
                isActive ? "bg-[var(--accent)]/10" : "hover:bg-[var(--background)]"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                {conversation.isGroup ? (
                  <Users size={18} />
                ) : (
                  <span className="text-sm font-semibold">
                    {label.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[var(--foreground)]">
                    {label}
                  </span>
                  {conversation.lastMessage && (
                    <span className="shrink-0 text-[11px] text-[var(--muted)]">
                      {formatDistanceToNowStrict(
                        new Date(conversation.lastMessage.createdAt),
                        { addSuffix: false }
                      )}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[var(--muted)]">
                  {conversation.lastMessage?.content ?? "No messages yet"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}