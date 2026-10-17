import { Schema, model } from 'mongoose';

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const ClientSession = model('ClientSession', sessionSchema);
