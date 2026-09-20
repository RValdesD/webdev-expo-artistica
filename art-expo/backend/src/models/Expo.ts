import { Schema, model, type InferSchemaType } from 'mongoose';

const requiredText = { type: String, required: true, trim: true } as const;
const faqSchema = new Schema({ question: requiredText, answer: requiredText }, { _id: false });
const expoSchema = new Schema({
  slug: { ...requiredText, unique: true }, name: requiredText, edition: requiredText,
  introduction: requiredText, dateLabel: requiredText, hours: requiredText,
  venue: requiredText, address: requiredText, admission: requiredText, transport: requiredText,
  accessibility: { type: [String], required: true }, faqs: { type: [faqSchema], required: true },
  isSample: { type: Boolean, required: true },
}, { timestamps: true });

export type ExpoData = InferSchemaType<typeof expoSchema>;
export const Expo = model('Expo', expoSchema);
