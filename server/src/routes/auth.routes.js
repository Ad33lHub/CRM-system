import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
  sendOTP,
  verifyOTP,
} from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOTPSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Auth routes
router.post('/register', authLimiter, validate({ body: registerSchema }), register);

router.post('/login', authLimiter, validate({ body: loginSchema }), login);

router.post('/refresh', refreshToken);

router.post('/logout', logout);

router.post('/logout-all', verifyToken, logoutAll);

// Forgot & Reset Password
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);

router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), resetPassword);

// Get profile details for hydration
router.get('/me', verifyToken, getMe);

// Update own profile + change own password
router.patch('/me', verifyToken, validate({ body: updateProfileSchema }), updateMe);
router.post(
  '/change-password',
  verifyToken,
  authLimiter,
  validate({ body: changePasswordSchema }),
  changePassword
);

// OTP Verification routes
router.post('/send-otp', verifyToken, authLimiter, sendOTP);
router.post(
  '/verify-otp',
  verifyToken,
  authLimiter,
  validate({ body: verifyOTPSchema }),
  verifyOTP
);

export default router;
