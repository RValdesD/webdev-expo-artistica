import { Router } from 'express';
import { getWorkshops, registerForWorkshop } from '../controllers/workshopsController.js';

const router = Router();
router.get('/workshops', getWorkshops);
router.post('/workshops/:id/registrations', registerForWorkshop);
export default router;
