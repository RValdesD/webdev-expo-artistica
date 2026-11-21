import { Schema, model } from 'mongoose';
import { COVER_URL } from '../utils/coverImages.js';

// Temas de color disponibles; la lista con nombres y colores está en frontend/src/exhibitionThemes.ts.
export const exhibitionThemes = ['sea', 'ocean', 'green', 'terracotta', 'violet', 'crimson', 'sand', 'mono'] as const;

const exhibitionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  heading: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 5000 },
  theme: { type: String, enum: { values: exhibitionThemes, message: 'Elige un tema de la lista.' }, default: 'sea' },
  // Portada: una imagen de frontend/public/images/ (el controlador comprueba que exista).
  imageUrl: { type: String, default: '', maxlength: 1000,
    validate: { validator: (value: string) => !value || COVER_URL.test(value), message: 'Elige una portada de la carpeta public/images.' } },
  imageAlt: { type: String, default: '', maxlength: 300 },
  caption: { type: String, default: '', maxlength: 300 },
  order: { type: Number, default: 0, min: 0, max: 10000, validate: Number.isInteger },
  // true: se muestra grande en el inicio. false: aparece en "Otras exposiciones".
  featured: { type: Boolean, default: true },
  discipline: { type: String, default: '', trim: true, maxlength: 100 },
  room: { type: String, default: '', trim: true, maxlength: 80 },
  artistId: { type: String, default: '', match: /^[a-z0-9-]*$/ },
  // Planifica tu visita (/visitas/:id): horario de esta exposición y recomendaciones.
  visitHours: { type: String, default: '', trim: true, maxlength: 200 },
  visitNotes: { type: String, default: '', trim: true, maxlength: 2000 },
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
