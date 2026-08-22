'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatContainerProps {
  messages: any[];
  currentUserId: string;
  isGroup: boolean;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string, deleteForEveryone: boolean) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onReplyMessage?: (message: any) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ChatContainer({
  messages,
  currentUserId,
  isGroup,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onReplyMessage,
  onLoadMore,
  hasMore,
}: ChatContainerProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto p-4 space-y-4 relative flex flex-col"
    >
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-violet-400 bg-violet-600/10 px-3 py-1 rounded-full hover:bg-violet-600/20 transition"
          >
            Load older messages...
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          No messages here yet. Send a message to start the conversation!
        </div>
      ) : (
        messages.map((msg, idx) => {
          const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
          const isOwn = senderId === currentUserId;
          const msgId = msg.id || msg._id;
          const senderName = msg.sender?.name || 'User';

          return (
            <div
              key={msgId || idx}
              className={`flex flex-col group relative ${isOwn ? 'items-end' : 'items-start'}`}
            >
              {/* Group Sender Name */}
              {isGroup && !isOwn && (
                <span className="text-[10px] text-violet-400 mb-1 ml-1 font-medium">
                  {senderName}
                </span>
              )}

              {/* Replying Context Banner if exists */}
              {msg.replyTo && (
                <div className={`text-[11px] mb-1 px-3 py-1 rounded-lg border bg-[#1E2436]/60 border-[#2A324B] max-w-md truncate ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-violet-400 font-semibold">Replying to: </span>
                  <span className="text-slate-300">{msg.replyTo.text || 'Media file'}</span>
                </div>
              )}

              <div className="flex items-center gap-2 max-w-[75%] sm:max-w-[60%] relative group">
                {/* Message Bubble Box */}
                <div
                  className={`relative px-4 py-2.5 rounded-2xl text-sm transition-all ${
                    isOwn
                      ? 'bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-600/20'
                      : 'bg-[#1E2436] text-slate-100 rounded-bl-none border border-[#2A324B]'
                  }`}
                >
                  {/* Media / Image Attachment */}
                  {msg.mediaUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl cursor-pointer">
                      <img
                        src={msg.mediaUrl}
                        alt="attachment"
                        className="max-h-60 w-full object-cover hover:scale-105 transition-transform"
                        onClick={() => setLightboxImage(msg.mediaUrl)}
                      />
                    </div>
                  )}

                  {/* Editing Mode vs Normal Text */}
                  {editingMessageId === msgId ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            if (onEditMessage) onEditMessage(msgId, editText);
                            setEditingMessageId(null);
                          }}
                          className="text-[10px] bg-emerald-600 px-2 py-0.5 rounded text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
                      {msg.reactions.map((r: any, rIdx: number) => (
                        <span key={rIdx} className="bg-black/30 px-1.5 py-0.5 rounded-full text-xs">
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Time & Status Read Receipt */}
                  <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'text-violet-200 justify-end' : 'text-slate-400 justify-start'}`}>
                    <span>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                      <span className="font-bold">
                        {msg.status === 'seen' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Hover Actions Dropdown / Trigger */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 relative">
                  <button
                    onClick={() => setActiveReactionPickerId(activeReactionPickerId === msgId ? null : msgId)}
                    className="p-1.5 rounded-lg bg-[#1E2436] hover:bg-slate-800 text-slate-300 text-xs"
                    title="React"
                  >
                    😊
                  </button>
                  <button
                    onClick={() => {
                      if (onReplyMessage) onReplyMessage(msg);
                    }}
                    className="p-1.5 rounded-lg bg-[#1E2436] hover:bg-slate-800 text-slate-300 text-xs"
                    title="Reply"
                  >
                    ↩️
                  </button>
                  {isOwn && (
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === msgId ? null : msgId)}
                      className="p-1.5 rounded-lg bg-[#1E2436] hover:bg-slate-800 text-slate-300 text-xs font-bold"
                      title="More"
                    >
                      ⋮
                    </button>
                  )}

                  {/* Reaction Emoji Picker Popup */}
                  {activeReactionPickerId === msgId && (
                    <div className="absolute bottom-8 right-0 bg-[#121829] border border-[#2A324B] p-1.5 rounded-xl shadow-2xl flex gap-1 z-30">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            if (onReactMessage) onReactMessage(msgId, emoji);
                            setActiveReactionPickerId(null);
                          }}
                          className="hover:bg-[#1E2436] p-1 rounded transition text-sm"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Edit / Delete Menu Popup */}
                  {activeMenuId === msgId && (
                    <div className="absolute right-0 top-8 w-32 bg-[#121829] border border-[#2A324B] rounded-xl shadow-2xl z-30 py-1 divide-y divide-[#1E2436]">
                      <button
                        onClick={() => {
                          setEditingMessageId(msgId);
                          setEditText(msg.text || '');
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-[#1E2436]"
                      >
                        Edit Message
                      </button>
                      <button
                        onClick={() => {
                          if (onDeleteMessage) onDeleteMessage(msgId, false);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-[#1E2436]"
                      >
                        Delete for me
                      </button>
                      <button
                        onClick={() => {
                          if (onDeleteMessage) onDeleteMessage(msgId, true);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-[#1E2436]"
                      >
                        Delete for everyone
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />

      {/* Media Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-sm font-bold"
          >
            ✕ Close
          </button>
          <img src={lightboxImage} alt="Fullscreen preview" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}