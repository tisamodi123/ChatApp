import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      default: 'General Discussion',
    },
    icon: {
      type: String,
      default: '💬',
    },
  },
  { timestamps: true }
);

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
