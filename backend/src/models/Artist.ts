import { Schema, model } from 'mongoose';

// Spanish names used in validation messages; the keys are the supported platforms.
const socialLabels = {
  instagram: 'Instagram',
  website: 'sitio web',
  twitter: 'X / Twitter',
  behance: 'Behance',
  pixiv: 'Pixiv',
} as const;

export type SocialKey = keyof typeof socialLabels;
export const socialKeys = Object.keys(socialLabels) as SocialKey[];
export type ArtistSocials = Partial<Record<SocialKey, string>>;

export interface ArtistData {
  id: string;
  slug?: string;
  name: string;
  bio: string;
  discipline: string;
  imageUrl: string;
  socials?: ArtistSocials;
  socialImages?: ArtistSocials;
  isSample: boolean;
}

// Empty links are dropped so the API only returns links that exist.
const socialLink = (key: SocialKey) => ({
  type: String,
  set: (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
  match: [/^https:\/\/.+/i, `El enlace de ${socialLabels[key]} debe ser una URL segura (https://...).`] as [RegExp, string],
});

const socialsSchema = new Schema<ArtistSocials>(
  Object.fromEntries(socialKeys.map(key => [key, socialLink(key)])),
  { _id: false },
);

// Imágenes opcionales de cada enlace; las cuentas existentes conservan sus iconos.
const socialImagesSchema = new Schema<ArtistSocials>(
  Object.fromEntries(socialKeys.map(key => [key, {
    type: String,
    trim: true,
    maxlength: 1000,
    validate: {
      validator: (value: string) => {
        if (!value) return true;
        if (/^\/images\/[^\s\\]+$/.test(value)) return true;
        try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password; }
        catch { return false; }
      },
      message: `La imagen de ${socialLabels[key]} debe usar /images/... o una URL https:// válida.`,
    },
  }])),
  { _id: false },
);

const artistSchema = new Schema<ArtistData>(
  {
    // Public string identifier, compatible with the original frontend types.
    id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    slug: { type: String, unique: true, sparse: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bio: { type: String, required: true, trim: true, maxlength: 5000 },
    discipline: { type: String, required: true, trim: true, maxlength: 100 },
    imageUrl: { type: String, default: '', trim: true },
    socials: { type: socialsSchema, default: () => ({}) },
    socialImages: { type: socialImagesSchema, default: () => ({}) },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Artist = model<ArtistData>('Artist', artistSchema);
