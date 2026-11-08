import { Schema, model } from 'mongoose';

export const socialKeys = ['instagram', 'website', 'twitter', 'behance'] as const;
export type ArtistSocials = Partial<Record<(typeof socialKeys)[number], string>>;

export interface ArtistData {
  id: string;
  name: string;
  bio: string;
  discipline: string;
  imageUrl: string;
  socials?: ArtistSocials;
  isSample: boolean;
}

// Empty links are dropped so the API only returns links that exist.
const socialLink = {
  type: String,
  set: (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
  match: [/^https?:\/\/.+/i, 'El enlace de {PATH} debe ser una URL válida (http/https)'] as [RegExp, string],
};

const socialsSchema = new Schema<ArtistSocials>(
  Object.fromEntries(socialKeys.map(key => [key, socialLink])),
  { _id: false },
);

const artistSchema = new Schema<ArtistData>(
  {
    // Public string identifier, compatible with the original frontend types.
    id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bio: { type: String, required: true, trim: true, maxlength: 5000 },
    discipline: { type: String, required: true, trim: true, maxlength: 100 },
    imageUrl: { type: String, default: '', trim: true },
    socials: { type: socialsSchema, default: () => ({}) },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Artist = model<ArtistData>('Artist', artistSchema);
