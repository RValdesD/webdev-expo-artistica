import type { NextFunction, Request, Response } from "express";
import logger from "./logger.ts";

const requestLogger = (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    logger.info("Method:", request.method);
    logger.info("Path:  ", request.path);
    logger.info("Body:  ", request.body);
    logger.info("---");
    next();
};

// Si una petición llega hasta aquí, ninguna ruta coincidió.
const unknownEndpoint = (request: Request, response: Response) => {
    response.status(404).json({ error: "Ruta no encontrada." });
};

// Todo error termina aquí y siempre responde JSON con el código que corresponde.
// Con Express 5, un error lanzado dentro de un controlador async llega solo.
const errorHandler = (
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    if (response.headersSent) {
        next(error);
        return;
    }

    if (!(error instanceof Error)) {
        logger.error(String(error));
        response.status(500).json({ error: "Error interno del servidor." });
        return;
    }

    logger.error(error.name, error.message);

    if (error.name === "CastError") {
        // Mongoose no pudo convertir un valor: un id mal formado o, por ejemplo,
        // year: "abc". Se indica el campo para que el mensaje sea útil.
        const field = "path" in error && typeof error.path === "string" ? error.path : "";
        response.status(400).json({
            error: field && field !== "_id"
                ? `Valor inválido para el campo "${field}".`
                : "Identificador mal formado.",
        });
    } else if (error.name === "ValidationError") {
        response.status(400).json({ error: error.message });
    } else if ("type" in error && error.type === "entity.parse.failed") {
        // express.json() no pudo leer el cuerpo de la petición
        response.status(400).json({ error: "El cuerpo de la petición no es JSON válido." });
    } else if ("type" in error && error.type === "entity.too.large") {
        response.status(413).json({ error: "El cuerpo de la petición es demasiado grande." });
    } else if (
        error.name === "MongoServerError" &&
        error.message.includes("E11000 duplicate key error")
    ) {
        response.status(409).json({ error: "Ya existe un registro con ese identificador." });
    } else {
        response.status(500).json({ error: "Error interno del servidor." });
    }
};

export default { requestLogger, unknownEndpoint, errorHandler };
