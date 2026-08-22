"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import clsx from "clsx";
import { Message, User } from "@/types";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  participants: User[];
  loading?: boolean;
}

const NEAR_BOTTOM_THRESHOLD = 120; // px

export default function MessageList({
  messages,
  currentUserId,
  participants,
  loading,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [newMessagesWhileScrolledUp, setNewMessagesWhileScrolledUp] =
    useState(0);

  // Track whether the user is near the bottom, to decide if we should
  // auto-scroll on new messages or leave them where they are.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    setStickToBottom(nearBottom);
    if (nearBottom) setNewMessagesWhileScrolledUp(0);
  }

  useEffect(() => {
    if (stickToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > 0) {
      setNewMessagesWhileScrolledUp((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setStickToBottom(true);
    setNewMessagesWhileScrolledUp(0);
  }

  function participantName(userId: string) {
    return participants.find((p) => p.id === userId)?.name ?? "Unknown";
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Loading messages…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-[var(--muted)]">
        <p className="font-medium text-[var(--foreground)]">No messages yet</p>
        <p className="text-sm">Say hello to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={clsx(
                "flex flex-col",
                isMine ? "items-end" : "items-start"
              )}
            >
              {!isMine && participants.length > 2 && (
                <span className="mb-0.5 px-1 text-xs font-medium text-[var(--muted)]">
                  {participantName(message.senderId)}
                </span>
              )}
              <div
                className={clsx(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  isMine
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] rounded-br-sm"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
              <span className="mt-1 px-1 text-[11px] text-[var(--muted)]">
                {format(new Date(message.createdAt), "HH:mm")}
                {message.status === "sending" && " · sending…"}
                {message.status === "failed" && " · failed to send"}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!stickToBottom && newMessagesWhileScrolledUp > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-[var(--accent-foreground)] shadow-md"
        >
          {newMessagesWhileScrolledUp} new message
          {newMessagesWhileScrolledUp > 1 ? "s" : ""} ↓
        </button>
      )}
    </div>
  );
}