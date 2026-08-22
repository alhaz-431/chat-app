'use client';

import React, { useEffect, useRef } from 'react';

interface Sender {
  _id?: string;
  id?: string;
  name?: string;
}

interface Message {
  _id?: string;
  id?: string;
  text?: string;
  mediaUrl?: string; // মিডিয়া বা ইমেজ শেয়ারিংয়ের জন্য
  senderId?: string;
  sender?: Sender;
  createdAt?: string;
  status?: 'sent' | 'delivered' | 'seen'; // রিড রিসিপ্টের জন্য
}

interface ChatContainerProps {
  messages: Message[];
  currentUserId?: string;
  isGroup?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  currentUserId,
  isGroup = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-thumb-slate-800">
      {/* Date Divider */}
      <div className="text-center my-2">
        <span className="text-[10px] uppercase font-semibold tracking-wider bg-[#1E2436] text-slate-400 px-3 py-1 rounded-full border border-[#2A324B]">
          Today
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
          <p>No messages in this conversation yet.</p>
          <p className="text-[11px] text-slate-600 mt-1">Send a message to start chatting!</p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const senderId = msg.senderId || msg.sender?._id || msg.sender?.id;
          const isSent = senderId === currentUserId;
          const senderName = msg.sender?.name || 'Participant';

          return (
            <div
              key={msg._id || msg.id || index}
              className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%] ${
                isSent ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Show Sender Name in Group Chats for received messages */}
              {isGroup && !isSent && (
                <span className="text-[11px] font-medium text-violet-400 mb-1 ml-1">
                  {senderName}
                </span>
              )}

              {/* Message Bubble */}
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isSent
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-xs'
                    : 'bg-[#1E2436] text-slate-200 border border-[#2A324B] rounded-bl-xs'
                }`}
              >
                {/* Text Message */}
                {msg.text && <p className="break-words">{msg.text}</p>}

                {/* Media / Image Display */}
                {msg.mediaUrl && (
                  <img
                    src={msg.mediaUrl}
                    alt="Shared media"
                    className="mt-2 rounded-lg max-h-48 object-cover w-full"
                  />
                )}
              </div>

              {/* Time & Read Receipt (Ticks) */}
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] text-slate-500">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now'}
                </span>
                {isSent && (
                  <span
                    className={`text-[11px] font-bold ${
                      msg.status === 'seen' ? 'text-sky-400' : 'text-slate-400'
                    }`}
                    title={msg.status || 'sent'}
                  >
                    {msg.status === 'seen' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};