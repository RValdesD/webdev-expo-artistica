import type { Request, Response, NextFunction } from 'express';
import { Workshop, type WorkshopData } from '../models/Workshop.js';
import { Artist } from '../models/Artist.js';

// Explicit public response: registration names and emails never leave the API.
function publicWorkshop(workshop: WorkshopData, artistName: string | undefined) {
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
  };
}

export async function getWorkshops(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workshops = await Workshop.find().select('+registrations').sort({ date: 1 }).lean();
    const artists = await Artist.find({ id: { $in: workshops.map(workshop => workshop.artistId) } }).lean();
    const names = new Map(artists.map(artist => [artist.id, artist.name]));
    res.json(workshops.map(workshop => publicWorkshop(workshop, names.get(workshop.artistId))));
  } catch (error: unknown) {
    next(error);
  }
}

export async function registerForWorkshop(
  req: Request<{ id: string }, unknown, unknown>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body;
    if (typeof body !== 'object' || body === null ||
        !('name' in body) || typeof body.name !== 'string' ||
        !('email' in body) || typeof body.email !== 'string') {
      res.status(400).json({ error: 'Indica un nombre y un correo válidos.' });
      return;
    }
    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();
    if (!name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Revisa el nombre y el correo ingresados.' });
      return;
    }

    // Capacity, start time and duplicate email are checked in the SAME write.
    // This avoids overbooking when two clients request the last place together.
    const workshop = await Workshop.findOneAndUpdate(
      {
        id: req.params.id,
        date: { $gt: new Date() },
        'registrations.email': { $ne: email },
        $expr: { $lt: [{ $size: '$registrations' }, '$capacity'] },
      },
      { $push: { registrations: { name, email } } },
      { new: true, runValidators: true },
    ).select('+registrations').lean();

    if (!workshop) {
      const exists = await Workshop.exists({ id: req.params.id });
      res.status(exists ? 409 : 404).json({
        error: exists
          ? 'No se pudo inscribir: el taller comenzó, no quedan cupos o el correo ya está inscrito.'
          : 'Taller no encontrado.',
      });
      return;
    }

    const artist = await Artist.findOne({ id: workshop.artistId }).lean();
    res.status(201).json({ workshop: publicWorkshop(workshop, artist?.name) });
  } catch (error: unknown) {
    next(error);
  }
}
