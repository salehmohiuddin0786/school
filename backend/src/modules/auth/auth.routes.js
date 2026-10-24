import { Router } from 'express';
import { login, refresh, logout, getMe, changePassword } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Public auth routes
router.post('/login', authRateLimiter, login);
router.post('/refresh', refresh);

// Protected auth routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;
