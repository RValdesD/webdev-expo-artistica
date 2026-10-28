import mongoose from 'mongoose';
import { Exhibition } from './models/Exhibition.js';
import { sampleExhibitions } from './data/sampleExhibitions.js';
import { Artist } from './models/Artist.js';
import { Artwork } from './models/Artwork.js';
import { Expo } from './models/expo.js';
import { Workshop } from './models/Workshop.js';
import { sampleArtists } from './data/sampleArtists.js';
import { sampleArtworks } from './data/sampleArtworks.js';
import { sampleExpo } from './data/sampleExpo.js';
import { sampleWorkshops } from './data/sampleWorkshops.js';
import { MONGODB_DBNAME, MONGODB_URI } from './utils/config.js';

async function insertMissing<T extends { id: string }>(
  values: T[],
  update: (value: T) => Promise<unknown>,
): Promise<void> {
  for (const value of values) await update(value);
}

try {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
  await Expo.updateOne({ slug: 'main' }, { $setOnInsert: sampleExpo }, { upsert: true, runValidators: true });
  await insertMissing(sampleArtists, value => Artist.updateOne({ id: value.id }, { $setOnInsert: value }, { upsert: true, runValidators: true }));

  const artistIds = new Set((await Artist.find().select('id -_id').lean()).map(artist => artist.id));
  const invalidRelations = [...sampleArtworks, ...sampleWorkshops].filter(item => !artistIds.has(item.artistId));
  if (invalidRelations.length) throw new Error(`Hay datos asociados a artistas inexistentes: ${invalidRelations.map(item => item.id).join(', ')}`);

  await insertMissing(sampleArtworks, value => Artwork.updateOne({ id: value.id }, { $setOnInsert: value }, { upsert: true, runValidators: true }));
  await insertMissing(sampleWorkshops, value => Workshop.updateOne({ id: value.id }, { $setOnInsert: value }, { upsert: true, runValidators: true }));
  for (const item of sampleExhibitions) await Exhibition.updateOne({ id: item.id }, { $setOnInsert: item }, { upsert: true, runValidators: true });
  console.log('Seed completado. Los documentos existentes se conservaron.');
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
