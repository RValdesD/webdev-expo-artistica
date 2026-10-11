import express from "express";
import { Expo } from "../models/expo.ts";

const router = express.Router();

router.get("/", async (request, response) => {
    const expo = await Expo.findOne({ slug: "main" })
        .select("-_id -__v -createdAt -updatedAt")
        .lean();

    if (!expo) {
        response.status(404).json({ error: "Información aún no publicada." });
        return;
    }
    response.json(expo);
});

export default router;
