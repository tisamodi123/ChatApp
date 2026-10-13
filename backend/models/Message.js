import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: '',
    },
    receiverId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    roomId: {
      type: String,
      default: 'general',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachment: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
