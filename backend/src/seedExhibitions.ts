import mongoose from 'mongoose';
import { Exhibition } from './models/Exhibition.js';
import { sampleExhibitions } from './data/sampleExhibitions.js';
import { MONGODB_URI, MONGODB_DBNAME } from './utils/config.js';
try {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
  for (const item of sampleExhibitions) {
    await Exhibition.updateOne({ id: item.id }, { $setOnInsert: item }, { upsert: true, runValidators: true });
  }
  console.log('Exposiciones iniciales agregadas; los datos existentes se conservaron.');
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
