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

  // Group creation states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<any[]>([]);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<any[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Unread indicator
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const activeChatRef = useRef(activeChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Auto-scroll to the latest message whenever the list changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper: this API consistently uses _id, not id.
  const getId = (obj: any) => obj?._id || obj?.id;

  // Sort messages oldest -> newest so new ones land at the bottom,
  // like Messenger/WhatsApp.
  const sortMessages = (list: any[]) =>
    [...list].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

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

      // Try every plausible field name/shape for the conversation id,
      // since the API doesn't document the exact payload.
      const msgConvId = String(
        newMessage.conversationId ||
        newMessage.chatId ||
        newMessage.conversation?._id ||
        newMessage.conversation?.id ||
        newMessage.conversation ||
        newMessage.roomId ||
        ''
      );

      const isForActiveChat = currentActive && activeId && msgConvId === String(activeId);

      if (isForActiveChat) {
        setMessages((prev) => {
          const exists = prev.some((msg) => getId(msg) === getId(newMessage));
          if (exists) return prev;
          return sortMessages([...prev, newMessage]);
        });
      } else if (msgConvId) {
        // Message for a conversation that's not open — mark it unread.
        setUnreadIds((prev) => new Set(prev).add(msgConvId));
      }

      // Safety net: if we couldn't confidently match the payload shape
      // but a chat is open, re-sync it directly from the server so the
      // open thread never silently misses a message.
      if (currentActive && activeId && !isForActiveChat && !msgConvId) {
        fetchMessages(activeId);
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

  // ---- Group creation ----
  const handleGroupSearch = async (query: string) => {
    setGroupSearchQuery(query);
    if (!query.trim()) {
      setGroupSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.users || [];

      const newCache = { ...userCache };
      data.forEach((u: any) => {
        const uId = getId(u);
        if (uId) newCache[uId] = { name: u.name, phone: u.phone };
      });
      setUserCache(newCache);
      setGroupSearchResults(data);
    } catch (err) {
      console.error('Group User Search Error:', err);
      setGroupSearchResults([]);
    }
  };

  const toggleGroupUser = (user: any) => {
    setSelectedGroupUsers((prev) => {
      const exists = prev.some((u) => getId(u) === getId(user));
      return exists
        ? prev.filter((u) => getId(u) !== getId(user))
        : [...prev, user];
    });
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setGroupName('');
    setGroupSearchQuery('');
    setGroupSearchResults([]);
    setSelectedGroupUsers([]);
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedGroupUsers.length < 2 || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const participantIds = selectedGroupUsers.map((u) => getId(u));
      const res = await api.post('/conversations/group', {
        name: groupName.trim(),
        participantIds,
      });
      const chatData = res.data?.data || res.data;

      await fetchConversations();
      setActiveChat(chatData);
      fetchMessages(getId(chatData));
      closeGroupModal();
    } catch (err) {
      console.error('Create Group Error:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const fetchMessages = async (id: string) => {
    if (!id) return;
    try {
      const res = await api.get(`/conversations/${id}/messages?limit=50`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.messages || [];
      setMessages(sortMessages(data));
    } catch (err) {
      console.error('Fetch Messages Error:', err);
      setMessages([]);
    }
  };

  // Sends via REST only. Sending through BOTH the socket ("message:send")
  // AND this REST call was creating two separate messages server-side
  // (duplicate bubbles). REST alone still triggers the "message:new"
  // socket event from the server to every participant, so real-time
  // delivery to the OTHER user is unaffected.
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;

    const activeId = getId(activeChat);
    const messagePayload = {
      conversationId: activeId,
      text: text,
    };
    const outgoingText = text;
    setText('');

    try {
      const res = await api.post('/messages', messagePayload);
      const newMsg = res.data?.data || res.data;
      setMessages((prev) => {
        const exists = prev.some((m) => getId(m) === getId(newMsg));
        if (exists) return prev;
        return sortMessages([...prev, newMsg]);
      });
    } catch (err) {
      console.error('Send Message REST Error:', err);
      setText(outgoingText); // failed to send — restore the draft
    }

    fetchConversations();
  };

  const getConversationName = (c: any) => {
    if (!c) return 'Direct Chat';

    if (c.name) return c.name; // group chat name

    if (c.participant && c.participant.name) {
      return c.participant.name;
    }

    if (c.user && c.user.name) return c.user.name;

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

    return c.type === 'group' ? 'Unnamed group' : 'Direct Chat';
  };

  const getConversationInitial = (c: any) => {
    const label = getConversationName(c);
    return label.charAt(0).toUpperCase();
  };

  const isGroupChat = (c: any) => c?.type === 'group' || Boolean(c?.name);

  const formatTime = (createdAt: string) =>
    createdAt
      ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

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
          <button
            onClick={() => setShowGroupModal(true)}
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
          >
            + Group
          </button>
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
              const hasUnread = unreadIds.has(String(getId(c)));
              return (
                <div
                  key={getId(c) || idx}
                  onClick={() => {
                    setActiveChat(c);
                    fetchMessages(getId(c));
                    setUnreadIds((prev) => {
                      const next = new Set(prev);
                      next.delete(String(getId(c)));
                      return next;
                    });
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                    isActive ? 'bg-violet-600/20 border border-violet-500/40 text-white' : 'hover:bg-[#1E2436] text-slate-300'
                  }`}
                >
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 text-sm font-semibold">
                    {getConversationInitial(c)}
                    {hasUnread && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#121829]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{chatName}</p>
                      {isGroupChat(c) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300">
                          Group
                        </span>
                      )}
                    </div>
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
              {isGroupChat(activeChat) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300">
                  Group
                </span>
              )}
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
                  const senderName =
                    typeof senderObj === 'object' ? senderObj?.name : userCache[senderId]?.name;

                  return (
                    <div key={getId(msg) || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && isGroupChat(activeChat) && senderName && (
                        <span className="mb-0.5 px-1 text-[11px] text-slate-500">{senderName}</span>
                      )}
                      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-violet-600 text-white' : 'bg-[#1E2436] text-slate-200'}`}>
                        {msg.text || msg.content}
                      </div>
                      <span className="mt-1 px-1 text-[10px] text-slate-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
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

      {/* New Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121829] border border-[#2A324B] flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1E2436] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">New group</h3>
              <button onClick={closeGroupModal} className="text-slate-400 hover:text-white text-lg leading-none">
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-[#1E2436] space-y-3">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-[#1E2436] border border-[#2A324B] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />

              {selectedGroupUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedGroupUsers.map((u) => (
                    <button
                      key={getId(u)}
                      onClick={() => toggleGroupUser(u)}
                      className="flex items-center gap-1 rounded-full bg-violet-600/20 text-violet-300 px-3 py-1 text-xs"
                    >
                      {u.name} ✕
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Search users to add..."
                value={groupSearchQuery}
                onChange={(e) => handleGroupSearch(e.target.value)}
                className="w-full bg-[#1E2436] border border-[#2A324B] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {groupSearchResults.length === 0 && groupSearchQuery.trim() && (
                <p className="p-3 text-sm text-slate-500">No users found.</p>
              )}
              {groupSearchResults.map((u, idx) => {
                const isSelected = selectedGroupUsers.some((su) => getId(su) === getId(u));
                return (
                  <div
                    key={getId(u) || idx}
                    onClick={() => toggleGroupUser(u)}
                    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-violet-600/20' : 'hover:bg-[#1E2436]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-100">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.phone}</p>
                    </div>
                    {isSelected && <span className="text-violet-400 text-sm">✓</span>}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#1E2436]">
              <button
                onClick={createGroupChat}
                disabled={!groupName.trim() || selectedGroupUsers.length < 2 || creatingGroup}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold"
              >
                {creatingGroup ? 'Creating…' : `Create group${selectedGroupUsers.length > 0 ? ` (${selectedGroupUsers.length + 1} members)` : ''}`}
              </button>
              <p className="mt-2 text-[11px] text-slate-500 text-center">
                Select at least 2 other members to form a group.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}