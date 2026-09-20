import mongoose from 'mongoose';
import { Workshop } from './models/Workshop.js';
import { Artist } from './models/Artist.js';
import { sampleWorkshops } from './data/sampleWorkshops.js';
import { mongoUri, databaseName } from './config.js';

try {
  await mongoose.connect(mongoUri, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  const artists = await Artist.find().select('id').lean();
  const artistIds = new Set(artists.map(artist => artist.id));
  const ids = new Set<string>();

  for (const workshop of sampleWorkshops) {
    if (ids.has(workshop.id)) throw new Error(`ID repetido: ${workshop.id}`);
    ids.add(workshop.id);
    await new Workshop(workshop).validate();
    if (!artistIds.has(workshop.artistId)) throw new Error(`Primero crea el artista ${workshop.artistId} o corrige artistId.`);
  }

  await Workshop.init();
  let inserted = 0;
  for (const workshop of sampleWorkshops) {
    const result = await Workshop.updateOne(
      { id: workshop.id },
      { $setOnInsert: workshop },
      { upsert: true, runValidators: true },
    );
    inserted += result.upsertedCount;
  }
  console.log(`${inserted} talleres agregados. Los talleres e inscripciones existentes se conservaron.`);
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
