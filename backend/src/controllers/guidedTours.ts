import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { GuidedTour, MAX_TOUR_CAPACITY, type GuidedTourData } from '../models/GuidedTour.js';
import { Exhibition } from '../models/Exhibition.js';
import { User } from '../models/User.js';
import { optionalUser, withUser, requireOrganizer } from '../utils/middleware.js';

const router = Router();
const allowed = ['exhibitionId', 'date', 'durationMinutes', 'capacity', 'guide', 'language', 'meetingPoint'] as const;

function tourBody(body: unknown): Record<string, unknown> {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return Object.fromEntries(allowed.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}

type Titles = Map<string, string>;
async function exhibitionTitles(tours: GuidedTourData[]): Promise<Titles> {
  const exhibitions = await Exhibition.find({ id: { $in: [...new Set(tours.map(tour => tour.exhibitionId))] } }).select('id title -_id').lean();
  return new Map(exhibitions.map(item => [item.id, item.title]));
}

function publicTour(tour: GuidedTourData, titles: Titles, userId?: string) {
  const title = titles.get(tour.exhibitionId);
  return {
    id: tour.id,
    exhibitionId: tour.exhibitionId,
    exhibition: title === undefined ? null : { id: tour.exhibitionId, title },
    date: tour.date.toISOString(),
    durationMinutes: tour.durationMinutes,
    capacity: tour.capacity,
    availablePlaces: Math.max(0, tour.capacity - tour.bookings.length),
    guide: tour.guide,
    language: tour.language,
    meetingPoint: tour.meetingPoint,
    isSample: tour.isSample,
    isBooked: Boolean(userId && tour.bookings.some(booking => booking.userId === userId)),
  };
}

const exhibitionError = 'Elige una exposición existente.';
const capacityError = `Los cupos deben ser un número entero entre 1 y ${MAX_TOUR_CAPACITY}.`;
const validCapacity = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_TOUR_CAPACITY;

// GET /api/guided-tours?exhibitionId=... (opcional): visitas guiadas ordenadas por fecha.
router.get('/', optionalUser, async (req, res, next) => {
  try {
    const { exhibitionId } = req.query;
    const filter = typeof exhibitionId === 'string' ? { exhibitionId } : {};
    const tours = await GuidedTour.find(filter).select('+bookings').sort({ date: 1 }).lean();
    const titles = await exhibitionTitles(tours);
    res.json(tours.map(tour => publicTour(tour, titles, req.userId)));
  } catch (error) { next(error); }
});

// GET /api/guided-tours/mine: las visitas guiadas que reservó la persona conectada.
router.get('/mine', withUser, async (req, res, next) => {
  try {
    const tours = await GuidedTour.find({ 'bookings.userId': req.userId }).select('+bookings').sort({ date: 1 }).lean();
    const titles = await exhibitionTitles(tours);
    res.json(tours.map(tour => publicTour(tour, titles, req.userId)));
  } catch (error) { next(error); }
});

router.post('/', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const input = tourBody(req.body);
    if (typeof input.exhibitionId !== 'string' || !await Exhibition.exists({ id: input.exhibitionId })) {
      res.status(400).json({ error: exhibitionError, fields: { exhibitionId: exhibitionError } }); return;
    }
    const tour = await GuidedTour.create({ ...input, id: randomUUID() });
    res.status(201).json(publicTour(tour.toObject(), await exhibitionTitles([tour])));
  } catch (error) { next(error); }
});

router.put('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const input = tourBody(req.body);
    if (input.exhibitionId !== undefined && (typeof input.exhibitionId !== 'string' || !await Exhibition.exists({ id: input.exhibitionId }))) {
      res.status(400).json({ error: exhibitionError, fields: { exhibitionId: exhibitionError } }); return;
    }
    if (input.capacity !== undefined && !validCapacity(input.capacity)) {
      res.status(400).json({ error: capacityError, fields: { capacity: capacityError } }); return;
    }
    // La capacidad se compara con las reservas en la misma operación, para no dejar sobrecupo.
    const filter = input.capacity === undefined ? { id: req.params.id }
      : { id: req.params.id, $expr: { $lte: [{ $size: '$bookings' }, input.capacity] } };
    const tour = await GuidedTour.findOneAndUpdate(filter, { $set: input }, { new: true, runValidators: true }).select('+bookings').lean();
    if (!tour) {
      const exists = await GuidedTour.exists({ id: req.params.id });
      const message = 'Los cupos no pueden ser menos que las reservas que ya existen.';
      if (exists) res.status(400).json({ error: message, fields: { capacity: message } });
      else res.status(404).json({ error: 'Visita guiada no encontrada.' });
      return;
    }
    res.json(publicTour(tour, await exhibitionTitles([tour])));
  } catch (error) { next(error); }
});

router.delete('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    if (!await GuidedTour.findOneAndDelete({ id: req.params.id })) { res.status(404).json({ error: 'Visita guiada no encontrada.' }); return; }
    res.status(204).end();
  } catch (error) { next(error); }
});

// Reservar: una sola operación comprueba que la visita no haya empezado, que queden cupos
// y que la persona no la haya reservado ya, así dos reservas simultáneas no sobrepasan el cupo.
router.post('/:id/bookings', withUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) { res.status(401).json({ error: 'La sesión ya no es válida.' }); return; }
    const tour = await GuidedTour.findOneAndUpdate(
      {
        id: req.params.id,
        date: { $gt: new Date() },
        'bookings.userId': { $ne: user.id },
        $expr: { $lt: [{ $size: '$bookings' }, '$capacity'] },
      },
      { $push: { bookings: { userId: user.id, name: user.name, username: user.username } } },
      { new: true, runValidators: true },
    ).select('+bookings').lean();
    if (!tour) {
      const exists = await GuidedTour.exists({ id: req.params.id });
      res.status(exists ? 409 : 404).json({
        error: exists ? 'No se pudo reservar: la visita ya comenzó, no quedan cupos o ya tienes una reserva.' : 'Visita guiada no encontrada.',
      });
      return;
    }
    res.status(201).json(publicTour(tour, await exhibitionTitles([tour]), user.id));
  } catch (error) { next(error); }
});

router.delete('/:id/bookings', withUser, async (req, res, next) => {
  try {
    const tour = await GuidedTour.findOneAndUpdate(
      { id: req.params.id, 'bookings.userId': req.userId },
      { $pull: { bookings: { userId: req.userId } } },
      { new: true },
    );
    if (!tour) {
      const exists = await GuidedTour.exists({ id: req.params.id });
      res.status(404).json({ error: exists ? 'No tienes una reserva en esta visita.' : 'Visita guiada no encontrada.' });
      return;
    }
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
