import express, { type Request, type Response } from "express";
import { Workshop, type WorkshopData } from "../models/workshops.ts";
import { Artist } from "../models/artists.ts";
import { idFromBody, pickFields, triesToChangeId } from "../utils/body.ts";

const router = express.Router();

// registrations NO está: las inscripciones solo cambian por su propia ruta.
const editableFields = [
    "title", "description", "artistId", "date", "durationMinutes", "location", "capacity",
];

// Parte A: crear, actualizar, eliminar e inscribirse llevarán middleware.withUser.

// Respuesta pública explícita: los nombres y correos inscritos nunca salen de la API.
const publicWorkshop = (workshop: WorkshopData, artistName: string | undefined) => ({
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    artistId: workshop.artistId,
    artist: artistName === undefined ? null : { id: workshop.artistId, name: artistName },
    date: workshop.date.toISOString(),
    durationMinutes: workshop.durationMinutes,
    location: workshop.location,
    capacity: workshop.capacity,
    availablePlaces: Math.max(0, workshop.capacity - workshop.registrations.length),
    isSample: workshop.isSample,
});

const findPublic = async (id: string) => {
    const workshop = await Workshop.findOne({ id }).select("+registrations").lean();
    if (!workshop) return null;
    const artist = await Artist.findOne({ id: workshop.artistId }).lean();
    return publicWorkshop(workshop, artist?.name);
};

// Un taller no puede apuntar a un artista que no existe.
const artistIsMissing = async (artistId: unknown) =>
    typeof artistId === "string" && !(await Artist.exists({ id: artistId }));

router.get("/", async (request, response) => {
    const workshops = await Workshop.find({}).select("+registrations").sort({ date: 1 }).lean();
    const artists = await Artist.find({
        id: { $in: workshops.map((workshop) => workshop.artistId) },
    }).lean();
    const names = new Map(artists.map((artist) => [artist.id, artist.name]));
    response.json(workshops.map((workshop) => publicWorkshop(workshop, names.get(workshop.artistId))));
});

router.get("/:id", async (request, response) => {
    const workshop = await findPublic(request.params.id);
    if (!workshop) {
        response.status(404).json({ error: "Taller no encontrado." });
        return;
    }
    response.json(workshop);
});

router.post("/", async (request: Request<object, unknown, unknown>, response: Response) => {
    const fields = pickFields(request.body, editableFields);
    if (!fields) {
        response.status(400).json({ error: "El cuerpo debe ser un objeto JSON." });
        return;
    }

    const id = idFromBody(request.body, fields.title);
    if (!id) {
        response.status(400).json({ error: "Falta el título del taller." });
        return;
    }
    if (await artistIsMissing(fields.artistId)) {
        response.status(400).json({ error: "El artista indicado no existe." });
        return;
    }
    if (await Workshop.exists({ id })) {
        response.status(409).json({ error: `Ya existe un taller con el id "${id}".` });
        return;
    }

    await new Workshop({ ...fields, id }).save();
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
            response.status(400).json({ error: "El id de un taller no se puede cambiar." });
            return;
        }

        const current = await Workshop.findOne({ id: request.params.id }).select("+registrations").lean();
        if (!current) {
            response.status(404).json({ error: "Taller no encontrado." });
            return;
        }
        if (await artistIsMissing(fields.artistId)) {
            response.status(400).json({ error: "El artista indicado no existe." });
            return;
        }

        // No se puede dejar el taller con menos cupos que personas inscritas.
        const registered = current.registrations.length;
        const newCapacity = Number(fields.capacity);
        if ("capacity" in fields && Number.isFinite(newCapacity) && newCapacity < registered) {
            response.status(400).json({
                error: `La capacidad no puede ser menor que los ${registered} inscritos.`,
            });
            return;
        }

        await Workshop.updateOne(
            { id: request.params.id },
            { $set: fields },
            { runValidators: true },
        );
        response.json(await findPublic(request.params.id));
    },
);

router.delete("/:id", async (request, response) => {
    const result = await Workshop.deleteOne({ id: request.params.id });
    if (result.deletedCount === 0) {
        response.status(404).json({ error: "Taller no encontrado." });
        return;
    }
    response.status(204).end();
});

// El body se tipa como unknown para validarlo a mano, sin usar any.
router.post(
    "/:id/registrations",
    async (request: Request<{ id: string }, unknown, unknown>, response: Response) => {
        const body = request.body;
        if (
            typeof body !== "object" || body === null ||
            !("name" in body) || typeof body.name !== "string" ||
            !("email" in body) || typeof body.email !== "string"
        ) {
            response.status(400).json({ error: "Indica un nombre y un correo válidos." });
            return;
        }

        const name = body.name.trim();
        const email = body.email.trim().toLowerCase();
        if (
            !name || name.length > 120 || email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            response.status(400).json({ error: "Revisa el nombre y el correo ingresados." });
            return;
        }

        // Cupo, fecha y correo repetido se revisan en la MISMA escritura,
        // para que dos personas no puedan tomar el último cupo a la vez.
        const workshop = await Workshop.findOneAndUpdate(
            {
                id: request.params.id,
                date: { $gt: new Date() },
                "registrations.email": { $ne: email },
                $expr: { $lt: [{ $size: "$registrations" }, "$capacity"] },
            },
            { $push: { registrations: { name, email } } },
            { new: true, runValidators: true },
        ).select("+registrations").lean();

        if (!workshop) {
            const exists = await Workshop.exists({ id: request.params.id });
            response.status(exists ? 409 : 404).json({
                error: exists
                    ? "No se pudo inscribir: el taller comenzó, no quedan cupos o el correo ya está inscrito."
                    : "Taller no encontrado.",
            });
            return;
        }

        const artist = await Artist.findOne({ id: workshop.artistId }).lean();
        response.status(201).json({ workshop: publicWorkshop(workshop, artist?.name) });
    },
);

export default router;
