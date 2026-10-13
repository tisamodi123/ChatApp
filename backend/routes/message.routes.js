import express from 'express';
import { getRoomMessages, getDirectMessages, sendMessage } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/room/:roomId', getRoomMessages); // Public channels history
router.get('/direct/:userToChatId', protectRoute, getDirectMessages);
router.post('/send', protectRoute, sendMessage);

export default router;
