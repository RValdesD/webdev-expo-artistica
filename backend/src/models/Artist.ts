import { Schema, model } from 'mongoose';

export interface ArtistSocials {
  instagram?: string;
  website?: string;
  twitter?: string;
  behance?: string;
}

export interface ArtistData {
  id: string;
  name: string;
  bio: string;
  discipline: string;
  imageUrl: string;
  socials?: ArtistSocials;
  isSample: boolean;
}

const urlRegex = /^https?:\/\/.+/i;

const socialsSchema = new Schema<ArtistSocials>(
  {
    instagram: { type: String, match: [urlRegex, 'El enlace de Instagram debe ser una URL válida (http/https)'], trim: true },
    website: { type: String, match: [urlRegex, 'El enlace del sitio web debe ser una URL válida (http/https)'], trim: true },
    twitter: { type: String, match: [urlRegex, 'El enlace de red social debe ser una URL válida (http/https)'], trim: true },
    behance: { type: String, match: [urlRegex, 'El enlace de Behance debe ser una URL válida (http/https)'], trim: true },
  },
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
