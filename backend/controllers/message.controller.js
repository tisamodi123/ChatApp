import { inMemoryStore } from '../store/inMemoryStore.js';
import { Message } from '../models/Message.js';
import mongoose from 'mongoose';
import { io } from '../socket/socket.js';

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    let messages = await inMemoryStore.getMessagesByRoom(roomId);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbMessages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100);
        if (dbMessages && dbMessages.length > 0) {
          messages = dbMessages;
        }
      } catch (dbErr) {
        console.warn('DB getRoomMessages error:', dbErr.message);
      }
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getRoomMessages:', error.message);
    res.status(200).json([]);
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const { userToChatId } = req.params;
    const senderId = req.user?._id;

    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let messages = await inMemoryStore.getDirectMessages(senderId, userToChatId);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbMessages = await Message.find({
          $or: [
            { senderId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: senderId },
          ],
        }).sort({ createdAt: 1 });
        if (dbMessages && dbMessages.length > 0) {
          messages = dbMessages;
        }
      } catch (dbErr) {
        console.warn('DB getDirectMessages error:', dbErr.message);
      }
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getDirectMessages:', error.message);
    res.status(200).json([]);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message, roomId, receiverId, attachment } = req.body;
    const sender = req.user;

    if (!sender) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const messageData = {
      senderId: String(sender._id),
      senderName: sender.fullName || sender.username,
      senderAvatar: sender.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sender.fullName || sender.username)}`,
      receiverId: receiverId ? String(receiverId) : null,
      roomId: !receiverId ? (roomId || 'general') : null,
      message: message.trim(),
      attachment: attachment || null,
    };

    let newMessage = null;

    // Persist to MongoDB if available, otherwise inMemoryStore
    if (mongoose.connection.readyState === 1) {
      try {
        const created = await Message.create(messageData);
        newMessage = created.toObject();
        newMessage._id = String(newMessage._id);
      } catch (dbErr) {
        newMessage = await inMemoryStore.addMessage(messageData);
      }
    } else {
      newMessage = await inMemoryStore.addMessage(messageData);
    }

    // Real-Time Socket.io event broadcast
    try {
      if (newMessage.receiverId) {
        // Direct message: emit to receiver and back to sender's sockets
        io.to(`user:${newMessage.receiverId}`).emit('newMessage', newMessage);
        io.to(`user:${newMessage.senderId}`).emit('newMessage', newMessage);
      } else if (newMessage.roomId) {
        // Channel / room message: broadcast to the specific room
        io.to(`room:${newMessage.roomId}`).emit('newMessage', newMessage);
      }
    } catch (socketErr) {
      console.warn('Socket emission warning:', socketErr.message);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
