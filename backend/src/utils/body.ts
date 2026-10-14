// Utilidades para leer el cuerpo de las peticiones sin usar any.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

// Devuelve solo los campos permitidos que vienen en el cuerpo.
// Así nadie puede escribir campos internos como isSample o registrations.
// Si el cuerpo no es un objeto, devuelve null.
export const pickFields = (
    body: unknown,
    fields: readonly string[],
): Record<string, unknown> | null => {
    if (!isRecord(body)) return null;
    const result: Record<string, unknown> = {};
    for (const field of fields) {
        if (field in body) result[field] = body[field];
    }
    return result;
};

// "María José" → "maria-jose". Se usa para generar el id cuando no viene uno.
export const slugify = (text: string) =>
    text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

// El id que pide el cliente, o uno generado a partir del texto (nombre o título).
export const idFromBody = (body: unknown, fallbackText: unknown) => {
    if (isRecord(body) && typeof body.id === "string" && body.id.trim()) {
        return body.id.trim();
    }
    return typeof fallbackText === "string" ? slugify(fallbackText) : "";
};

// true si el cuerpo intenta cambiar el id de un documento existente.
export const triesToChangeId = (body: unknown, currentId: string) =>
    isRecord(body) && "id" in body && body.id !== currentId;
