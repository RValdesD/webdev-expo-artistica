import { Schema, model } from 'mongoose';

export interface UserData {
  username: string;
  email?: string;
  name: string;
  passwordHash: string;
  role: 'visitante' | 'organizador';
}

const userSchema = new Schema<UserData>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 40 },
  // sparse: las cuentas creadas antes de pedir correo no lo tienen y no chocan entre sí.
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['visitante', 'organizador'], default: 'visitante', required: true },
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
