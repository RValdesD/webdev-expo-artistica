import { Router } from 'express';
import { getArtworks } from '../controllers/artworksController.js';

const router = Router();
router.get('/artworks', getArtworks);

export default router;
