import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { Exhibition } from '../models/Exhibition.js';
import { withUser, requireOrganizer } from '../utils/middleware.js';

const router = Router();
const fields = ['title', 'heading', 'description', 'theme', 'imageUrl', 'imageAlt', 'caption', 'order'] as const;
function input(body: unknown) {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return Object.fromEntries(fields.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}
router.get('/', async (_req, res, next) => {
  try { res.json(await Exhibition.find().sort({ order: 1, createdAt: 1, id: 1 }).select('-_id -__v').lean()); }
  catch (error) { next(error); }
});
router.post('/', withUser, requireOrganizer, async (req, res, next) => {
  try { res.status(201).json(await Exhibition.create({ ...input(req.body), id: randomUUID() })); }
  catch (error) { next(error); }
});
router.put('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const item = await Exhibition.findOneAndUpdate({ id: req.params.id }, { $set: input(req.body) }, { new: true, runValidators: true });
    if (!item) { res.status(404).json({ error: 'Exposición no encontrada.' }); return; }
    res.json(item);
  } catch (error) { next(error); }
});
router.delete('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    if (!await Exhibition.findOneAndDelete({ id: req.params.id })) { res.status(404).json({ error: 'Exposición no encontrada.' }); return; }
    res.status(204).end();
  } catch (error) { next(error); }
});
export default router;
