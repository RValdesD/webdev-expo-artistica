import express from "express";
import { Artwork } from "../models/artworks.ts";
import { Artist } from "../models/artists.ts";

const router = express.Router();

router.get("/", async (request, response) => {
    const artworks = await Artwork.find({})
        .select("id title artistId medium imageUrl year description isSample -_id")
        .sort({ title: 1 })
        .lean();

    // Se agrega el nombre del artista a cada obra con una sola consulta extra.
    const artistIds = [...new Set(artworks.map((artwork) => artwork.artistId))];
    const artists = await Artist.find({ id: { $in: artistIds } })
        .select("id name -_id")
        .lean();
    const names = new Map(artists.map((artist) => [artist.id, artist.name]));

    response.json(artworks.map((artwork) => {
        const name = names.get(artwork.artistId);
        return {
            ...artwork,
            artist: name === undefined ? null : { id: artwork.artistId, name },
        };
    }));
});

export default router;
