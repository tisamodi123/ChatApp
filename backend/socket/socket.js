import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Map of userId -> Set of socket IDs (for multi-tab / multi-device support)
const userSocketsMap = new Map();

export const isUserOnline = (userId) => {
  return userSocketsMap.has(String(userId)) && userSocketsMap.get(String(userId)).size > 0;
};

export const getOnlineUserIds = () => {
  return Array.from(userSocketsMap.keys());
};

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  const username = socket.handshake.query.username || 'User';

  if (userId && userId !== 'undefined' && userId !== 'null') {
    const stringUserId = String(userId);
    socket.join(`user:${stringUserId}`);

    if (!userSocketsMap.has(stringUserId)) {
      userSocketsMap.set(stringUserId, new Set());
    }
    userSocketsMap.get(stringUserId).add(socket.id);

    console.log(`⚡ [Socket Connect] "${username}" (${stringUserId}) connected [Socket: ${socket.id}]`);
  }

  // Broadcast updated list of online user IDs
  io.emit('getOnlineUsers', getOnlineUserIds());

  // Join a chat room / channel
  socket.on('joinRoom', (roomId) => {
    if (!roomId) return;
    const roomChannel = `room:${roomId}`;
    socket.join(roomChannel);
    console.log(`🚪 [Room Join] Socket ${socket.id} joined ${roomChannel}`);
  });

  // Leave a chat room / channel
  socket.on('leaveRoom', (roomId) => {
    if (!roomId) return;
    const roomChannel = `room:${roomId}`;
    socket.leave(roomChannel);
    console.log(`👋 [Room Leave] Socket ${socket.id} left ${roomChannel}`);
  });

  // Real-time typing indicators
  socket.on('typing', ({ roomId, receiverId, user }) => {
    if (receiverId) {
      io.to(`user:${receiverId}`).emit('userTyping', { user, receiverId });
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit('userTyping', { user, roomId });
    }
  });

  socket.on('stopTyping', ({ roomId, receiverId, user }) => {
    if (receiverId) {
      io.to(`user:${receiverId}`).emit('userStoppedTyping', { user, receiverId });
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit('userStoppedTyping', { user, roomId });
    }
  });

  // WebRTC Audio/Video signaling
  socket.on('callUser', ({ userToCall, signalData, from, fromName }) => {
    if (userToCall) {
      io.to(`user:${userToCall}`).emit('incomingCall', {
        signal: signalData,
        from,
        fromName,
      });
    }
  });

  socket.on('answerCall', ({ to, signal }) => {
    if (to) {
      io.to(`user:${to}`).emit('callAccepted', signal);
    }
  });

  socket.on('endCall', ({ to }) => {
    if (to) {
      io.to(`user:${to}`).emit('callEnded');
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    if (userId && userId !== 'undefined') {
      const stringUserId = String(userId);
      if (userSocketsMap.has(stringUserId)) {
        const sockets = userSocketsMap.get(stringUserId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketsMap.delete(stringUserId);
        }
      }
    }
    console.log(`❌ [Socket Disconnect] Socket closed: ${socket.id}`);
    io.emit('getOnlineUsers', getOnlineUserIds());
  });
});

export { app, io, server };
