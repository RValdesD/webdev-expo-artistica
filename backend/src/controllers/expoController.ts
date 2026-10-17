import { Router } from 'express';
import { Expo } from '../models/Expo.js';
import { withUser } from '../utils/middleware.js';

const expoRouter = Router();
const allowed = ['name', 'edition', 'introduction', 'dateLabel', 'hours', 'venue', 'address', 'admission', 'transport', 'accessibility', 'faqs'] as const;

expoRouter.get('/', async (_req, res, next) => {
  try {
    const expo = await Expo.findOne({ slug: 'main' }).select('-_id -__v -createdAt -updatedAt').lean();
    if (!expo) { res.status(404).json({ error: 'Información aún no publicada.' }); return; }
    res.json(expo);
  } catch (error: unknown) { next(error); }
});

expoRouter.put('/', withUser, async (req, res, next) => {
  try {
    const source = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
    const changes = Object.fromEntries(allowed.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
    const expo = await Expo.findOneAndUpdate({ slug: 'main' }, changes, { new: true, runValidators: true });
    if (!expo) { res.status(404).json({ error: 'Información aún no publicada.' }); return; }
    res.json(expo);
  } catch (error: unknown) { next(error); }
});

export default expoRouter;
