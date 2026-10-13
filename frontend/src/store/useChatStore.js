import { create } from 'zustand';
import { soundManager } from '../utils/sound';
import { useAuthStore, getAuthHeaders } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  rooms: [],
  selectedConversation: {
    type: 'room',
    id: 'general',
    name: 'general',
    displayName: '#general',
    description: 'Team conversations and daily updates',
    icon: '💬',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=General',
  },
  isUsersLoading: false,
  isRoomsLoading: false,
  isMessagesLoading: false,
  soundEnabled: true,
  isCallModalOpen: false,

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    if (next) soundManager.playChime();
  },

  setCallModalOpen: (isOpen) => set({ isCallModalOpen: isOpen }),

  setSelectedConversation: (conv) => {
    const prev = get().selectedConversation;
    set({ selectedConversation: conv });
    get().getMessages();
  },

  getRooms: async () => {
    set({ isRoomsLoading: true });
    try {
      const res = await fetch('/api/users/rooms', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      set({ rooms: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({ rooms: [] });
    } finally {
      set({ isRoomsLoading: false });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await fetch('/api/users/sidebar', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      set({ users: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async () => {
    const { selectedConversation } = get();
    if (!selectedConversation) return;

    set({ isMessagesLoading: true });
    try {
      const url =
        selectedConversation.type === 'room'
          ? `/api/messages/room/${selectedConversation.id}`
          : `/api/messages/direct/${selectedConversation.id}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      set({ messages: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageText) => {
    const { selectedConversation } = get();
    const authUser = useAuthStore.getState().authUser;

    if (!selectedConversation || !messageText.trim() || !authUser) return;

    const payload = {
      message: messageText.trim(),
      roomId: selectedConversation.type === 'room' ? selectedConversation.id : null,
      receiverId: selectedConversation.type === 'direct' ? selectedConversation.id : null,
    };

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send message');
      }

      const sentMsg = await res.json();

      // If this message isn't already added by the socket listener, add it
      const currentMessages = get().messages;
      if (!currentMessages.some((m) => String(m._id) === String(sentMsg._id))) {
        set({ messages: [...currentMessages, sentMsg] });
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  },

  subscribeToMessages: (socket, authUser) => {
    if (!socket) return;
    socket.off('newMessage');

    socket.on('newMessage', (newMessage) => {
      const { selectedConversation, soundEnabled } = get();
      if (!selectedConversation || !newMessage) return;

      const currentUserId = String(authUser?._id || '');
      const msgSenderId = String(newMessage.senderId);
      const msgReceiverId = String(newMessage.receiverId || '');
      const selectedId = String(selectedConversation.id);

      const isCurrentChat =
        (selectedConversation.type === 'room' &&
          (newMessage.roomId === selectedConversation.id || (!newMessage.receiverId && newMessage.roomId === selectedConversation.name))) ||
        (selectedConversation.type === 'direct' &&
          ((msgSenderId === selectedId && msgReceiverId === currentUserId) ||
            (msgSenderId === currentUserId && msgReceiverId === selectedId)));

      if (isCurrentChat) {
        const currentMessages = get().messages;
        if (!currentMessages.some((m) => String(m._id) === String(newMessage._id))) {
          set({ messages: [...currentMessages, newMessage] });
        }
      }

      // Play sound chime if the message arrived from another person
      if (msgSenderId !== currentUserId && soundEnabled) {
        soundManager.playChime();
      }
    });
  },

  unsubscribeFromMessages: (socket) => {
    if (!socket) return;
    socket.off('newMessage');
  },
}));
