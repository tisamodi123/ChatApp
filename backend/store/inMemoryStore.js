import bcrypt from 'bcryptjs';

// Pre-seeded users for demo & fallback testing
const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const initialUsers = [
  {
    _id: 'usr_tisa_01',
    username: 'tisa',
    fullName: 'Tisa Modi',
    password: defaultPasswordHash,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Tisa+Modi&backgroundColor=6366f1',
    bio: 'Full-Stack Developer 💻',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'usr_riddhi_02',
    username: 'riddhi',
    fullName: 'Riddhi Patel',
    password: defaultPasswordHash,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Riddhi+Patel&backgroundColor=ec4899',
    bio: 'UI/UX Designer & Frontend 🎨',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'usr_keyuri_03',
    username: 'keyuri',
    fullName: 'Keyuri Shah',
    password: defaultPasswordHash,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Keyuri+Shah&backgroundColor=10b981',
    bio: 'Backend & Cloud Engineer ⚡',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'usr_chetan_04',
    username: 'chetan',
    fullName: 'Chetan Sharma',
    password: defaultPasswordHash,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Chetan+Sharma&backgroundColor=f59e0b',
    bio: 'Software Engineer 🚀',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Pre-seeded community channels
const initialRooms = [
  {
    _id: 'room_general',
    name: 'general',
    displayName: 'General',
    description: 'Team conversations and daily updates',
    icon: '💬',
  },
  {
    _id: 'room_project',
    name: 'project',
    displayName: 'Project',
    description: 'Tasks, design reviews and coordination',
    icon: '📋',
  },
  {
    _id: 'room_random',
    name: 'random',
    displayName: 'Random',
    description: 'Casual conversations and coffee breaks',
    icon: '☕',
  },
];

const initialMessages = [
  {
    _id: 'msg_001',
    senderId: 'usr_chetan_04',
    senderName: 'Chetan Sharma',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Chetan+Sharma&backgroundColor=f59e0b',
    roomId: 'general',
    message: 'Hey team! How is the project progress going?',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: 'msg_002',
    senderId: 'usr_riddhi_02',
    senderName: 'Riddhi Patel',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Riddhi+Patel&backgroundColor=ec4899',
    roomId: 'general',
    message: 'Hey Chetan, I just finished reviewing the screens. Looks very clean!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'msg_003',
    senderId: 'usr_keyuri_03',
    senderName: 'Keyuri Shah',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Keyuri+Shah&backgroundColor=10b981',
    roomId: 'general',
    message: 'Great! All API endpoints and database schemas are in place.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: 'msg_004',
    senderId: 'usr_tisa_01',
    senderName: 'Tisa Modi',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Tisa+Modi&backgroundColor=6366f1',
    roomId: 'general',
    message: 'Awesome work everyone! Let us test the chat flow here.',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

class MemoryStore {
  constructor() {
    this.users = [...initialUsers];
    this.rooms = [...initialRooms];
    this.messages = [...initialMessages];
  }

  async findUserByUsername(username) {
    if (!username) return null;
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  async findUserById(id) {
    if (!id) return null;
    return this.users.find((u) => String(u._id) === String(id));
  }

  async createUser({ username, fullName, password, avatar, bio }) {
    const hashedPassword = password.startsWith('$2')
      ? password
      : bcrypt.hashSync(password, 10);

    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: username.toLowerCase().trim(),
      fullName: fullName || username,
      password: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || username)}`,
      bio: bio || 'PulseChat Member 🚀',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async getAllUsers() {
    return this.users.map(({ password, ...rest }) => rest);
  }

  async getRooms() {
    return this.rooms;
  }

  async getMessagesByRoom(roomId, limit = 100) {
    return this.messages.filter((m) => m.roomId === roomId).slice(-limit);
  }

  async getDirectMessages(userId1, userId2, limit = 100) {
    const u1 = String(userId1);
    const u2 = String(userId2);
    return this.messages
      .filter(
        (m) =>
          (String(m.senderId) === u1 && String(m.receiverId) === u2) ||
          (String(m.senderId) === u2 && String(m.receiverId) === u1)
      )
      .slice(-limit);
  }

  async addMessage(msg) {
    const newMsg = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...msg,
    };
    this.messages.push(newMsg);
    return newMsg;
  }
}

export const inMemoryStore = new MemoryStore();
