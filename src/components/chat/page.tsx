"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import { useChatStore } from "@/lib/chatStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import { getConversations, getMessages, sendMessage as sendMessageApi, getMe } from "@/lib/api";
import ConversationList from "@/components/chat/ConversationList";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import NewConversationModal from "@/components/chat/NewConversationModal";
import GroupInfoModal from "@/components/chat/GroupInfoModal";
import { Message } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();

  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    setConversations,
    upsertConversation,
    setActiveConversation,
    setMessages,
    addMessage,
    updateMessage,
  } = useChatStore();

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useChatSocket(token);

  // Redirect unauthenticated users to login. Also verify the stored token
  // is still valid via /auth/me (in case it expired).
  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    getMe().catch(() => {
      logout();
      router.replace("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load the conversation list on mount.
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingConversations(true);
      try {
        const data = await getConversations();
        // TODO: confirm real response shape (assuming Conversation[]).
        setConversations(Array.isArray(data) ? data : data.conversations ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load your conversations.");
      } finally {
        setLoadingConversations(false);
      }
    })();
  }, [token, setConversations]);

  // Load messages whenever the active conversation changes.
  useEffect(() => {
    if (!activeConversationId) return;
    (async () => {
      setLoadingMessages(true);
      try {
        const data = await getMessages(activeConversationId);
        // TODO: confirm real response shape (assuming Message[]).
        setMessages(
          activeConversationId,
          Array.isArray(data) ? data : data.messages ?? []
        );
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load messages for this conversation.");
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [activeConversationId, setMessages]);

  async function handleSend(text: string) {
    if (!activeConversationId || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: user.id,
      content: text,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    addMessage(activeConversationId, optimisticMessage);

    try {
      const saved = await sendMessageApi(activeConversationId, text);
      // TODO: confirm real response shape (assuming the saved Message).
      updateMessage(activeConversationId, tempId, {
        ...saved,
        status: "sent",
      });
    } catch (err) {
      console.error(err);
      updateMessage(activeConversationId, tempId, { status: "failed" });
      toast.error("Message failed to send.");
    }
  }

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const activeMessages = activeConversationId
    ? messagesByConversation[activeConversationId] ?? []
    : [];

  if (!token || !user) return null;

  return (
    <main className="flex h-screen flex-col bg-[var(--background)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span className="font-[family-name:var(--font-display)] font-semibold text-[var(--foreground)]">
          Chatline
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">{user.name}</span>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="text-sm text-[var(--muted)] hover:text-[var(--danger)]"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full max-w-xs shrink-0">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            currentUserId={user.id}
            loading={loadingConversations}
            onSelect={setActiveConversation}
            onNewConversation={() => setShowNewConversation(true)}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="font-medium text-[var(--foreground)]">
                  {activeConversation.isGroup
                    ? activeConversation.name
                    : activeConversation.participants.find(
                        (p) => p.id !== user.id
                      )?.name}
                </p>
                {activeConversation.isGroup && (
                  <button
                    onClick={() => setShowGroupInfo(true)}
                    className="text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Group info
                  </button>
                )}
              </div>
              <MessageList
                messages={activeMessages}
                currentUserId={user.id}
                participants={activeConversation.participants}
                loading={loadingMessages}
              />
              <MessageInput onSend={handleSend} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
              Select a conversation, or start a new one.
            </div>
          )}
        </section>
      </div>

      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onCreated={(conversation) => {
            upsertConversation(conversation);
            setActiveConversation(conversation.id);
          }}
        />
      )}

      {showGroupInfo && activeConversation && (
        <GroupInfoModal
          conversation={activeConversation}
          currentUserId={user.id}
          onClose={() => setShowGroupInfo(false)}
          onUpdated={(conversation) => upsertConversation(conversation)}
        />
      )}
    </main>
  );
}