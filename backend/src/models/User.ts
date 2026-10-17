import { Schema, model } from 'mongoose';

export interface UserData {
  username: string;
  name: string;
  passwordHash: string;
}

const userSchema = new Schema<UserData>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 40 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
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
