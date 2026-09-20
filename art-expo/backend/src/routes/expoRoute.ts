import { Router } from 'express';
import { getExpo } from '../controllers/expoController.js';

const router = Router();
router.get('/expo', getExpo);
export default router;
