"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/lib/chatStore";
import { Message, Conversation } from "@/types";

let socket: Socket | null = null;

const API_ROOT_URL =
  process.env.NEXT_PUBLIC_API_ROOT_URL ??
  "https://frontend-task-chatapp.onrender.com";

export function useSocket(token: string | null) {
  const addMessage = useChatStore((s) => s.addMessage);
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  useEffect(() => {
    if (!token) return;

    // Connect to the server ROOT (not /api), JWT in handshake auth.
    if (!socket || !socket.connected) {
      socket = io(API_ROOT_URL, {
        auth: { token },
        autoConnect: true,
      });
    }

    function handleNewMessage(message: Message) {
      addMessage(message.conversationId, message);
    }

    function handleConversationUpdated(conversation: Conversation) {
      upsertConversation(conversation);
    }

    socket.on("message:new", handleNewMessage);
    socket.on("conversation:updated", handleConversationUpdated);

    return () => {
      socket?.off("message:new", handleNewMessage);
      socket?.off("conversation:updated", handleConversationUpdated);
      socket?.disconnect();
      socket = null;
    };
  }, [token, addMessage, upsertConversation]);
}