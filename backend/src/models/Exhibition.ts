import { Schema, model } from 'mongoose';

const exhibitionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  heading: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 5000 },
  theme: { type: String, enum: ['sea', 'green'], default: 'sea' },
  imageUrl: { type: String, default: '', maxlength: 1000,
    validate: (value: string) => !value || /^\/(?!\/)/.test(value) || /^https?:\/\//.test(value) },
  imageAlt: { type: String, default: '', maxlength: 300 },
  caption: { type: String, default: '', maxlength: 300 },
  order: { type: Number, default: 0, min: 0, max: 10000, validate: Number.isInteger },
}, { timestamps: true });

export const Exhibition = model('Exhibition', exhibitionSchema);
