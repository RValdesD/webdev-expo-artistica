import express, { type Request, type Response } from "express";
import { Artwork, type ArtworkData } from "../models/artworks.ts";
import { Artist } from "../models/artists.ts";
import { idFromBody, pickFields, triesToChangeId } from "../utils/body.ts";

const router = express.Router();

const publicFields = "id title artistId medium imageUrl year description isSample -_id";
const editableFields = ["title", "artistId", "medium", "imageUrl", "year", "description"];

// Parte A: crear, actualizar y eliminar llevarán middleware.withUser.

// Agrega a cada obra el nombre de su artista, con una sola consulta extra.
const withArtist = async (artworks: ArtworkData[]) => {
    const artistIds = [...new Set(artworks.map((artwork) => artwork.artistId))];
    const artists = await Artist.find({ id: { $in: artistIds } })
        .select("id name -_id")
        .lean();
    const names = new Map(artists.map((artist) => [artist.id, artist.name]));

    return artworks.map((artwork) => {
        const name = names.get(artwork.artistId);
        return {
            ...artwork,
            artist: name === undefined ? null : { id: artwork.artistId, name },
        };
    });
};

const findPublic = async (id: string) => {
    const artwork = await Artwork.findOne({ id }).select(publicFields).lean();
    if (!artwork) return null;
    const [result] = await withArtist([artwork]);
    return result ?? null;
};

// Una obra no puede apuntar a un artista que no existe.
const artistIsMissing = async (artistId: unknown) =>
    typeof artistId === "string" && !(await Artist.exists({ id: artistId }));

router.get("/", async (request, response) => {
    const artworks = await Artwork.find({})
        .select(publicFields)
        .sort({ title: 1 })
        .lean();
    response.json(await withArtist(artworks));
});

router.get("/:id", async (request, response) => {
    const artwork = await findPublic(request.params.id);
    if (!artwork) {
        response.status(404).json({ error: "Obra no encontrada." });
        return;
    }
    response.json(artwork);
});

router.post("/", async (request: Request<object, unknown, unknown>, response: Response) => {
    const fields = pickFields(request.body, editableFields);
    if (!fields) {
        response.status(400).json({ error: "El cuerpo debe ser un objeto JSON." });
        return;
    }

    const id = idFromBody(request.body, fields.title);
    if (!id) {
        response.status(400).json({ error: "Falta el título de la obra." });
        return;
    }
    if (await artistIsMissing(fields.artistId)) {
        response.status(400).json({ error: "El artista indicado no existe." });
        return;
    }
    if (await Artwork.exists({ id })) {
        response.status(409).json({ error: `Ya existe una obra con el id "${id}".` });
        return;
    }

    await new Artwork({ ...fields, id }).save();
    response.status(201).json(await findPublic(id));
});

router.put(
    "/:id",
    async (request: Request<{ id: string }, unknown, unknown>, response: Response) => {
        const fields = pickFields(request.body, editableFields);
        if (!fields) {
            response.status(400).json({ error: "El cuerpo debe ser un objeto JSON." });
            return;
        }
        if (triesToChangeId(request.body, request.params.id)) {
            response.status(400).json({ error: "El id de una obra no se puede cambiar." });
            return;
        }
        if (await artistIsMissing(fields.artistId)) {
            response.status(400).json({ error: "El artista indicado no existe." });
            return;
        }

        const updated = await Artwork.findOneAndUpdate(
            { id: request.params.id },
            { $set: fields },
            { new: true, runValidators: true },
        ).lean();

        if (!updated) {
            response.status(404).json({ error: "Obra no encontrada." });
            return;
        }
        response.json(await findPublic(request.params.id));
    },
);

router.delete("/:id", async (request, response) => {
    const result = await Artwork.deleteOne({ id: request.params.id });
    if (result.deletedCount === 0) {
        response.status(404).json({ error: "Obra no encontrada." });
        return;
    }
    response.status(204).end();
});

export default router;
