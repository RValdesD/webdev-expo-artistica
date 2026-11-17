import { Schema, model } from 'mongoose';

export interface ArtworkData {
  id: string;
  title: string;
  artistId: string;
  medium: string;
  imageUrl: string;
  images?: string[];
  previewImageUrl?: string;
  inSlideshow?: boolean;
  year: number;
  description: string;
  isSample: boolean;
}

export const MAX_ARTWORK_IMAGES = 10;
// Solo archivos dentro de /images/ (frontend/public/images/, con subcarpetas); nunca URLs externas, javascript: ni data:.
const isImageUrl = (value: string): boolean => {
  if (!value.startsWith('/images/')) return false;

  const path = value.slice('/images/'.length);

  return (
    path.length > 0 &&
    !/[\s\\?#%]/.test(path) &&
    path.split('/').every(part =>
      part !== '' && part !== '.' && part !== '..'
    )
  );
};

const artworkSchema = new Schema<ArtworkData>(
  {
    id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    // References the public Artist.id string used in step 2.
    artistId: { type: String, required: true, match: /^[a-z0-9-]+$/ },
    medium: { type: String, required: true, trim: true, maxlength: 100 },
    imageUrl: { type: String, default: '', trim: true },
    previewImageUrl: { type: String, default: '', trim: true, maxlength: 1000,
      validate: { validator: (value: string) => !value || isImageUrl(value), message: 'La vista previa debe ser una ruta local o una URL http(s).' } },
    inSlideshow: { type: Boolean, default: false },
    // Imágenes extra de la misma obra; la galería las muestra después de imageUrl.
    images: {
      type: [{
        type: String, trim: true, maxlength: 1000,
        validate: { validator: isImageUrl, message: 'Cada imagen debe ser una ruta dentro de /images/.' },
      }],
      default: [],
      validate: { validator: (list: string[]) => list.length <= MAX_ARTWORK_IMAGES, message: `Una obra puede tener hasta ${MAX_ARTWORK_IMAGES} imágenes extra.` },
    },
    year: { type: Number, required: true, validate: { validator: Number.isInteger, message: 'El año debe ser un entero.' } },
    description: { type: String, default: '', trim: true, maxlength: 3000 },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Artwork = model<ArtworkData>('Artwork', artworkSchema);
