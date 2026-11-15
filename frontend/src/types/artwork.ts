export interface Artwork {
  id: string;
  title: string;
  artistId: string;
  medium: string;
  imageUrl: string;
  images: string[];
  previewImageUrl?: string;
  inSlideshow?: boolean;
  year: number;
  description: string;
  isSample: boolean;
  artist: { id: string; name: string } | null;
}

export type ArtworkInput = Pick<
  Artwork,
  'id' | 'title' | 'artistId' | 'medium' | 'imageUrl' | 'previewImageUrl' | 'inSlideshow' | 'images' | 'year' | 'description'
>;
