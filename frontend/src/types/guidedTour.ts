export interface GuidedTour {
  id: string;
  exhibitionId: string;
  exhibition: { id: string; title: string } | null;
  date: string;
  durationMinutes: number;
  capacity: number;
  availablePlaces: number;
  guide: string;
  language: string;
  meetingPoint: string;
  isSample: boolean;
  isBooked: boolean;
}

export type GuidedTourInput = Pick<GuidedTour, 'exhibitionId' | 'date' | 'durationMinutes' | 'capacity' | 'guide' | 'language' | 'meetingPoint'>;
