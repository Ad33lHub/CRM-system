import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { getAttendanceLogs, checkIn, checkOut } from '../controllers/attendance.controller.js';
import {
  clockInSchema,
  clockOutSchema,
  attendanceQuerySchema,
} from '../validators/attendance.validator.js';

const router = Router();

router.get('/', verifyToken, validate({ query: attendanceQuerySchema }), getAttendanceLogs);
router.post('/check-in', verifyToken, validate(clockInSchema), checkIn);
router.post('/check-out', verifyToken, validate(clockOutSchema), checkOut);

export default router;
