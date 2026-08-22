"use client";

import { useEffect } from "react";
import { getSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { useChatStore } from "@/lib/chatStore";
import { Message, Conversation } from "@/types";

export function useChatSocket(token: string | null) {
  const addMessage = useChatStore((s) => s.addMessage);
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    function handleNewMessage(message: Message) {
      addMessage(message.conversationId, message);
    }

    function handleConversationUpdated(conversation: Conversation) {
      upsertConversation(conversation);
    }

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, handleConversationUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED, handleConversationUpdated);
      disconnectSocket();
    };
  }, [token, addMessage, upsertConversation]);
}