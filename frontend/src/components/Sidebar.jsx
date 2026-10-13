import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useSocketContext } from '../context/SocketContext';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Hash, MessageCircle } from 'lucide-react';

export const Sidebar = () => {
  const {
    rooms,
    users,
    getRooms,
    getUsers,
    selectedConversation,
    setSelectedConversation,
    isUsersLoading,
  } = useChatStore();

  const { onlineUsers = [] } = useSocketContext() || {};
  const { authUser } = useAuthStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    getRooms();
    if (authUser) {
      getUsers();
    }
  }, [getRooms, getUsers, authUser]);

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeOnline = Array.isArray(onlineUsers) ? onlineUsers : [];

  const filteredRooms = safeRooms.filter((r) =>
    r?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = safeUsers.filter((u) =>
    (u?.fullName || u?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-72 md:w-80 border-r border-base-300 bg-base-100 flex flex-col h-full shrink-0 select-none">
      {/* Search Bar */}
      <div className="p-3 border-b border-base-300">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 text-xs bg-base-200/50 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Rooms / Channels */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold text-base-content/40 uppercase tracking-wider">
            Channels
          </div>
          <div className="space-y-0.5">
            {filteredRooms.map((room) => {
              const isSelected =
                selectedConversation?.type === 'room' &&
                selectedConversation?.id === room.name;

              return (
                <button
                  key={room._id || room.name}
                  onClick={() =>
                    setSelectedConversation({
                      type: 'room',
                      id: room.name,
                      name: room.name,
                      displayName: `#${room.name}`,
                      description: room.description,
                      icon: room.icon || '💬',
                      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(room.name)}`,
                    })
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-content font-medium'
                      : 'hover:bg-base-200 text-base-content/80'
                  }`}
                >
                  <Hash className={`w-4 h-4 ${isSelected ? 'text-primary-content' : 'text-base-content/50'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">#{room.name}</div>
                    <div
                      className={`text-[11px] truncate ${
                        isSelected ? 'text-primary-content/80' : 'text-base-content/50'
                      }`}
                    >
                      {room.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold text-base-content/40 uppercase tracking-wider flex items-center justify-between">
            <span>Direct Messages</span>
            <span className="text-[10px] text-success font-medium">
              {safeOnline.length} online
            </span>
          </div>

          <div className="space-y-0.5">
            {isUsersLoading ? (
              <div className="p-3 text-center text-xs text-base-content/40">Loading chats...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-xs text-base-content/40">No contacts found</div>
            ) : (
              filteredUsers.map((user) => {
                const userIdStr = String(user._id);
                const isSelected =
                  selectedConversation?.type === 'direct' &&
                  String(selectedConversation?.id) === userIdStr;

                const isOnline = safeOnline.map(String).includes(userIdStr);

                return (
                  <button
                    key={user._id}
                    onClick={() =>
                      setSelectedConversation({
                        type: 'direct',
                        id: userIdStr,
                        name: user.username,
                        displayName: user.fullName || user.username,
                        description: user.bio || (isOnline ? 'Online' : 'Offline'),
                        avatar:
                          user.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.username)}`,
                      })
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-content font-medium'
                        : 'hover:bg-base-200 text-base-content/80'
                    }`}
                  >
                    {/* Avatar with DaisyUI online indicator */}
                    <div className={`avatar ${isOnline ? 'online' : 'offline'}`}>
                      <div className="w-8 h-8 rounded-full bg-base-300">
                        <img
                          src={
                            user.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.username)}`
                          }
                          alt={user.username}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {user.fullName || user.username}
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-primary-content/80' : 'text-base-content/50'
                        }`}
                      >
                        {isOnline ? 'Online' : user.bio || 'Offline'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
