import express, { type Request, type Response } from "express";
import { Expo } from "../models/expo.ts";
import { pickFields } from "../utils/body.ts";

const router = express.Router();

// La expo es un solo documento (slug "main"): se puede ver y editar,
// pero no crear ni eliminar desde la API. Lo crea el seed.
const publicFields = "-_id -__v -createdAt -updatedAt";
const editableFields = [
    "name", "edition", "introduction", "dateLabel", "hours", "venue",
    "address", "admission", "transport", "accessibility", "faqs",
];

// Parte A: editar llevará middleware.withUser.

router.get("/", async (request, response) => {
    const expo = await Expo.findOne({ slug: "main" }).select(publicFields).lean();

    if (!expo) {
        response.status(404).json({ error: "Información aún no publicada." });
        return;
    }
    response.json(expo);
});

router.put("/", async (request: Request<object, unknown, unknown>, response: Response) => {
    const fields = pickFields(request.body, editableFields);
    if (!fields) {
        response.status(400).json({ error: "El cuerpo debe ser un objeto JSON." });
        return;
    }

    const expo = await Expo.findOneAndUpdate(
        { slug: "main" },
        { $set: fields },
        { new: true, runValidators: true },
    ).select(publicFields).lean();

    if (!expo) {
        response.status(404).json({ error: "Información aún no publicada." });
        return;
    }
    response.json(expo);
});

export default router;
