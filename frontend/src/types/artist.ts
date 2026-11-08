export interface ArtistSocials {
  instagram?: string;
  website?: string;
  twitter?: string;
  behance?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  discipline: string;
  imageUrl: string;
  socials?: ArtistSocials;
  isSample: boolean;
}

export type ArtistInput = Omit<Artist, 'isSample'>;
