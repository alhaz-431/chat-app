'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  // Search & Cache States for User Names
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userCache, setUserCache] = useState<{ [key: string]: { name: string; phone: string } }>({});
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Helper: this API consistently uses _id, not id.
  const getId = (obj: any) => obj?._id || obj?.id;

  // 1. Auth & Initial Load
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || useAuthStore.getState().token;
    if (!savedToken) {
      router.push('/login');
      return;
    }
    setToken(savedToken);
    fetchCurrentUser(savedToken);
    fetchConversations();
  }, [router]);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const userData = res.data?.data || res.data;
      setCurrentUserId(getId(userData) || '');
    } catch (err) {
      console.error('Fetch User Error:', err);
    }
  };

  // 2. Socket.io Connection & Listeners
  useEffect(() => {
    if (!token) return;

    const socketInstance = io('https://frontend-task-chatapp.onrender.com', {
      auth: { token },
    });

    socketRef.current = socketInstance;

    socketInstance.on('message:new', (newMessage: any) => {
      const currentActive = activeChatRef.current;
      const activeId = getId(currentActive);
      const msgConvId = newMessage.conversationId || newMessage.chatId;

      if (currentActive && msgConvId === activeId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => getId(msg) === getId(newMessage));
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
      fetchConversations();
    });

    socketInstance.on('conversation:updated', () => {
      fetchConversations();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.conversations || [];
      setConversations(data);
    } catch (err: any) {
      console.error('Fetch Conversations Error:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.users || [];

      // Cache searched users so we can display their names instantly in the sidebar
      const newCache = { ...userCache };
      data.forEach((u: any) => {
        const uId = getId(u);
        if (uId) {
          newCache[uId] = { name: u.name, phone: u.phone };
        }
      });
      setUserCache(newCache);
      setSearchResults(data);
    } catch (err) {
      console.error('User Search Error:', err);
      setSearchResults([]);
    }
  };

  const startDirectChat = async (userObj: any) => {
    const targetUserId = getId(userObj);
    if (!targetUserId) return;

    // Cache user info immediately
    setUserCache((prev) => ({
      ...prev,
      [targetUserId]: { name: userObj.name, phone: userObj.phone }
    }));

    try {
      const res = await api.post('/conversations', { userId: targetUserId });
      const chatData = res.data?.data || res.data;

      await fetchConversations();

      setActiveChat(chatData);
      fetchMessages(getId(chatData));
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Start Direct Chat Error:', err);
    }
  };

  const fetchMessages = async (id: string) => {
    if (!id) return;
    try {
      const res = await api.get(`/conversations/${id}/messages?limit=50`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.messages || [];
      setMessages(data);
    } catch (err) {
      console.error('Fetch Messages Error:', err);
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;

    const activeId = getId(activeChat);
    const messagePayload = {
      conversationId: activeId,
      text: text,
    };

    if (socketRef.current) {
      socketRef.current.emit('message:send', messagePayload, (acknowledgement: any) => {
        if (acknowledgement && getId(acknowledgement)) {
          setMessages((prev) => {
            const exists = prev.some((m) => getId(m) === getId(acknowledgement));
            if (exists) return prev;
            return [...prev, acknowledgement];
          });
        }
      });
    }

    try {
      const res = await api.post('/messages', messagePayload);
      const newMsg = res.data?.data || res.data;
      setMessages((prev) => {
        const exists = prev.some((m) => getId(m) === getId(newMsg));
        if (exists) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Send Message REST Error:', err);
    }

    setText('');
    fetchConversations();
  };

  // Conversation display name — real API returns a single "participant"
  // object for direct chats, and (presumably) "name" + "participants"
  // array for groups.
  const getConversationName = (c: any) => {
    if (!c) return 'Direct Chat';

    if (c.name) return c.name; // group chat name

    // Direct chats: API returns a single "participant" object (the OTHER user)
    if (c.participant && c.participant.name) {
      return c.participant.name;
    }

    if (c.user && c.user.name) return c.user.name;

    // Fallback shape: a "participants" array (e.g. for groups, or older data)
    if (c.participants && Array.isArray(c.participants)) {
      const otherParticipant = c.participants.find((p: any) => {
        const pId = typeof p === 'string' ? p : getId(p);
        return pId && pId !== currentUserId;
      });

      if (otherParticipant) {
        if (typeof otherParticipant === 'object' && otherParticipant.name) {
          return otherParticipant.name;
        }
        const pId = typeof otherParticipant === 'string' ? otherParticipant : getId(otherParticipant);
        if (pId && userCache[pId]) {
          return userCache[pId].name;
        }
      }
    }

    return 'Direct Chat';
  };

  const getConversationInitial = (c: any) => {
    const label = getConversationName(c);
    return label.charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#0B0E17] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-full md:w-80 lg:w-96 border-r border-[#1E2436] bg-[#121829] flex flex-col z-20 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[#1E2436] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-[#1E2436] text-slate-400 hover:text-white">
              ←
            </Link>
            <h1 className="text-lg font-bold text-white">Chats</h1>
          </div>
        </div>

        <div className="p-4 relative">
          <input
            type="text"
            placeholder="Search user by name or phone..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#1E2436] border border-[#2A324B] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
          />

          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-16 bg-[#121829] border border-[#2A324B] rounded-xl mt-1 max-h-56 overflow-y-auto z-50 divide-y divide-[#1E2436]">
              {searchResults.map((u, idx) => (
                <div
                  key={getId(u) || idx}
                  onClick={() => startDirectChat(u)}
                  className="p-3 hover:bg-[#1E2436] cursor-pointer flex flex-col"
                >
                  <p className="font-semibold text-sm text-slate-100">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No conversations found. Search a user to chat.</div>
          ) : (
            conversations.map((c, idx) => {
              const isActive = getId(activeChat) === getId(c);
              const chatName = getConversationName(c);
              const lastText = c.lastMessage?.text || c.lastMessage?.content || '';
              return (
                <div
                  key={getId(c) || idx}
                  onClick={() => {
                    setActiveChat(c);
                    fetchMessages(getId(c));
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                    isActive ? 'bg-violet-600/20 border border-violet-500/40 text-white' : 'hover:bg-[#1E2436] text-slate-300'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 text-sm font-semibold">
                    {getConversationInitial(c)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{chatName}</p>
                    {lastText && (
                      <p className="text-xs text-slate-500 truncate">{lastText}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Screen */}
      <main className={`flex-1 flex flex-col bg-[#0B0E17] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="p-4 border-b border-[#1E2436] bg-[#121829] flex items-center gap-3">
              <button
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 rounded-xl bg-[#1E2436] text-slate-300"
              >
                ← Back
              </button>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 text-xs font-semibold">
                {getConversationInitial(activeChat)}
              </div>
              <h2 className="font-bold text-white text-sm">{getConversationName(activeChat)}</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No messages yet. Say hello 👋
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderObj = msg.sender;
                  const senderId = typeof senderObj === 'string' ? senderObj : getId(senderObj);
                  const isMine = senderId === currentUserId;

                  return (
                    <div key={getId(msg) || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-violet-600 text-white' : 'bg-[#1E2436] text-slate-200'}`}>
                        {msg.text || msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-[#1E2436] bg-[#121829] flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-[#1E2436] border border-[#2A324B] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 p-8 text-center">
            Select a conversation from the sidebar to start chatting.
          </div>
        )}
      </main>
    </div>
  );
}