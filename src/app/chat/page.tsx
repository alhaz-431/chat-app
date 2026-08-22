'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { ChatContainer } from '@/components/ChatContainer';
import { GroupModal } from '@/components/GroupModal';
import { useAuthStore } from '@/lib/store';

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  
  // Advanced Features State
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [page, setPage] = useState(1);
  
  // Real-time Status States
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Media Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  
  const router = useRouter();
  const socket = useSocket(token) as any;

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // 1. Auth & Initial Load with Robust Token Verification
  useEffect(() => {
    const checkAuth = () => {
      const savedToken = localStorage.getItem('token') || useAuthStore.getState().token;
      
      if (!savedToken) {
        setTimeout(() => {
          const recheckToken = localStorage.getItem('token') || useAuthStore.getState().token;
          if (!recheckToken) {
            router.push('/login');
          } else {
            initializeUser(recheckToken);
          }
        }, 300);
        return;
      }

      initializeUser(savedToken);
    };

    checkAuth();
  }, [router]);

  const initializeUser = (savedToken: string) => {
    const userStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
    const storeUser = useAuthStore.getState().user as any;

    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUserId(parsed.id || parsed._id || parsed.userId || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else if (storeUser) {
      setCurrentUserId(storeUser.id || storeUser._id || '');
    }

    setToken(savedToken);
    fetchConversations();
  };

  // 2. Real-time Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: any) => {
      const currentActive = activeChatRef.current;
      const activeId = currentActive?.id || currentActive?._id;
      
      if (currentActive && newMessage.conversationId === activeId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => (msg.id || msg._id) === (newMessage.id || newMessage._id));
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        socket.emit('message:read', {
          conversationId: activeId,
          messageId: newMessage.id || newMessage._id,
        });

        const senderObj = newMessage.sender;
        const senderId = typeof senderObj === 'string' ? senderObj : (senderObj?._id || senderObj?.id);
        
        if (senderId !== currentUserId) {
          playNotificationSound();
        }
      }
      fetchConversations();
    };

    const handleStatusUpdate = (data: { messageId: string; status: 'delivered' | 'seen' }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          (msg.id === data.messageId || msg._id === data.messageId)
            ? { ...msg, status: data.status }
            : msg
        )
      );
    };

    const handleTypingDisplay = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      const currentActive = activeChatRef.current;
      const activeId = currentActive?.id || currentActive?._id;
      if (currentActive && data.conversationId === activeId && data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
      }
    };

    const handleUserStatus = (data: { userId: string; isOnline: boolean }) => {
      const currentActive = activeChatRef.current;
      if (currentActive && !activeChat.isGroup) {
        const otherParticipant = activeChat.participants?.find(
          (p: any) => (p._id || p.id || p) !== currentUserId
        );
        const otherId = otherParticipant?._id || otherParticipant?.id || otherParticipant;
        if (otherId === data.userId) {
          setIsOnline(data.isOnline);
        }
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:update-status', handleStatusUpdate);
    socket.on('typing:display', handleTypingDisplay);
    socket.on('user:status', handleUserStatus);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:update-status', handleStatusUpdate);
      socket.off('typing:display', handleTypingDisplay);
      socket.off('user:status', handleUserStatus);
    };
  }, [socket, currentUserId]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch((err) => console.log('Audio play error:', err));
    } catch (e) {
      console.log('Sound error:', e);
    }
  };

  const fetchConversations = async () => {
    setIsLoading(true);
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
      setConversations([]);
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
      setSearchResults(data);
    } catch (err) {
      console.error('User Search Error:', err);
      setSearchResults([]);
    }
  };

  const startDirectChat = async (userId: string) => {
    if (!userId) return;
    try {
      const res = await api.post('/conversations', { userId });
      const chatData = res.data;
      setActiveChat(chatData);
      fetchMessages(chatData.id || chatData._id, 1);
      setSearchResults([]);
      setSearchQuery('');
      fetchConversations();
    } catch (err) {
      console.error('Start Direct Chat Error:', err);
    }
  };

  const fetchMessages = async (id: string, pageNum = 1) => {
    if (!id) return;
    try {
      const res = await api.get(`/conversations/${id}/messages?page=${pageNum}&limit=30`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.messages || res.data?.data || [];
      
      setHasMoreMessages(data.length >= 30);
      
      if (pageNum === 1) {
        setMessages(data);
      } else {
        setMessages((prev) => [...data, ...prev]);
      }

      if (socket && data.length > 0 && pageNum === 1) {
        const lastMsg = data[data.length - 1];
        socket.emit('message:read', {
          conversationId: id,
          messageId: lastMsg.id || lastMsg._id,
        });
      }
    } catch (err) {
      console.error('Fetch Messages Error:', err);
      if (pageNum === 1) setMessages([]);
    }
  };

  const handleLoadMore = () => {
    if (!hasMoreMessages || !activeChat) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(activeChat.id || activeChat._id, nextPage);
  };

  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (socket && activeChat) {
      const activeId = activeChat.id || activeChat._id;
      
      socket.emit('typing', {
        conversationId: activeId,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          conversationId: activeId,
          isTyping: false,
        });
      }, 2000);
    }
  };

  // Fixed sendMessage function
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || !activeChat) return;

    setIsUploading(true);
    try {
      const activeId = activeChat.id || activeChat._id;
      let res;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('conversationId', activeId);
        formData.append('chatId', activeId); 
        
        if (text.trim()) {
          formData.append('text', text);
          formData.append('content', text);
        }
        
        formData.append('media', selectedFile);
        formData.append('file', selectedFile);
        formData.append('image', selectedFile);

        if (replyingTo) formData.append('replyTo', replyingTo.id || replyingTo._id);

        res = await api.post('/messages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/messages', {
          conversationId: activeId,
          chatId: activeId,
          text: text,
          content: text,
          replyTo: replyingTo ? (replyingTo.id || replyingTo._id) : undefined,
        });
      }

      const newMsg = res.data;
      setMessages((prev) => {
        const exists = prev.some((m) => (m.id || m._id) === (newMsg.id || newMsg._id));
        if (exists) return prev;
        return [...prev, newMsg];
      });

      setText('');
      setSelectedFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchConversations();
    } catch (err: any) {
      console.error('Send Message Error:', err.response?.data || err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      await api.put(`/messages/${messageId}`, { text: newText });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId || msg._id === messageId ? { ...msg, text: newText } : msg))
      );
    } catch (err) {
      console.error('Edit Message Error:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      await api.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      setMessages((prev) => prev.filter((msg) => (msg.id || msg._id) !== messageId));
    } catch (err) {
      console.error('Delete Message Error:', err);
    }
  };

  const handleReactMessage = async (messageId: string, emoji: string) => {
    try {
      const res = await api.post(`/messages/${messageId}/reactions`, { emoji });
      setMessages((prev) =>
        prev.map((msg) =>
          (msg.id === messageId || msg._id === messageId) ? { ...msg, reactions: res.data.reactions } : msg
        )
      );
    } catch (err) {
      console.error('React Message Error:', err);
    }
  };

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : 'C');

  const getConversationName = (c: any) => {
    if (c.name) return c.name;
    if (c.participants && Array.isArray(c.participants)) {
      const otherParticipant = c.participants.find(
        (p: any) => (typeof p === 'object' ? (p._id || p.id) : p) !== currentUserId
      );
      if (otherParticipant && typeof otherParticipant === 'object') {
        return otherParticipant.name || otherParticipant.email || 'Direct Chat';
      }
    }
    return 'Chat';
  };

  return (
    <div className="flex h-screen bg-[#0B0E17] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`w-full md:w-80 lg:w-96 border-r border-[#1E2436] bg-[#121829] flex flex-col z-20 transition-all duration-300 ${
          activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-[#1E2436] flex justify-between items-center bg-[#121829]">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-[#1E2436] hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-white tracking-wide">Chats</h1>
          </div>

          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-violet-600/30 active:scale-95"
          >
            <span className="text-sm">+</span> New Group
          </button>
        </div>

        <div className="p-4 relative">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search user to start 1-to-1 chat..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#1E2436] border border-[#2A324B] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-16 bg-[#121829] border border-[#2A324B] rounded-2xl mt-1 max-h-56 overflow-y-auto shadow-2xl z-50 divide-y divide-[#1E2436]">
              {searchResults.map((u, idx) => (
                <div
                  key={u.id || u._id || idx}
                  onClick={() => startDirectChat(u.id || u._id)}
                  className="p-3 hover:bg-[#1E2436] cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                    {getInitial(u.name)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-slate-100 truncate">{u.name || 'User'}</p>
                    <p className="text-xs text-slate-400 truncate">{u.phone || u.email || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No active conversations yet. Search for a user or create a group to start!
            </div>
          ) : (
            conversations.map((c, idx) => {
              const isActive = activeChat?.id === c.id || activeChat?._id === c._id;
              const isGroup = c.isGroup || (c.participants && c.participants.length > 2);
              const displayName = getConversationName(c);

              return (
                <div
                  key={c.id || c._id || idx}
                  onClick={() => {
                    setActiveChat(c);
                    setIsTyping(false);
                    setPage(1);
                    fetchMessages(c.id || c._id, 1);
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                      : 'hover:bg-[#1E2436] text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                        isGroup
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                          : 'bg-[#1E2436] text-violet-400 border border-[#2A324B]'
                      }`}
                    >
                      {isGroup ? '👥' : getInitial(displayName)}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm truncate">{displayName}</p>
                      {c.unreadCount > 0 && (
                        <span className="text-[10px] bg-violet-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {isGroup ? `${c.participants?.length || 'Multiple'} members` : 'Direct message'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Experience: Active Chat Screen */}
      <main
        className={`flex-1 flex flex-col bg-[#0B0E17] relative w-full h-full transition-all duration-300 ${
          !activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeChat ? (
          <>
            <header className="p-3.5 md:p-4 border-b border-[#1E2436] bg-[#121829] flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveChat(null);
                    setIsTyping(false);
                  }}
                  className="md:hidden p-2 rounded-xl bg-[#1E2436] border border-[#2A324B] text-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300">
                    {activeChat.isGroup ? '👥' : getInitial(getConversationName(activeChat))}
                  </div>
                  {!activeChat.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121829] ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-white text-sm leading-tight truncate max-w-[180px] sm:max-w-xs">
                    {getConversationName(activeChat)}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {isTyping ? (
                      <span className="text-violet-400 font-medium animate-pulse">typing...</span>
                    ) : activeChat.isGroup ? (
                      `${activeChat.participants?.length || ''} members`
                    ) : (
                      isOnline ? 'Online' : 'Offline'
                    )}
                  </span>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-hidden bg-[#0B0E17]">
              <ChatContainer
                messages={messages}
                currentUserId={currentUserId}
                isGroup={activeChat.isGroup || (activeChat.participants && activeChat.participants.length > 2)}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onReplyMessage={(msg) => setReplyingTo(msg)}
                onLoadMore={handleLoadMore}
                hasMore={hasMoreMessages}
              />
            </div>

            <footer className="p-3 md:p-4 border-t border-[#1E2436] bg-[#121829] flex flex-col gap-2">
              {replyingTo && (
                <div className="flex items-center justify-between bg-[#1E2436] px-3 py-1.5 rounded-xl border border-[#2A324B] text-xs">
                  <span className="text-violet-300 truncate max-w-[250px]">
                    ↩️ Replying to: {replyingTo.text || 'Media attachment'}
                  </span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-red-400 font-bold">
                    ✕
                  </button>
                </div>
              )}

              {selectedFile && (
                <div className="flex items-center justify-between bg-[#1E2436] px-3 py-1.5 rounded-xl border border-[#2A324B] text-xs">
                  <span className="text-violet-300 truncate max-w-[200px]">📎 {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-red-400 font-bold px-1.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-2xl bg-[#1E2436] hover:bg-slate-800 text-slate-400 hover:text-white border border-[#2A324B] transition-all shrink-0"
                  title="Attach Image or File"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={handleTypingInput}
                  className="flex-1 bg-[#1E2436] border border-[#2A324B] rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={isUploading || (text.trim() === '' && !selectedFile)}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white p-3 rounded-2xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-[#0B0E17]">
            <div className="w-16 h-16 rounded-3xl bg-[#1E2436] border border-[#2A324B] flex items-center justify-center mb-4 text-2xl shadow-xl">
              💬
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1">No Chat Selected</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Select a 1-to-1 conversation or a group from the sidebar to start messaging.
            </p>
          </div>
        )}
      </main>

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreated={() => fetchConversations()}
      />
    </div>
  );
}