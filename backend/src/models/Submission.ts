import { Schema, model } from 'mongoose';
const schema = new Schema({
  userId: { type: String, required: true, index: true },
  artistId: { type: String, required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  medium: { type: String, required: true, trim: true, maxlength: 100 },
  year: { type: Number, required: true, min: 0, max: 9999, validate: Number.isInteger },
  description: { type: String, default: '', maxlength: 3000 },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'publishing', 'approved', 'rejected'], default: 'pending' },
  reviewNote: { type: String, default: '', maxlength: 1000 },
}, { timestamps: true });
export const Submission = model('Submission', schema);
