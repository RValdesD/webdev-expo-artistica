import express from "express";
import { Artist } from "../models/artists.ts";

const router = express.Router();

const publicFields = "id name bio discipline imageUrl isSample -_id";

router.get("/", async (request, response) => {
    const artists = await Artist.find({})
        .select(publicFields)
        .sort({ name: 1 })
        .lean();
    response.json(artists);
});

router.get("/:id", async (request, response) => {
    const artist = await Artist.findOne({ id: request.params.id })
        .select(publicFields)
        .lean();

    if (!artist) {
        response.status(404).json({ error: "Artista no encontrado." });
        return;
    }
    response.json(artist);
});

export default router;
