import '../utils/collections.js';
import { Schema, model } from 'mongoose';
import { registrationSchema } from './Workshop.js';

// Visita guiada a una exposición, con cupos. Las personas la reservan con su cuenta
// (igual que los talleres) y la ven en Mi visita.
export interface GuidedTourData {
  id: string;
  exhibitionId: string;
  date: Date;
  durationMinutes: number;
  capacity: number;
  guide: string;
  language: string;
  meetingPoint: string;
  isSample: boolean;
  bookings: { userId: string; name: string; username: string }[];
}

export const MAX_TOUR_CAPACITY = 60;

const guidedTourSchema = new Schema<GuidedTourData>({
  id: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
  exhibitionId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 10, max: 480, validate: Number.isInteger },
  capacity: { type: Number, required: true, min: 1, max: MAX_TOUR_CAPACITY, validate: Number.isInteger },
  guide: { type: String, default: '', trim: true, maxlength: 120 },
  language: { type: String, default: 'Español', trim: true, maxlength: 60 },
  meetingPoint: { type: String, required: true, trim: true, maxlength: 200 },
  isSample: { type: Boolean, default: false },
  bookings: { type: [registrationSchema], default: [], select: false },
}, { timestamps: true });

export const GuidedTour = model<GuidedTourData>('GuidedTour', guidedTourSchema);
