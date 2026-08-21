'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { ChatContainer } from '@/components/ChatContainer';
import { GroupModal } from '@/components/GroupModal';

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  
  // UI & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  
  const router = useRouter();

  // 1. Auth & Initial Load (Extracting current logged-in User ID)
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    
    // Check various common keys where user data might be stored
    const userStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUserId(parsed.id || parsed._id || parsed.userId || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (!savedToken) {
      router.push('/login');
    } else {
      setToken(savedToken);
      fetchConversations();
    }
  }, [router]);

  const socket = useSocket(token);

  // 2. Real-time Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (newMessage: any) => {
      const activeId = activeChat?.id || activeChat?._id;
      if (activeChat && newMessage.conversationId === activeId) {
        setMessages((prev) => [...prev, newMessage]);
      }
      fetchConversations();
    });

    return () => {
      socket.off('message:new');
    };
  }, [socket, activeChat]);

  // 3. API Calls
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/conversations');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.conversations || res.data?.data || [];
      setConversations(data);
    } catch (err) {
      console.error('Fetch Conversations Error:', err);
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
      setActiveChat(res.data);
      fetchMessages(res.data.id || res.data._id);
      setSearchResults([]);
      setSearchQuery('');
      fetchConversations();
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

    try {
      const res = await api.post('/messages', {
        conversationId: activeChat.id || activeChat._id,
        text,
      });
      setMessages((prev) => [...prev, res.data]);
      setText('');
      fetchConversations();
    } catch (err) {
      console.error('Send Message Error:', err);
    }
  };

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : 'C');

  return (
    <div className="flex h-screen bg-[#0B0E17] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar - Conversations & Direct Search */}
      <aside
        className={`w-full md:w-80 lg:w-96 border-r border-[#1E2436] bg-[#121829] flex flex-col z-20 transition-all duration-300 ${
          activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
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

          {/* Group Creation Button */}
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-violet-600/30 active:scale-95"
          >
            <span className="text-sm">+</span> New Group
          </button>
        </div>

        {/* User Search for 1-to-1 Chat */}
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

          {/* User Search Dropdown */}
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

        {/* Conversation List */}
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

              return (
                <div
                  key={c.id || c._id || idx}
                  onClick={() => {
                    setActiveChat(c);
                    fetchMessages(c.id || c._id);
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
                      {isGroup ? '👥' : getInitial(c.name)}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm truncate">{c.name || 'Conversation'}</p>
                      {isGroup && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                          Group
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
            {/* Active Chat Header */}
            <header className="p-3.5 md:p-4 border-b border-[#1E2436] bg-[#121829] flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2 rounded-xl bg-[#1E2436] border border-[#2A324B] text-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300">
                  {activeChat.isGroup ? '👥' : getInitial(activeChat.name)}
                </div>

                <div>
                  <h2 className="font-bold text-white text-sm leading-tight truncate max-w-[180px] sm:max-w-xs">
                    {activeChat.name || 'Chat'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {activeChat.isGroup
                      ? `${activeChat.participants?.length || ''} members`
                      : 'One-to-One Conversation'}
                  </span>
                </div>
              </div>
            </header>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-hidden p-3 md:p-4 bg-[#0B0E17]">
              <ChatContainer
                messages={messages}
                currentUserId={currentUserId}
                isGroup={activeChat.isGroup || (activeChat.participants && activeChat.participants.length > 2)}
              />
            </div>

            {/* Message Input Bar */}
            <footer className="p-3 md:p-4 border-t border-[#1E2436] bg-[#121829]">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 bg-[#1E2436] border border-[#2A324B] rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white p-3 rounded-2xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center shrink-0 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
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