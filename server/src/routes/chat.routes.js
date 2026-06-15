import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  getChannels,
  createChannel,
  archiveChannel,
  getMessages,
  sendMessage,
  deleteMessage,
  pinMessage,
  getChannelMembers,
} from '../controllers/chat.controller.js';
import {
  sendMessageSchema,
  channelIdParamSchema,
  messageIdParamSchema,
  createChannelSchema,
} from '../validators/chat.validator.js';

const router = Router();

// Channels
router.get('/channels', verifyToken, getChannels);
router.post('/channels', verifyToken, validate({ body: createChannelSchema }), createChannel);
router.patch('/channels/:channelId/archive', verifyToken, validate({ params: channelIdParamSchema }), archiveChannel);

// Channel members
router.get('/channels/:channelId/members', verifyToken, validate({ params: channelIdParamSchema }), getChannelMembers);

// Messages
router.get('/messages/:channelId', verifyToken, validate({ params: channelIdParamSchema }), getMessages);
router.post('/messages', verifyToken, validate({ body: sendMessageSchema }), sendMessage);
router.delete('/messages/:messageId', verifyToken, validate({ params: messageIdParamSchema }), deleteMessage);
router.patch('/messages/:messageId/pin', verifyToken, validate({ params: messageIdParamSchema }), pinMessage);

export default router;
