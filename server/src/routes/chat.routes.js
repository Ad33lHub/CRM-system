import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { getChannels, getMessages, sendMessage } from '../controllers/chat.controller.js';
import { sendMessageSchema, channelIdParamSchema } from '../validators/chat.validator.js';

const router = Router();

router.get('/channels', verifyToken, getChannels);
router.get(
  '/messages/:channelId',
  verifyToken,
  validate({ params: channelIdParamSchema }),
  getMessages
);
router.post('/messages', verifyToken, validate(sendMessageSchema), sendMessage);

export default router;
