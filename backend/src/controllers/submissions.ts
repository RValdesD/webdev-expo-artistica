import { Router } from 'express';
import mongoose from 'mongoose';
import { Submission } from '../models/Submission.js';
import { Artwork } from '../models/Artwork.js';
import { Artist } from '../models/Artist.js';
import { withUser, requireOrganizer } from '../utils/middleware.js';
const router = Router();
router.use(withUser, requireOrganizer);
router.get('/', async (_req, res, next) => {
  try { res.json(await Submission.find().sort({ createdAt: -1 })); } catch (error) { next(error); }
});
router.post('/:id/review', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ error: 'Envío no encontrado.' }); return; }
    const { decision, reviewNote = '' } = req.body ?? {};
    if (!['approved', 'rejected'].includes(decision) || typeof reviewNote !== 'string' || reviewNote.length > 1000) { res.status(400).json({ error: 'Decisión o comentario inválido.' }); return; }
    if (decision === 'rejected') {
      const rejected = await Submission.findOneAndUpdate({ _id: req.params.id, status: 'pending' },
        { $set: { status: 'rejected', reviewNote } }, { new: true, runValidators: true });
      if (!rejected) { res.status(409).json({ error: 'Este envío ya fue revisado o está publicándose.' }); return; }
      res.json(rejected); return;
    }
    // Claim publication atomically; rejection cannot race with an approval.
    // A failed publication may be retried using the same deterministic artwork ID.
    const submission = await Submission.findOneAndUpdate({ _id: req.params.id, status: { $in: ['pending', 'publishing'] } },
      { $set: { status: 'publishing', reviewNote } }, { new: true, runValidators: true });
    if (!submission) { res.status(409).json({ error: 'Este envío ya fue revisado.' }); return; }
    if (!await Artist.exists({ id: submission.artistId })) {
      await Submission.updateOne({ _id: submission.id, status: 'publishing' }, { $set: { status: 'pending' } });
      res.status(409).json({ error: 'El perfil del artista ya no existe.' }); return;
    }
    await Artwork.updateOne({ id: `submission-${submission.id}` }, { $setOnInsert: {
      title: submission.title, artistId: submission.artistId, medium: submission.medium,
      year: submission.year, description: submission.description, imageUrl: submission.imageUrl,
      previewImageUrl: submission.imageUrl, images: submission.images ?? [], inSlideshow: false,
    } }, { upsert: true, runValidators: true });
    const approved = await Submission.findByIdAndUpdate(submission.id, { $set: { status: 'approved' } }, { new: true });
    res.json(approved);
  } catch (error) { next(error); }
});
export default router;
