import { io, Socket } from "socket.io-client";
import { API_ROOT_URL } from "./api";

let socket: Socket | null = null;

// Connects to the server ROOT (not /api) with the JWT in the handshake auth,
// per the Swagger docs' WebSocket section.
export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket;

  socket = io(API_ROOT_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// Event names, per docs:
// client -> server: "message:send" ({ conversationId, text }, ackCallback?)
// server -> client: "message:new" (Message)
// server -> client: "conversation:updated" (Conversation)
export const SOCKET_EVENTS = {
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  CONVERSATION_UPDATED: "conversation:updated",
} as const;