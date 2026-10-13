import React, { useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketContext } from '../context/SocketContext';
import { Send, Smile } from 'lucide-react';

export const MessageInput = () => {
  const [text, setText] = useState('');
  const { sendMessage, selectedConversation } = useChatStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocketContext() || {};
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (socket && selectedConversation && authUser) {
      socket.emit('typing', {
        user: authUser,
        roomId: selectedConversation.type === 'room' ? selectedConversation.id : null,
        receiverId: selectedConversation.type === 'direct' ? selectedConversation.id : null,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', {
          user: authUser,
          roomId: selectedConversation.type === 'room' ? selectedConversation.id : null,
          receiverId: selectedConversation.type === 'direct' ? selectedConversation.id : null,
        });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (socket && selectedConversation && authUser) {
      socket.emit('stopTyping', {
        user: authUser,
        roomId: selectedConversation.type === 'room' ? selectedConversation.id : null,
        receiverId: selectedConversation.type === 'direct' ? selectedConversation.id : null,
      });
    }

    const currentText = text;
    setText('');
    await sendMessage(currentText);
  };

  const insertEmoji = () => {
    const sample = ['😊', '👍', '🔥', '🎉', '❤️', '👋', '✨'];
    const chosen = sample[Math.floor(Math.random() * sample.length)];
    setText((prev) => `${prev} ${chosen}`.trim());
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-3 bg-base-100 border-t border-base-300 flex items-center gap-2"
    >
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          placeholder="Send a message..."
          value={text}
          onChange={handleInputChange}
          className="input input-sm input-bordered w-full pr-10 text-xs bg-base-200/50 rounded-lg focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={insertEmoji}
          className="absolute right-2 text-base-content/40 hover:text-base-content transition-colors"
          title="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
      </div>

      <button
        type="submit"
        disabled={!text.trim()}
        className="btn btn-sm btn-primary btn-circle text-primary-content disabled:opacity-40"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};
