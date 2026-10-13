import bcrypt from 'bcryptjs';
import { inMemoryStore } from '../store/inMemoryStore.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

export const signup = async (req, res) => {
  try {
    const { username, fullName, password, avatar, bio } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const cleanUsername = username.toLowerCase().trim();

    let existing = null;
    if (mongoose.connection.readyState === 1) {
      try {
        existing = await User.findOne({ username: cleanUsername });
      } catch (e) {}
    }
    if (!existing) {
      existing = await inMemoryStore.findUserByUsername(cleanUsername);
    }

    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      username: cleanUsername,
      fullName: fullName?.trim() || cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
      password: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || cleanUsername)}`,
      bio: bio?.trim() || 'Team Member',
    };

    let newUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        newUser = await User.create(userData);
      } catch (e) {
        newUser = await inMemoryStore.createUser(userData);
      }
    } else {
      newUser = await inMemoryStore.createUser(userData);
    }

    const token = generateToken(newUser._id, res);

    res.status(201).json({
      success: true,
      user: {
        _id: String(newUser._id),
        username: newUser.username,
        fullName: newUser.fullName,
        avatar: newUser.avatar,
        bio: newUser.bio,
      },
      token,
    });
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.toLowerCase().trim();

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ username: cleanUsername });
      } catch (e) {}
    }
    if (!user) {
      user = await inMemoryStore.findUserByUsername(cleanUsername);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Verify password with bcrypt (or match fallback string if demo account)
    let isPasswordCorrect = false;
    if (user.password.startsWith('$2')) {
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    } else {
      isPasswordCorrect = user.password === password;
    }

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      success: true,
      user: {
        _id: String(user._id),
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
      },
      token,
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.status(200).json({
      _id: String(user._id),
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
