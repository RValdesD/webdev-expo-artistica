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
}

export interface WorkshopRegistration {
  name: string;
  email: string;
}
