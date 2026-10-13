// PulseChat Client Logic
let socket = null;
let currentUser = null;
let currentTarget = { type: 'room', id: 'general', title: '#general', subtitle: 'Real-time WebSocket chat room', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=general' };
let onlineUserIds = new Set();
let rooms = [];
let allUsers = [];
let soundEnabled = true;
let typingTimeout = null;

// Audio Context Synthesizer for high-fidelity notification chimes
class SoundNotification {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playChime() {
    if (!soundEnabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.1); // A5

      osc2.frequency.setValueAtTime(880.0, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio notification fallback:', e);
    }
  }
}

const notifier = new SoundNotification();

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabSignupBtn = document.getElementById('tabSignupBtn');

const myAvatar = document.getElementById('myAvatar');
const myFullName = document.getElementById('myFullName');
const myUsername = document.getElementById('myUsername');
const logoutBtn = document.getElementById('logoutBtn');

const searchInput = document.getElementById('searchInput');
const roomsList = document.getElementById('roomsList');
const usersList = document.getElementById('usersList');
const onlineCountBadge = document.getElementById('onlineCountBadge');
const roomCountBadge = document.getElementById('roomCountBadge');

const targetAvatar = document.getElementById('targetAvatar');
const targetTitle = document.getElementById('targetTitle');
const targetSubtitle = document.getElementById('targetSubtitle');
const targetStatusDot = document.getElementById('targetStatusDot');

const messagesContainer = document.getElementById('messagesContainer');
const messagesList = document.getElementById('messagesList');
const loadingMessages = document.getElementById('loadingMessages');

const chatInputForm = document.getElementById('chatInputForm');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');

const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const soundLabel = document.getElementById('soundLabel');

const videoCallBtn = document.getElementById('videoCallBtn');
const videoCallModal = document.getElementById('videoCallModal');
const closeVideoModal = document.getElementById('closeVideoModal');
const endCallBtn = document.getElementById('endCallBtn');

const openArchModal = document.getElementById('openArchModal');
const archModal = document.getElementById('archModal');
const closeArchModal = document.getElementById('closeArchModal');

const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');

// Init Check
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  setupQuickUsers();
  
  const savedUser = localStorage.getItem('pulsechat_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    initApp();
  } else {
    authModal.classList.remove('hidden');
  }
});

function setupEventListeners() {
  // Tabs
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabSignupBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  });

  tabSignupBtn.addEventListener('click', () => {
    tabSignupBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // Forms
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    await handleLogin(username, password);
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const fullName = document.getElementById('signupFullName').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const bio = document.getElementById('signupBio').value.trim();
    await handleSignup(username, fullName, password, bio);
  });

  logoutBtn.addEventListener('click', handleLogout);

  // Chat Input
  chatInputForm.addEventListener('submit', handleSendMessage);
  messageInput.addEventListener('input', handleTyping);

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔔' : '07';
    soundLabel.textContent = soundEnabled ? 'Sound On' : 'Sound Muted';
    if (soundEnabled) notifier.playChime();
  });

  // Modals
  videoCallBtn.addEventListener('click', () => videoCallModal.classList.remove('hidden'));
  closeVideoModal.addEventListener('click', () => videoCallModal.classList.add('hidden'));
  endCallBtn.addEventListener('click', () => videoCallModal.classList.add('hidden'));

  openArchModal.addEventListener('click', () => archModal.classList.remove('hidden'));
  closeArchModal.addEventListener('click', () => archModal.classList.add('hidden'));

  // Mobile Sidebar
  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Emoji Shortcut
  document.getElementById('emojiBtn').addEventListener('click', () => {
    const emojis = ['🚀', '🔥', '💬', '✨', '⚡', '🎉', '👍', '❤️'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    messageInput.value += ` ${randomEmoji}`;
    messageInput.focus();
  });

  // Attach Image Shortcut
  document.getElementById('attachBtn').addEventListener('click', () => {
    const sampleUrls = [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=80',
    ];
    const picked = prompt('Paste an image URL or use demo preview image:', sampleUrls[0]);
    if (picked) {
      messageInput.value += ` [image:${picked}]`;
      messageInput.focus();
    }
  });

  // Search Filter
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.rooms-list .nav-item').forEach((el) => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(term) ? 'flex' : 'none';
    });
    document.querySelectorAll('.users-list .nav-item').forEach((el) => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(term) ? 'flex' : 'none';
    });
  });
}

function setupQuickUsers() {
  document.querySelectorAll('.quick-user-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const userKey = btn.getAttribute('data-user');
      await quickLogin(userKey);
    });
  });
}

async function quickLogin(userKey) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userKey, password: 'password123' }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      localStorage.setItem('pulsechat_user', JSON.stringify(currentUser));
      updateQuickButtons();
      initApp();
    }
  } catch (err) {
    console.error('Quick login error:', err);
  }
}

function updateQuickButtons() {
  document.querySelectorAll('.quick-user-btn').forEach((btn) => {
    if (currentUser && btn.getAttribute('data-user') === currentUser.username) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

async function handleLogin(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    currentUser = data.user;
    localStorage.setItem('pulsechat_user', JSON.stringify(currentUser));
    authModal.classList.add('hidden');
    updateQuickButtons();
    initApp();
  } catch (err) {
    alert(err.message);
  }
}

async function handleSignup(username, fullName, password, bio) {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, fullName, password, bio }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    currentUser = data.user;
    localStorage.setItem('pulsechat_user', JSON.stringify(currentUser));
    authModal.classList.add('hidden');
    updateQuickButtons();
    initApp();
  } catch (err) {
    alert(err.message);
  }
}

function handleLogout() {
  if (socket) socket.disconnect();
  currentUser = null;
  localStorage.removeItem('pulsechat_user');
  authModal.classList.remove('hidden');
  updateQuickButtons();
}

function initApp() {
  authModal.classList.add('hidden');
  updateQuickButtons();

  // Render current user profile
  myAvatar.src = currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`;
  myFullName.textContent = currentUser.fullName || currentUser.username;
  myUsername.textContent = `@${currentUser.username}`;

  // Connect Socket.IO
  connectSocket();

  // Load sidebar data & messages
  loadRooms();
  loadSidebarUsers();
  loadMessages();
}

function connectSocket() {
  if (socket) {
    socket.disconnect();
  }

  socket = io({
    query: {
      userId: currentUser._id,
      username: currentUser.username,
    },
  });

  socket.on('connect', () => {
    console.log('⚡ Connected to Socket server with ID:', socket.id);
    if (currentTarget.type === 'room') {
      socket.emit('joinRoom', currentTarget.id);
    }
  });

  socket.on('getOnlineUsers', (userIds) => {
    onlineUserIds = new Set(userIds);
    renderSidebarUsers();
    renderOnlineCount();
    updateTargetPresence();
  });

  socket.on('newMessage', (message) => {
    // Check if message belongs to current room or direct chat
    const isCurrentChat =
      (currentTarget.type === 'room' && message.roomId === currentTarget.id) ||
      (currentTarget.type === 'direct' &&
        ((message.senderId === currentTarget.id && message.receiverId === currentUser._id) ||
         (message.senderId === currentUser._id && message.receiverId === currentTarget.id)));

    if (isCurrentChat) {
      appendMessageToDOM(message);
      scrollToBottom();
    }

    // Play chime if message came from someone else
    if (message.senderId !== currentUser._id) {
      notifier.playChime();
    }
  });

  socket.on('userTyping', ({ user, roomId, receiverId }) => {
    const isCurrentChat =
      (currentTarget.type === 'room' && roomId === currentTarget.id) ||
      (currentTarget.type === 'direct' && user._id === currentTarget.id);

    if (isCurrentChat && user._id !== currentUser._id) {
      typingText.textContent = `${user.fullName || user.username} is typing...`;
      typingIndicator.style.display = 'flex';
    }
  });

  socket.on('userStoppedTyping', ({ user }) => {
    if (user._id !== currentUser._id) {
      typingIndicator.style.display = 'none';
    }
  });
}

function updateTargetPresence() {
  if (currentTarget.type === 'direct') {
    const isOnline = onlineUserIds.has(currentTarget.id);
    targetStatusDot.style.background = isOnline ? 'var(--success)' : 'var(--text-muted)';
    targetSubtitle.textContent = isOnline ? 'Active Now • Online via WebSocket' : 'Offline • Last seen recently';
  } else {
    targetStatusDot.style.background = 'var(--success)';
    targetSubtitle.textContent = `${onlineUserIds.size} users connected to WebSocket`;
  }
}

async function loadRooms() {
  try {
    const res = await fetch('/api/users/rooms');
    rooms = await res.json();
    roomCountBadge.textContent = rooms.length;
    renderRooms();
  } catch (err) {
    console.error('Error loading rooms:', err);
  }
}

function renderRooms() {
  roomsList.innerHTML = '';
  rooms.forEach((room) => {
    const li = document.createElement('li');
    li.className = `nav-item ${currentTarget.type === 'room' && currentTarget.id === room.name ? 'active' : ''}`;
    li.innerHTML = `
      <span class="nav-item-icon">${room.icon || '💬'}</span>
      <div class="nav-item-content">
        <div class="nav-item-title">#${room.name}</div>
        <div class="nav-item-desc">${room.description}</div>
      </div>
    `;
    li.addEventListener('click', () => {
      selectTarget({
        type: 'room',
        id: room.name,
        title: `#${room.name}`,
        subtitle: room.description,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${room.name}`,
      });
    });
    roomsList.appendChild(li);
  });
}

async function loadSidebarUsers() {
  try {
    const res = await fetch('/api/users/sidebar');
    allUsers = await res.json();
    renderSidebarUsers();
    renderOnlineCount();
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

function renderSidebarUsers() {
  usersList.innerHTML = '';
  allUsers.forEach((user) => {
    const isOnline = onlineUserIds.has(user._id);
    const li = document.createElement('li');
    li.className = `nav-item ${currentTarget.type === 'direct' && currentTarget.id === user._id ? 'active' : ''}`;
    li.innerHTML = `
      <div class="nav-item-avatar-wrap">
        <img src="${user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}" alt="${user.username}">
        <span class="online-indicator ${isOnline ? 'online' : 'offline'}"></span>
      </div>
      <div class="nav-item-content">
        <div class="nav-item-title">${user.fullName || user.username}</div>
        <div class="nav-item-desc">${isOnline ? 'Online' : user.bio || 'Offline'}</div>
      </div>
    `;
    li.addEventListener('click', () => {
      selectTarget({
        type: 'direct',
        id: user._id,
        title: user.fullName || user.username,
        subtitle: isOnline ? 'Active Now' : 'Offline',
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
      });
    });
    usersList.appendChild(li);
  });
}

function renderOnlineCount() {
  onlineCountBadge.textContent = `${onlineUserIds.size} Online`;
}

function selectTarget(target) {
  if (currentTarget.type === 'room' && target.type !== 'room' && socket) {
    socket.emit('leaveRoom', currentTarget.id);
  }

  currentTarget = target;
  targetAvatar.src = target.avatar;
  targetTitle.textContent = target.title;
  targetSubtitle.textContent = target.subtitle;

  if (target.type === 'room' && socket) {
    socket.emit('joinRoom', target.id);
  }

  updateTargetPresence();
  renderRooms();
  renderSidebarUsers();
  loadMessages();

  // Close sidebar on mobile
  sidebar.classList.remove('open');
}

async function loadMessages() {
  loadingMessages.style.display = 'flex';
  messagesList.innerHTML = '';

  try {
    const url = currentTarget.type === 'room'
      ? `/api/messages/room/${currentTarget.id}`
      : `/api/messages/direct/${currentTarget.id}`;

    const res = await fetch(url);
    const messages = await res.json();
    loadingMessages.style.display = 'none';

    if (Array.isArray(messages)) {
      messages.forEach((msg) => appendMessageToDOM(msg));
      scrollToBottom();
    }
  } catch (err) {
    loadingMessages.style.display = 'none';
    console.error('Error loading messages:', err);
  }
}

function appendMessageToDOM(msg) {
  const isMe = msg.senderId === currentUser._id;
  const row = document.createElement('div');
  row.className = `message-row ${isMe ? 'me' : 'other'}`;

  const timeFormatted = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  // Handle embedded image format [image:URL]
  let contentHtml = escapeHtml(msg.message);
  let attachmentHtml = '';
  const imgMatch = msg.message.match(/\[image:(https?:\/\/[^\s]+)\]/);
  if (imgMatch) {
    contentHtml = escapeHtml(msg.message.replace(imgMatch[0], ''));
    attachmentHtml = `<div class="msg-attachment"><img src="${escapeHtml(imgMatch[1])}" alt="Attachment"></div>`;
  }

  row.innerHTML = `
    <img src="${msg.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}" alt="Avatar" class="msg-avatar">
    <div class="msg-body">
      ${!isMe ? `<span class="msg-sender-name">${escapeHtml(msg.senderName || 'User')}</span>` : ''}
      <div class="msg-bubble">
        ${contentHtml ? `<span>${contentHtml}</span>` : ''}
        ${attachmentHtml}
      </div>
      <div class="msg-footer">
        <span>${timeFormatted}</span>
        ${isMe ? '<span>✓✓</span>' : ''}
      </div>
    </div>
  `;

  messagesList.appendChild(row);
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function handleSendMessage(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  messageInput.value = '';
  stopTyping();

  const payload = {
    message: text,
    roomId: currentTarget.type === 'room' ? currentTarget.id : null,
    receiverId: currentTarget.type === 'direct' ? currentTarget.id : null,
  };

  try {
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const msg = await res.json();
    if (!res.ok) throw new Error(msg.error || 'Failed to send message');
  } catch (err) {
    alert(err.message);
  }
}

function handleTyping() {
  if (!socket) return;

  socket.emit('typing', {
    user: currentUser,
    roomId: currentTarget.type === 'room' ? currentTarget.id : null,
    receiverId: currentTarget.type === 'direct' ? currentTarget.id : null,
  });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 2000);
}

function stopTyping() {
  if (!socket) return;
  socket.emit('stopTyping', {
    user: currentUser,
    roomId: currentTarget.type === 'room' ? currentTarget.id : null,
    receiverId: currentTarget.type === 'direct' ? currentTarget.id : null,
  });
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
