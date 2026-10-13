import jwt from 'jsonwebtoken';
import { inMemoryStore } from '../store/inMemoryStore.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'realtime-chat-secret-key-super-secure';

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d',
  });

  if (res && res.cookie) {
    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return token;
};

export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
    }

    if (!decoded?.userId) {
      return res.status(401).json({ error: 'Unauthorized - Token payload invalid' });
    }

    let user = null;

    // Check MongoDB first if connected
    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
          user = await User.findById(decoded.userId).select('-password');
        } else {
          user = await User.findOne({ username: decoded.userId }).select('-password');
        }
      } catch (dbErr) {
        // Fall back to inMemoryStore
      }
    }

    // Check inMemoryStore
    if (!user) {
      user = await inMemoryStore.findUserById(decoded.userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

