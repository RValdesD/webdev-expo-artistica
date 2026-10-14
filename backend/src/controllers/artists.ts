import express, { type Request, type Response } from "express";
import { Artist } from "../models/artists.ts";
import { Artwork } from "../models/artworks.ts";
import { Workshop } from "../models/workshops.ts";
import { idFromBody, pickFields, triesToChangeId } from "../utils/body.ts";

const router = express.Router();

const publicFields = "id name bio discipline imageUrl isSample -_id";
// Lo único que el cliente puede escribir. isSample lo maneja solo el seed.
const editableFields = ["name", "bio", "discipline", "imageUrl"];

// Parte A: crear, actualizar y eliminar llevarán middleware.withUser.

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

router.post("/", async (request: Request<object, unknown, unknown>, response: Response) => {
    const fields = pickFields(request.body, editableFields);
    if (!fields) {
        response.status(400).json({ error: "El cuerpo debe ser un objeto JSON." });
        return;
    }

    const id = idFromBody(request.body, fields.name);
    if (!id) {
        response.status(400).json({ error: "Falta el nombre del artista." });
        return;
    }
    if (await Artist.exists({ id })) {
        response.status(409).json({ error: `Ya existe un artista con el id "${id}".` });
        return;
    }

    // save() corre las validaciones del schema: si falla, el errorHandler responde 400.
    await new Artist({ ...fields, id }).save();
    const created = await Artist.findOne({ id }).select(publicFields).lean();
    response.status(201).json(created);
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
            response.status(400).json({ error: "El id de un artista no se puede cambiar." });
            return;
        }

        const artist = await Artist.findOneAndUpdate(
            { id: request.params.id },
            { $set: fields },
            { new: true, runValidators: true },
        ).select(publicFields).lean();

        if (!artist) {
            response.status(404).json({ error: "Artista no encontrado." });
            return;
        }
        response.json(artist);
    },
);

router.delete("/:id", async (request, response) => {
    const id = request.params.id;
    if (!(await Artist.exists({ id }))) {
        response.status(404).json({ error: "Artista no encontrado." });
        return;
    }

    // No se borra en cascada: si tiene obras o talleres, primero hay que
    // eliminarlos o reasignarlos. Así nadie pierde datos por error.
    const [artworks, workshops] = await Promise.all([
        Artwork.countDocuments({ artistId: id }),
        Workshop.countDocuments({ artistId: id }),
    ]);
    if (artworks + workshops > 0) {
        response.status(409).json({
            error: `No se puede eliminar: el artista tiene ${artworks} obra(s) y ${workshops} taller(es). Elimínalos o reasígnalos primero.`,
        });
        return;
    }

    await Artist.deleteOne({ id });
    response.status(204).end();
});

export default router;
