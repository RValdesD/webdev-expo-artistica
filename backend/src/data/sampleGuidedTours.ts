import type { GuidedTourData } from '../models/GuidedTour.js';

// Visitas guiadas ficticias para las exposiciones de ejemplo del inicio.
const tour = (id: string, exhibitionId: string, date: string, guide: string, language = 'Español'): GuidedTourData => ({
  id, exhibitionId, date: new Date(date), durationMinutes: 45, capacity: 15, guide, language,
  meetingPoint: 'Hall de acceso, junto al mesón de informaciones', isSample: true, bookings: [],
});

export const sampleGuidedTours: GuidedTourData[] = [
  tour('demo-visita-mares-1', 'los-grandes-mares', '2027-06-12T11:00:00-04:00', 'Camila Soto'),
  tour('demo-visita-mares-2', 'los-grandes-mares', '2027-06-13T16:00:00-04:00', 'Camila Soto'),
  tour('demo-visita-mares-3', 'los-grandes-mares', '2027-06-19T12:00:00-04:00', 'Daniel Pérez', 'Inglés'),
  tour('demo-visita-indigena-1', 'arte-indigena', '2027-06-12T15:00:00-04:00', 'Rayén Huenchumilla'),
  tour('demo-visita-indigena-2', 'arte-indigena', '2027-06-20T11:00:00-04:00', 'Rayén Huenchumilla'),
];
