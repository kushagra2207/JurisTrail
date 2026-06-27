import { Router } from 'express';
import { signup, login, getMe, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;

