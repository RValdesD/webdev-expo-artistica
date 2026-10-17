import { Router } from 'express';
import { signup, login, me, logout } from '../controllers/authController.js';
import { optionalClient } from '../auth/sessions.js';
import { trustedWrite, authRateLimit } from '../auth/guards.js';

const router = Router();
router.use('/auth', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.post('/auth/signup', trustedWrite, authRateLimit, signup);
router.post('/auth/login', trustedWrite, authRateLimit, login);
router.get('/auth/me', optionalClient, me);
router.post('/auth/logout', trustedWrite, logout);
export default router;
