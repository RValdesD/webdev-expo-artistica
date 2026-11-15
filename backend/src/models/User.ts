import { Schema, model } from 'mongoose';

export interface UserData {
  createdVia?: 'console' | 'registration';
  username: string;
  email?: string;
  avatarUrl?: string;
  name: string;
  passwordHash: string;
  role: 'visitante' | 'organizador' | 'artista';
}

const userSchema = new Schema<UserData>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 40 },
  // sparse: las cuentas creadas antes de pedir correo no lo tienen y no chocan entre sí.
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
  createdVia: { type: String, enum: ['console', 'registration'] },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['visitante', 'organizador', 'artista'], default: 'visitante', required: true },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform(_document, returned) {
    const value = returned as unknown as Record<string, unknown>;
    value.id = String(value._id);
    delete value._id;
    delete value.__v;
    delete value.passwordHash;
  },
});

export const User = model<UserData>('User', userSchema);
