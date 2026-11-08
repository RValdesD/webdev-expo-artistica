export const socialKeys = ['instagram', 'website', 'twitter', 'behance'] as const;
export type SocialKey = (typeof socialKeys)[number];
export type ArtistSocials = Partial<Record<SocialKey, string>>;

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

export const hasSocials = (socials: ArtistSocials | undefined) =>
  Boolean(socials && Object.values(socials).some(Boolean));
