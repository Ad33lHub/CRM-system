import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { getMeetings, getMeetingById, createMeeting } from '../controllers/meetings.controller.js';
import { createMeetingSchema, meetingQuerySchema } from '../validators/meeting.validator.js';

const router = Router();

router.get('/', verifyToken, validate({ query: meetingQuerySchema }), getMeetings);
router.get('/:id', verifyToken, getMeetingById);
router.post('/', verifyToken, aiLimiter, validate(createMeetingSchema), createMeeting);

export default router;
