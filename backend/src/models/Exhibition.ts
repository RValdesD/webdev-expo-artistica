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
  // true: se muestra grande en el inicio. false: aparece en "Otras exposiciones".
  featured: { type: Boolean, default: true },
  discipline: { type: String, default: '', trim: true, maxlength: 100 },
  room: { type: String, default: '', trim: true, maxlength: 80 },
  artistId: { type: String, default: '', match: /^[a-z0-9-]*$/ },
  startDate: { type: Date },
  endDate: {
    type: Date,
    validate: {
      // La fecha de término no puede ser anterior a la de inicio.
      validator(this: { startDate?: Date }, value: Date) { return !value || !this.startDate || value >= this.startDate; },
      message: 'La fecha de término debe ser igual o posterior a la de inicio.',
    },
  },
}, { timestamps: true });

export const Exhibition = model('Exhibition', exhibitionSchema);
