import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection unavailable (${error.message}).`);
    console.log(`⚡ Running with High-Performance In-Memory Data Store fallback!`);
    return false;
  }
};
