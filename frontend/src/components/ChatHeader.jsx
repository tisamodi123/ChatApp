import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { useSocketContext } from '../context/SocketContext';
import { Video, RefreshCw, Hash, User } from 'lucide-react';

export const ChatHeader = () => {
  const { selectedConversation, setCallModalOpen, getMessages } = useChatStore();
  const { onlineUsers = [] } = useSocketContext() || {};

  if (!selectedConversation) return null;

  const isDirect = selectedConversation.type === 'direct';
  const isOnline = isDirect && onlineUsers.map(String).includes(String(selectedConversation.id));

  return (
    <div className="h-14 px-4 border-b border-base-300 bg-base-100 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className={`avatar ${isDirect ? (isOnline ? 'online' : 'offline') : ''}`}>
          <div className="w-8 h-8 rounded-full bg-base-300">
            <img
              src={
                selectedConversation.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedConversation.displayName || selectedConversation.name)}`
              }
              alt={selectedConversation.displayName}
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-xs text-base-content flex items-center gap-1.5">
            {isDirect ? (
              <span>{selectedConversation.displayName || selectedConversation.name}</span>
            ) : (
              <span>{selectedConversation.displayName}</span>
            )}
          </h2>
          <p className="text-[11px] text-base-content/50">
            {isDirect ? (isOnline ? 'Online' : 'Offline') : selectedConversation.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCallModalOpen(true)}
          className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
          title="Start video call"
        >
          <Video className="w-4 h-4" />
        </button>

        <button
          onClick={getMessages}
          className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
          title="Reload messages"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
