import express, { type Request, type Response } from "express";
import { Workshop, type WorkshopData } from "../models/workshops.ts";
import { Artist } from "../models/artists.ts";

const router = express.Router();

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

router.get("/", async (request, response) => {
    const workshops = await Workshop.find({}).select("+registrations").sort({ date: 1 }).lean();
    const artists = await Artist.find({
        id: { $in: workshops.map((workshop) => workshop.artistId) },
    }).lean();
    const names = new Map(artists.map((artist) => [artist.id, artist.name]));
    response.json(workshops.map((workshop) => publicWorkshop(workshop, names.get(workshop.artistId))));
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
