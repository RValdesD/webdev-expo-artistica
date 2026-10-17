import { Router } from 'express';
import { Artist } from '../models/Artist.js';
import { Workshop, type WorkshopData } from '../models/Workshop.js';
import { withUser } from '../utils/middleware.js';

const registrationsRouter = Router();

function visitorWorkshop(workshop: WorkshopData, artistName: string | undefined, userId: string) {
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
    isRegistered: workshop.registrations.some(registration => registration.userId === userId),
  };
}

registrationsRouter.get('/me', withUser, async (req, res, next) => {
  try {
    const workshops = await Workshop.find({ 'registrations.userId': req.userId })
      .select('+registrations')
      .sort({ date: 1 })
      .lean();
    const artists = await Artist.find({ id: { $in: workshops.map(workshop => workshop.artistId) } })
      .select('id name -_id')
      .lean();
    const artistNames = new Map(artists.map(artist => [artist.id, artist.name]));
    res.json(workshops.map(workshop => visitorWorkshop(workshop, artistNames.get(workshop.artistId), req.userId!)));
  } catch (error: unknown) { next(error); }
});

export default registrationsRouter;
