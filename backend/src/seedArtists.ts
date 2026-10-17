import mongoose from 'mongoose';
import { Artist } from './models/Artist.js';
import { sampleArtists } from './data/sampleArtists.js';
import { mongoUri, databaseName } from './config.js';

try {
  await mongoose.connect(mongoUri, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  await Artist.init();

  for (const artist of sampleArtists) {
    // Rerunning inserts missing profiles but never overwrites existing edits.
    await Artist.updateOne(
      { id: artist.id },
      { $setOnInsert: artist },
      { upsert: true, runValidators: true },
    );
  }

  console.log('Artistas de demostración disponibles. Se conservaron los perfiles existentes.');
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
