import { Router } from 'express';
import { Workshop, type WorkshopData } from '../models/Workshop.js';
import { Artist } from '../models/Artist.js';
import { User } from '../models/User.js';
import { optionalUser, withUser } from '../utils/middleware.js';

const workshopsRouter = Router();
const allowed = ['id', 'title', 'description', 'artistId', 'date', 'durationMinutes', 'location', 'capacity'] as const;

function workshopBody(body: unknown): Record<string, unknown> {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return Object.fromEntries(allowed.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}

function publicWorkshop(workshop: WorkshopData, artistName: string | undefined, userId?: string) {
  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    artistId: workshop.artistId,
    artist: artistName === undefined ? null : { id: workshop.artistId, name: artistName },
    date: workshop.date.toISOString(),
    durationMinutes: workshop.durationMinutes,
    location: workshop.location,
    capacity: workshop.capacity,
    availablePlaces: Math.max(0, workshop.capacity - workshop.registrations.length),
    isSample: workshop.isSample,
    isRegistered: Boolean(userId && workshop.registrations.some(item => item.userId === userId)),
  };
}

workshopsRouter.get('/', optionalUser, async (req, res, next) => {
  try {
    const workshops = await Workshop.find().select('+registrations').sort({ date: 1 }).lean();
    const artists = await Artist.find({ id: { $in: workshops.map(workshop => workshop.artistId) } }).lean();
    const names = new Map(artists.map(artist => [artist.id, artist.name]));
    res.json(workshops.map(workshop => publicWorkshop(workshop, names.get(workshop.artistId), req.userId)));
  } catch (error: unknown) {
    next(error);
  }
});

workshopsRouter.get('/:id', optionalUser, async (req, res, next) => {
  try {
    const workshop = await Workshop.findOne({ id: req.params.id }).select('+registrations').lean();
    if (!workshop) { res.status(404).json({ error: 'Taller no encontrado.' }); return; }
    const artist = await Artist.findOne({ id: workshop.artistId }).lean();
    res.json(publicWorkshop(workshop, artist?.name, req.userId));
  } catch (error: unknown) { next(error); }
});

workshopsRouter.post('/', withUser, async (req, res, next) => {
  try {
    const input = workshopBody(req.body);
    if (typeof input.artistId !== 'string' || !await Artist.exists({ id: input.artistId })) {
      res.status(400).json({ error: 'El artista indicado no existe.' }); return;
    }
    res.status(201).json(await Workshop.create(input));
  } catch (error: unknown) { next(error); }
});

workshopsRouter.put('/:id', withUser, async (req, res, next) => {
  try {
    const input = workshopBody(req.body);
    delete input.id;
    if (input.artistId !== undefined && (typeof input.artistId !== 'string' || !await Artist.exists({ id: input.artistId }))) {
      res.status(400).json({ error: 'El artista indicado no existe.' }); return;
    }
    const current = await Workshop.findOne({ id: req.params.id }).select('+registrations').lean();
    if (!current) { res.status(404).json({ error: 'Taller no encontrado.' }); return; }
    if (typeof input.capacity === 'number' && input.capacity < current.registrations.length) {
      res.status(409).json({ error: 'La capacidad no puede ser menor que las inscripciones existentes.' }); return;
    }
    const workshop = await Workshop.findOneAndUpdate({ id: req.params.id }, input, { new: true, runValidators: true });
    res.json(workshop);
  } catch (error: unknown) { next(error); }
});

workshopsRouter.delete('/:id', withUser, async (req, res, next) => {
  try {
    if (!await Workshop.findOneAndDelete({ id: req.params.id })) { res.status(404).json({ error: 'Taller no encontrado.' }); return; }
    res.status(204).end();
  } catch (error: unknown) { next(error); }
});

workshopsRouter.post('/:id/registrations', withUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) { res.status(401).json({ error: 'La sesión ya no es válida.' }); return; }
    const workshop = await Workshop.findOneAndUpdate(
      {
        id: req.params.id,
        date: { $gt: new Date() },
        'registrations.userId': { $ne: user.id },
        $expr: { $lt: [{ $size: '$registrations' }, '$capacity'] },
      },
      { $push: { registrations: { userId: user.id, name: user.name, username: user.username } } },
      { new: true, runValidators: true },
    ).select('+registrations').lean();

    if (!workshop) {
      const exists = await Workshop.exists({ id: req.params.id });
      res.status(exists ? 409 : 404).json({
        error: exists
          ? 'No se pudo inscribir: el taller comenzó, no quedan cupos o ya existe una inscripción para esta cuenta.'
          : 'Taller no encontrado.',
      });
      return;
    }

    const artist = await Artist.findOne({ id: workshop.artistId }).lean();
    res.status(201).json({ workshop: publicWorkshop(workshop, artist?.name, user.id) });
  } catch (error: unknown) {
    next(error);
  }
});

workshopsRouter.delete('/:id/registrations', withUser, async (req, res, next) => {
  try {
    const workshop = await Workshop.findOneAndUpdate(
      { id: req.params.id, 'registrations.userId': req.userId },
      { $pull: { registrations: { userId: req.userId } } },
      { new: true, runValidators: true },
    );
    if (!workshop) {
      const exists = await Workshop.exists({ id: req.params.id });
      res.status(404).json({ error: exists ? 'No estás inscrito en este taller.' : 'Taller no encontrado.' });
      return;
    }
    res.status(204).end();
  } catch (error: unknown) { next(error); }
});

export default workshopsRouter;
