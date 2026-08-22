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
      const userData = res.data;
      setCurrentUserId(userData.id || userData._id || '');
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
      const activeId = currentActive?.id || currentActive?._id;
      const msgConvId = newMessage.conversationId || newMessage.chatId;

      if (currentActive && msgConvId === activeId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => (msg.id || msg._id) === (newMessage.id || newMessage._id));
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
        : res.data?.conversations || res.data?.data || [];
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
        : res.data?.users || res.data?.data || [];
      
      // Cache searched users so we can display their names instantly in the sidebar
      const newCache = { ...userCache };
      data.forEach((u: any) => {
        const uId = u.id || u._id;
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
    const targetUserId = userObj.id || userObj._id;
    if (!targetUserId) return;

    // Cache user info immediately
    setUserCache((prev) => ({
      ...prev,
      [targetUserId]: { name: userObj.name, phone: userObj.phone }
    }));

    try {
      const res = await api.post('/conversations', { userId: targetUserId });
      const chatData = res.data;
      
      await fetchConversations();
      
      setActiveChat(chatData);
      fetchMessages(chatData.id || chatData._id);
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
        : res.data?.messages || res.data?.data || [];
      setMessages(data);
    } catch (err) {
      console.error('Fetch Messages Error:', err);
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;

    const activeId = activeChat.id || activeChat._id;
    const messagePayload = {
      conversationId: activeId,
      text: text,
    };

    if (socketRef.current) {
      socketRef.current.emit('message:send', messagePayload, (acknowledgement: any) => {
        if (acknowledgement && (acknowledgement.id || acknowledgement._id)) {
          setMessages((prev) => {
            const exists = prev.some((m) => (m.id || m._id) === (acknowledgement.id || acknowledgement._id));
            if (exists) return prev;
            return [...prev, acknowledgement];
          });
        }
      });
    }

    try {
      const res = await api.post('/messages', messagePayload);
      const newMsg = res.data;
      setMessages((prev) => {
        const exists = prev.some((m) => (m.id || m._id) === (newMsg.id || newMsg._id));
        if (exists) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Send Message REST Error:', err);
    }

    setText('');
    fetchConversations();
  };

  // নিখুঁতভাবে ইউজারের নাম খুঁজে বের করার লজিক (캐শ ও পার্টিসিপেন্টস চেক করে)
  const getConversationName = (c: any) => {
    if (c.name) return c.name; // গ্রুপ চ্যাট হলে গ্রুপের নাম
    if (c.user && c.user.name) return c.user.name;

    if (c.participants && Array.isArray(c.participants)) {
      const otherParticipant = c.participants.find((p: any) => {
        const pId = typeof p === 'string' ? p : (p._id || p.id);
        return pId && pId !== currentUserId;
      });

      if (otherParticipant) {
        if (typeof otherParticipant === 'object' && otherParticipant.name) {
          return otherParticipant.name;
        }
        const pId = typeof otherParticipant === 'string' ? otherParticipant : (otherParticipant._id || otherParticipant.id);
        if (pId && userCache[pId]) {
          return userCache[pId].name; // সার্চ ক্যাশ থেকে নাম বের করে দেওয়া
        }
      }
    }
    return 'Direct Chat';
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
                  key={u.id || u._id || idx}
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
              const isActive = activeChat?.id === c.id || activeChat?._id === c._id;
              const chatName = getConversationName(c);
              return (
                <div
                  key={c.id || c._id || idx}
                  onClick={() => {
                    setActiveChat(c);
                    fetchMessages(c.id || c._id);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-violet-600/20 border border-violet-500/40 text-white' : 'hover:bg-[#1E2436] text-slate-300'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{chatName}</p>
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
            <header className="p-4 border-b border-[#1E2436] bg-[#121829] flex items-center justify-between">
              <button
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 rounded-xl bg-[#1E2436] text-slate-300"
              >
                ← Back
              </button>
              <h2 className="font-bold text-white text-sm">{getConversationName(activeChat)}</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => {
                const senderObj = msg.sender;
                const senderId = typeof senderObj === 'string' ? senderObj : (senderObj?._id || senderObj?.id);
                const isMine = senderId === currentUserId;

                return (
                  <div key={msg.id || msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-violet-600 text-white' : 'bg-[#1E2436] text-slate-200'}`}>
                      {msg.text || msg.content}
                    </div>
                  </div>
                );
              })}
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
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
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