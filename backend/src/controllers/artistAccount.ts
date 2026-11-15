import express, { Router } from 'express';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { User } from '../models/User.js';
import { Artist } from '../models/Artist.js';
import { ensureArtistSlug } from '../utils/artistSlug.js';
import { Submission } from '../models/Submission.js';
import { withUser } from '../utils/middleware.js';
import { ownsImage, saveImage, uploadDirectory } from '../utils/uploads.js';
const router = Router();
router.use(withUser);
router.use(async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'artista') { res.status(403).json({ error: 'Esta sección es exclusiva para artistas.' }); return; }
    next();
  } catch (error) { next(error); }
});
router.post('/images', express.raw({ type: 'application/octet-stream', limit: '5mb' }), async (req, res, next) => {
  if (!Buffer.isBuffer(req.body)) { res.status(400).json({ error: 'Selecciona un archivo de imagen.' }); return; }
  try { res.status(201).json({ url: await saveImage(req.body, req.userId!) }); }
  catch (error) {
    if (error instanceof Error && !('code' in error)) { res.status(400).json({ error: 'Imagen inválida. Usa JPG, PNG o WebP estático, de 100 × 100 píxeles como mínimo y hasta 5 MB.' }); return; }
    next(error);
  }
});
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const profile = await Artist.findOne({ id: `artist-${req.userId}` });
    if (profile) profile.slug = await ensureArtistSlug(profile.id, profile.name);
    res.json(profile ?? { name: user?.name, bio: '', discipline: '', imageUrl: '' });
  } catch (error) { next(error); }
});
router.put('/profile', async (req, res, next) => {
  try {
    const { name, bio, discipline, imageUrl } = req.body ?? {};
    if (![name, bio, discipline].every(value => typeof value === 'string' && value.trim())) {
      res.status(400).json({ error: 'Completa nombre, disciplina y descripción.' }); return;
    }
    if (imageUrl && (!ownsImage(imageUrl, req.userId!) || !existsSync(join(uploadDirectory, basename(imageUrl))))) {
      res.status(400).json({ error: 'Sube tu propia imagen desde este formulario.' }); return;
    }
    const profile = await Artist.findOneAndUpdate({ id: `artist-${req.userId}` },
      { $set: { name, bio, discipline, imageUrl: imageUrl || '' } }, { upsert: true, new: true, runValidators: true });
    profile.slug = await ensureArtistSlug(profile.id, profile.name);
    await User.findByIdAndUpdate(req.userId, { avatarUrl: profile.imageUrl }, { runValidators: true });
    res.json(profile);
  } catch (error) { next(error); }
});
router.get('/submissions', async (req, res, next) => {
  try { res.json(await Submission.find({ userId: req.userId }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
router.post('/submissions', async (req, res, next) => {
  try {
    const artistId = `artist-${req.userId}`;
    if (!await Artist.exists({ id: artistId })) { res.status(400).json({ error: 'Guarda primero tu perfil de artista.' }); return; }
    const { title, medium, year, description, imageUrl } = req.body ?? {};
    if (!ownsImage(imageUrl, req.userId!) || !existsSync(join(uploadDirectory, basename(imageUrl)))) { res.status(400).json({ error: 'Sube una imagen propia para esta obra.' }); return; }
    res.status(201).json(await Submission.create({ userId: req.userId, artistId, title, medium, year, description, imageUrl, status: 'pending' }));
  } catch (error) { next(error); }
});
export default router;
