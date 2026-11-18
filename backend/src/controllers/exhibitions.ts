import { randomUUID } from 'node:crypto';
import { Router, type Response } from 'express';
import { Exhibition } from '../models/Exhibition.js';
import { GuidedTour } from '../models/GuidedTour.js';
import { withUser, requireOrganizer } from '../utils/middleware.js';
import { isCoverImage, listCoverImages } from '../utils/coverImages.js';

const router = Router();
const fields = ['title', 'heading', 'description', 'theme', 'imageUrl', 'imageAlt', 'caption', 'order', 'featured', 'discipline', 'room', 'artistId', 'startDate', 'endDate', 'visitHours', 'visitNotes'] as const;
function input(body: unknown) {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return Object.fromEntries(fields.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}
// La portada debe ser un archivo que exista en frontend/public/images/.
async function rejectMissingCover(data: Record<string, unknown>, res: Response): Promise<boolean> {
  const url = data.imageUrl;
  if (url === undefined || url === '' || (typeof url === 'string' && await isCoverImage(url))) return false;
  const message = 'Elige una portada de la carpeta public/images.';
  res.status(400).json({ error: message, fields: { imageUrl: message } });
  return true;
}
router.get('/', async (_req, res, next) => {
  try { res.json(await Exhibition.find().sort({ order: 1, createdAt: 1, id: 1 }).select('-_id -__v').lean()); }
  catch (error) { next(error); }
});
// Imágenes disponibles para la portada; va antes de /:id para que no se lea como un id.
router.get('/cover-images', withUser, requireOrganizer, async (_req, res, next) => {
  try { res.json(await listCoverImages()); } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Exhibition.findOne({ id: req.params.id }).select('-_id -__v').lean();
    if (!item) { res.status(404).json({ error: 'Exposición no encontrada.' }); return; }
    res.json(item);
  } catch (error) { next(error); }
});
router.post('/', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const data = input(req.body);
    if (await rejectMissingCover(data, res)) return;
    res.status(201).json(await Exhibition.create({ ...data, id: randomUUID() }));
  } catch (error) { next(error); }
});
router.put('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const data = input(req.body);
    if (await rejectMissingCover(data, res)) return;
    const item = await Exhibition.findOneAndUpdate({ id: req.params.id }, { $set: data }, { new: true, runValidators: true });
    if (!item) { res.status(404).json({ error: 'Exposición no encontrada.' }); return; }
    res.json(item);
  } catch (error) { next(error); }
});
router.delete('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    // Borrarla dejaría reservas de visitas guiadas sin exposición.
    if (await GuidedTour.exists({ exhibitionId: req.params.id })) {
      res.status(409).json({ error: 'Esta exposición tiene visitas guiadas. Elimínalas primero en Gestión → Visitas guiadas.' }); return;
    }
    if (!await Exhibition.findOneAndDelete({ id: req.params.id })) { res.status(404).json({ error: 'Exposición no encontrada.' }); return; }
    res.status(204).end();
  } catch (error) { next(error); }
});
export default router;
