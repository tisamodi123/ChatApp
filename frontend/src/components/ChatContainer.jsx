import React, { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketContext } from '../context/SocketContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatContainer = () => {
  const {
    selectedConversation,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (selectedConversation) {
      getMessages();
      if (socket && selectedConversation.type === 'room') {
        socket.emit('joinRoom', selectedConversation.id);
      }
    }
  }, [selectedConversation, getMessages, socket]);

  useEffect(() => {
    if (socket && authUser) {
      subscribeToMessages(socket, authUser);
    }
    return () => unsubscribeFromMessages(socket);
  }, [socket, authUser, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-base-100/50 overflow-hidden">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
};
