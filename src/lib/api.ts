import axios from "axios";
import { useAuthStore } from "./store";

// Base URL includes /api per the Swagger "Servers" section.
// The WebSocket connects to the ROOT origin instead (see socket.ts).
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://frontend-task-chatapp.onrender.com/";

export const API_ROOT_URL =
  process.env.NEXT_PUBLIC_API_ROOT_URL ??
  "https://frontend-task-chatapp.onrender.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request, if present
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export async function login(phone: string, name: string) {
  const res = await api.post("/auth/login", { phone, name });
  return res.data; // expect { token, user } shape — confirm from live response
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

// ---- Users ----
export async function searchUsers(q: string) {
  const res = await api.get("/users/search", { params: { q } });
  return res.data;
}

// ---- Conversations ----
export async function getConversations() {
  const res = await api.get("/conversations");
  return res.data;
}

export async function startConversation(userId: string) {
  const res = await api.post("/conversations", { userId });
  return res.data;
}

export async function getMessages(
  conversationId: string,
  params?: { before?: string; limit?: number }
) {
  const res = await api.get(`/conversations/${conversationId}/messages`, {
    params,
  });
  return res.data;
}

// ---- Groups ----
export async function createGroup(name: string, participantIds: string[]) {
  const res = await api.post("/conversations/group", { name, participantIds });
  return res.data;
}

export async function addParticipants(
  conversationId: string,
  userIds: string[]
) {
  const res = await api.post(`/conversations/${conversationId}/participants`, {
    userIds,
  });
  return res.data;
}

export async function removeParticipant(
  conversationId: string,
  userId: string
) {
  const res = await api.delete(
    `/conversations/${conversationId}/participants/${userId}`
  );
  return res.data;
}

export async function promoteAdmin(conversationId: string, userId: string) {
  const res = await api.post(`/conversations/${conversationId}/admins`, {
    userId,
  });
  return res.data;
}

export async function renameGroup(conversationId: string, name: string) {
  const res = await api.patch(`/conversations/${conversationId}`, { name });
  return res.data;
}

// ---- Messages ----
export async function sendMessage(conversationId: string, text: string) {
  const res = await api.post("/messages", { conversationId, text });
  return res.data;
}

// ---- System ----
export async function healthCheck() {
  const res = await api.get("/health");
  return res.data;
}