import express from 'express';
import {
    getConversations,
    getMessages,
    sendMessage,
    findOrCreateConversation
} from '../controllers/messageController.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All messaging routes are protected and require a logged-in user
router.use(checkJwtMiddleware);

router.route('/conversations').get(getConversations);
router.route('/find-or-create').post(findOrCreateConversation);
router.route('/:conversationId').get(getMessages).post(sendMessage);

export default router;
