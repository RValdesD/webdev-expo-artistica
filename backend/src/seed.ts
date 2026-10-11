// Carga los datos de ejemplo que falten: expo, artistas, obras y talleres.
// Nunca sobrescribe lo que ya existe, así que se puede correr las veces que sea.
import mongoose from "mongoose";
import config from "./utils/config.ts";
import { Expo } from "./models/expo.ts";
import { Artist } from "./models/artists.ts";
import { Artwork } from "./models/artworks.ts";
import { Workshop } from "./models/workshops.ts";
import { sampleExpo } from "./data/sampleExpo.ts";
import { sampleArtists } from "./data/sampleArtists.ts";
import { sampleArtworks } from "./data/sampleArtworks.ts";
import { sampleWorkshops } from "./data/sampleWorkshops.ts";

const assertUniqueIds = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) throw new Error(`ID de ${label} repetido: ${id}`);
        seen.add(id);
    }
};

try {
    await mongoose.connect(config.MONGODB_URI, {
        dbName: config.MONGODB_DB_NAME || "expo_artistica",
        serverSelectionTimeoutMS: 5000,
    });

    // 1. Validar todo antes de escribir nada.
    assertUniqueIds("artista", sampleArtists.map((artist) => artist.id));
    assertUniqueIds("obra", sampleArtworks.map((artwork) => artwork.id));
    assertUniqueIds("taller", sampleWorkshops.map((workshop) => workshop.id));

    await new Expo(sampleExpo).validate();
    for (const artist of sampleArtists) await new Artist(artist).validate();
    for (const artwork of sampleArtworks) await new Artwork(artwork).validate();
    for (const workshop of sampleWorkshops) await new Workshop(workshop).validate();

    const existingArtists = await Artist.find({}).select("id -_id").lean();
    const artistIds = new Set([
        ...sampleArtists.map((artist) => artist.id),
        ...existingArtists.map((artist) => artist.id),
    ]);
    const missing = [...sampleArtworks, ...sampleWorkshops]
        .map((item) => item.artistId)
        .filter((artistId) => !artistIds.has(artistId));
    if (missing.length > 0) {
        throw new Error(`Faltan artistas: ${[...new Set(missing)].join(", ")}`);
    }

    // 2. Insertar solo lo que falta ($setOnInsert no toca documentos existentes).
    const options = { upsert: true, runValidators: true };

    const expoResult = await Expo.updateOne({ slug: "main" }, { $setOnInsert: sampleExpo }, options);

    let artists = 0;
    for (const artist of sampleArtists) {
        artists += (await Artist.updateOne({ id: artist.id }, { $setOnInsert: artist }, options)).upsertedCount;
    }

    let artworks = 0;
    for (const artwork of sampleArtworks) {
        artworks += (await Artwork.updateOne({ id: artwork.id }, { $setOnInsert: artwork }, options)).upsertedCount;
    }

    let workshops = 0;
    for (const workshop of sampleWorkshops) {
        workshops += (await Workshop.updateOne({ id: workshop.id }, { $setOnInsert: workshop }, options)).upsertedCount;
    }

    console.log(
        `Agregados: ${expoResult.upsertedCount} expo, ${artists} artistas, ` +
        `${artworks} obras, ${workshops} talleres. Lo existente se conservó.`,
    );
} catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
