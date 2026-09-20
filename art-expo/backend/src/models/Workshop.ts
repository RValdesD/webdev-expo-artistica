import { Schema, model } from 'mongoose';

export interface WorkshopData {
  id: string;
  title: string;
  description: string;
  artistId: string;
  date: Date;
  durationMinutes: number;
  location: string;
  capacity: number;
  isSample: boolean;
  registrations: { name: string; email: string }[];
}

const registrationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
}, { _id: false });

const workshopSchema = new Schema<WorkshopData>({
  id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  artistId: { type: String, required: true },
  date: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 1, validate: Number.isInteger },
  location: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, max: 200, validate: Number.isInteger },
  isSample: { type: Boolean, default: false },
  registrations: { type: [registrationSchema], default: [], select: false },
}, { timestamps: true });

export const Workshop = model<WorkshopData>('Workshop', workshopSchema);
