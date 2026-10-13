import { inMemoryStore } from '../store/inMemoryStore.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = String(req.user?._id || '');
    let filteredUsers = [];

    const all = await inMemoryStore.getAllUsers();
    filteredUsers = all.filter((u) => String(u._id) !== loggedInUserId);

    // If MongoDB has more users, merge safely
    if (mongoose.connection.readyState === 1) {
      try {
        const dbUsers = await User.find().select('-password');
        const dbFiltered = dbUsers
          .filter((u) => String(u._id) !== loggedInUserId)
          .map((u) => ({
            _id: String(u._id),
            username: u.username,
            fullName: u.fullName,
            avatar: u.avatar,
            bio: u.bio,
          }));

        const seen = new Set(filteredUsers.map((u) => u.username));
        for (const u of dbFiltered) {
          if (!seen.has(u.username)) {
            filteredUsers.push(u);
            seen.add(u.username);
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB users merge error:', dbErr.message);
      }
    }

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error in getUsersForSidebar:', error.message);
    res.status(500).json([]);
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await inMemoryStore.getRooms();
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error in getRooms:', error.message);
    res.status(500).json([]);
  }
};
