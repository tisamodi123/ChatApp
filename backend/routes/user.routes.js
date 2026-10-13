import express from 'express';
import { getUsersForSidebar, getRooms } from '../controllers/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/rooms', getRooms); // Public channel list
router.get('/sidebar', protectRoute, getUsersForSidebar);

export default router;
