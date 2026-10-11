import { Schema, model } from 'mongoose';

export interface ArtworkData {
  id: string;
  title: string;
  artistId: string;
  medium: string;
  imageUrl: string;
  year: number;
  description: string;
  isSample: boolean;
}

const artworkSchema = new Schema<ArtworkData>(
  {
    id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    // References the public Artist.id string used in step 2.
    artistId: { type: String, required: true, match: /^[a-z0-9-]+$/ },
    medium: { type: String, required: true, trim: true, maxlength: 100 },
    imageUrl: { type: String, default: '', trim: true },
    year: { type: Number, required: true, validate: { validator: Number.isInteger, message: 'El año debe ser un entero.' } },
    description: { type: String, default: '', trim: true, maxlength: 3000 },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Artwork = model<ArtworkData>('Artwork', artworkSchema);
