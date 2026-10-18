export interface Workshop {
  id: string;
  title: string;
  description: string;
  artistId: string;
  artist: { id: string; name: string } | null;
  date: string;
  durationMinutes: number;
  location: string;
  capacity: number;
  availablePlaces: number;
  isSample: boolean;
  isRegistered: boolean;
}

export type WorkshopInput = Pick<
  Workshop,
  'id' | 'title' | 'description' | 'artistId' | 'date' | 'durationMinutes' | 'location' | 'capacity'
>;
