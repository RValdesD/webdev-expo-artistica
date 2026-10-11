export interface Artwork {
  id: string;
  title: string;
  artistId: string;
  medium: string;
  imageUrl: string;
  year: number;
  description: string;
  isSample: boolean;
  artist: { id: string; name: string } | null;
}
