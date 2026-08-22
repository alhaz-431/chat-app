export interface User {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string; // group name, if isGroup
  participants: User[];
  adminIds?: string[]; // relevant for groups only
  lastMessage?: Message;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "failed";
}

export interface AuthState {
  user: User | null;
  token: string | null;
}