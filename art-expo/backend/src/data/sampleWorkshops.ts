import type { WorkshopData } from '../models/Workshop.js';

export const sampleWorkshops: WorkshopData[] = [
  {
    id: 'demo-acuarela',
    title: 'Luz y color en acuarela',
    description: 'Taller ficticio de demostración. Una introducción a las capas de color y la observación de la luz.',
    artistId: 'demo-elena-rios',
    date: new Date('2027-06-12T14:00:00-04:00'),
    durationMinutes: 90,
    location: 'Sala de demostración A',
    capacity: 12,
    isSample: true,
    registrations: [],
  },
  {
    id: 'demo-composicion',
    title: 'Composición con formas de papel',
    description: 'Taller ficticio de demostración. Explora el volumen y el equilibrio mediante formas de papel.',
    artistId: 'demo-tomas-vidal',
    date: new Date('2027-06-13T11:00:00-04:00'),
    durationMinutes: 60,
    location: 'Sala de demostración B',
    capacity: 8,
    isSample: true,
    registrations: [],
  },
];
