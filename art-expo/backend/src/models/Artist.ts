import { Schema, model } from 'mongoose';

export interface ArtistData {
  id: string;
  name: string;
  bio: string;
  discipline: string;
  imageUrl: string;
  isSample: boolean;
}

const artistSchema = new Schema<ArtistData>(
  {
    // Public string identifier, compatible with the original frontend types.
    id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bio: { type: String, required: true, trim: true, maxlength: 5000 },
    discipline: { type: String, required: true, trim: true, maxlength: 100 },
    imageUrl: { type: String, default: '', trim: true },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Artist = model<ArtistData>('Artist', artistSchema);
