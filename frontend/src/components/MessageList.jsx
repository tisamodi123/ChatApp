import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketContext } from '../context/SocketContext';
import { CheckCheck } from 'lucide-react';

export const MessageList = () => {
  const { messages, isMessagesLoading, selectedConversation } = useChatStore();
  const { authUser } = useAuthStore();
  const { typingState } = useSocketContext() || {};
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState]);

  const currentUserId = String(authUser?._id || '');
  const selectedConvId = String(selectedConversation?.id || '');

  const isSocketTyping =
    typingState &&
    String(typingState.user?._id) !== currentUserId &&
    ((selectedConversation?.type === 'room' &&
      typingState.roomId === selectedConversation.id) ||
      (selectedConversation?.type === 'direct' &&
        String(typingState.user?._id) === selectedConvId));

  const currentTypingPerson = isSocketTyping ? typingState.user : null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {isMessagesLoading ? (
        <div className="h-full flex items-center justify-center">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-base-content/50">
          <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-2xl mb-2">
            💬
          </div>
          <p className="font-semibold text-sm">No messages yet</p>
          <p className="text-xs">Say hello and start the conversation in real-time!</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = String(msg.senderId) === currentUserId;

          const time = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now';

          // Detect [image:URL] format
          let text = msg.message;
          let imageUrl = null;
          const match = msg.message?.match(/\[image:(https?:\/\/[^\s]+)\]/);
          if (match) {
            text = msg.message.replace(match[0], '').trim();
            imageUrl = match[1];
          }

          return (
            <div
              key={msg._id || Math.random()}
              className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}
            >
              <div className="chat-image avatar">
                <div className="w-8 rounded-full border border-base-300 bg-base-200">
                  <img
                    src={
                      msg.senderAvatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.senderName || 'user')}`
                    }
                    alt={msg.senderName || 'Avatar'}
                  />
                </div>
              </div>

              <div className="chat-header text-[11px] font-semibold opacity-70 mb-1 flex items-center gap-1.5">
                {!isMe && <span>{msg.senderName}</span>}
                <time className="text-[10px] font-mono opacity-50">{time}</time>
              </div>

              <div
                className={`chat-bubble text-xs leading-relaxed max-w-[85%] sm:max-w-[70%] break-words ${
                  isMe
                    ? 'chat-bubble-primary text-primary-content font-medium'
                    : 'bg-base-200 text-base-content border border-base-300'
                }`}
              >
                {text && <div>{text}</div>}
                {imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-base-content/10 max-w-xs">
                    <img src={imageUrl} alt="Attachment" className="w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="chat-footer opacity-50 text-[10px] flex items-center gap-1 mt-0.5">
                {isMe && <CheckCheck className="w-3.5 h-3.5 text-primary" />}
              </div>
            </div>
          );
        })
      )}

      {/* Real-time Typing Indicator */}
      {currentTypingPerson && (
        <div className="chat chat-start animate-fade-in">
          <div className="chat-image avatar">
            <div className="w-7 rounded-full bg-base-200">
              <img
                src={
                  currentTypingPerson.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentTypingPerson.fullName || currentTypingPerson.username || 'user')}`
                }
                alt={currentTypingPerson.username || 'user'}
              />
            </div>
          </div>
          <div className="chat-bubble bg-base-200 text-base-content border border-base-300 py-2 px-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-primary">
                {currentTypingPerson.fullName || currentTypingPerson.username}
              </span>
              <span className="text-base-content/60 text-[11px]">is typing</span>
              <span className="inline-flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-1"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-2"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-3"></span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
