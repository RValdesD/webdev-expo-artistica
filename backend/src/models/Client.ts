import { Schema, model } from 'mongoose';

const clientSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['client'], default: 'client', required: true },
}, { timestamps: true });

export const Client = model('Client', clientSchema);
