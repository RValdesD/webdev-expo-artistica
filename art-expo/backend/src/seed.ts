import mongoose from 'mongoose';
import { Expo } from './models/Expo.js';
import { sampleExpo } from './data/sampleExpo.js';
import { mongoUri, databaseName } from './config.js';

try {
  await mongoose.connect(mongoUri, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  // Insert once; rerunning never overwrites existing expo information.
  await Expo.updateOne({ slug: 'main' }, { $setOnInsert: sampleExpo }, { upsert: true, runValidators: true });
  console.log('Información inicial disponible. Los datos existentes se conservaron.');
} catch (error: unknown) { console.error(error); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
