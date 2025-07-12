import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * @desc    Find an existing conversation between two users, or create a new one.
 * @route   POST /api/messages/find-or-create
 * @access  Private
 */
export const findOrCreateConversation = asyncHandler(async (req, res) => {
    const { recipientId } = req.body;
    const senderId = req.user.user_id;

    if (senderId === recipientId) {
        res.status(400);
        throw new Error("You cannot create a conversation with yourself.");
    }

    // Find if a conversation already exists between these two users
    let conversation = await db.oneOrNone(`
        SELECT cp1.conversation_id FROM conversation_participants AS cp1
        JOIN conversation_participants AS cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = $1 AND cp2.user_id = $2
    `, [senderId, recipientId]);

    // If no conversation exists, create a new one in a transaction
    if (!conversation) {
        conversation = await db.tx(async t => {
            const newConversation = await t.one('INSERT INTO conversations DEFAULT VALUES RETURNING conversation_id');
            await t.none('INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)', [newConversation.conversation_id, senderId, recipientId]);
            return newConversation;
        });
    }

    res.status(200).json({ conversation_id: conversation.conversation_id });
});


/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const query = `
        SELECT 
            c.conversation_id, c.last_message_at,
            (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY sent_at DESC LIMIT 1) as last_message_content,
            json_build_object(
                'user_id', u.user_id,
                'username', u.username,
                'profile_picture_url', u.profile_picture_url
            ) as other_participant
        FROM conversations c
        JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
        JOIN user_profiles u ON cp.user_id = u.user_id
        WHERE c.conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1) AND cp.user_id != $1
        ORDER BY c.last_message_at DESC NULLS LAST;
    `;
    const conversations = await db.any(query, [userId]);
    res.json(conversations);
});

/**
 * @desc    Get all messages for a specific conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.user_id;

    const participantCheck = await db.oneOrNone('SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [conversationId, userId]);
    if (!participantCheck) {
        res.status(403); throw new Error('Forbidden: You are not in this conversation.');
    }

    const messages = await db.any(`SELECT * FROM messages WHERE conversation_id = $1 ORDER BY sent_at ASC`, [conversationId]);
    res.json(messages);
});

/**
 * @desc    Send a new message to a conversation
 * @route   POST /api/messages/:conversationId
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.user_id;

    if (!content) { res.status(400); throw new Error('Message content is required.'); }

    const message = await db.tx(async t => {
        const newMessage = await t.one(
            'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
            [conversationId, senderId, content]
        );
        await t.none('UPDATE conversations SET last_message_at = $1 WHERE conversation_id = $2', [newMessage.sent_at, conversationId]);
        return newMessage;
    });

    res.status(201).json(message);
});
