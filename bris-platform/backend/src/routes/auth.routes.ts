import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getProfile);

export default router;
