import { Router } from 'express';
import { getArtists, getArtist } from '../controllers/artistsController.js';

const router = Router();
router.get('/artists', getArtists);
router.get('/artists/:id', getArtist);

export default router;
