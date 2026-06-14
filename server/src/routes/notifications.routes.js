import { Router } from 'express';
import {
  getNotifications,
  getUnreadCountHandler,
  markRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notifications.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { querySchema, markAllReadSchema } from '../validators/notification.validator.js';

const router = Router();

router.get('/', verifyToken, validate({ query: querySchema }), getNotifications);

router.get('/unread-count', verifyToken, getUnreadCountHandler);

router.patch('/read-all', verifyToken, validate({ body: markAllReadSchema }), markAllRead);

router.delete('/clear-read', verifyToken, clearAllNotifications);
router.patch('/:id/read', verifyToken, markRead);
router.delete('/:id', verifyToken, deleteNotification);

export default router;
