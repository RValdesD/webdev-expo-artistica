import mongoose from 'mongoose';
import { Artwork } from './models/Artwork.js';
import { Artist } from './models/Artist.js';
import { sampleArtworks } from './data/sampleArtworks.js';
import { mongoUri, databaseName } from './config.js';

try {
  await mongoose.connect(mongoUri, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });

  // Validate the complete seed before writing any records.
  const ids = new Set<string>();
  for (const artwork of sampleArtworks) {
    if (ids.has(artwork.id)) throw new Error(`ID de obra repetido: ${artwork.id}`);
    ids.add(artwork.id);
    await new Artwork(artwork).validate();
  }

  const artists = await Artist.find().select('id -_id').lean();
  const artistIds = new Set(artists.map(artist => artist.id));
  const missing = sampleArtworks.filter(artwork => !artistIds.has(artwork.artistId));
  if (missing.length > 0) {
    throw new Error(`Faltan artistas: ${[...new Set(missing.map(artwork => artwork.artistId))].join(', ')}. Crea esos artistas primero o corrige artistId en sampleArtworks.ts.`);
  }

  await Artwork.init();
  let inserted = 0;
  for (const artwork of sampleArtworks) {
    const result = await Artwork.updateOne(
      { id: artwork.id },
      { $setOnInsert: artwork },
      { upsert: true, runValidators: true },
    );
    inserted += result.upsertedCount;
  }

  console.log(`${inserted} obras agregadas. Las obras existentes se conservaron.`);
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
