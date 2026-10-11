import express from "express";
import mongoose from "mongoose";
import config from "./utils/config.ts";
import logger from "./utils/logger.ts";
import middleware from "./utils/middleware.ts";
import expoRouter from "./controllers/expo.ts";
import artistsRouter from "./controllers/artists.ts";
import artworksRouter from "./controllers/artworks.ts";
import workshopsRouter from "./controllers/workshops.ts";

const app = express();

mongoose.set("strictQuery", false);

mongoose.connect(config.MONGODB_URI, {
    dbName: config.MONGODB_DB_NAME || "expo_artistica",
})
    .catch((error: unknown) => {
        logger.error(
            "error connecting to MongoDB:",
            error instanceof Error ? error.message : String(error),
        );
    });

app.disable("x-powered-by");
app.use(express.static("dist"));
app.use(express.json({ limit: "20kb" }));
app.use(middleware.requestLogger);

app.use("/api/expo", expoRouter);
app.use("/api/artists", artistsRouter);
app.use("/api/artworks", artworksRouter);
app.use("/api/workshops", workshopsRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
