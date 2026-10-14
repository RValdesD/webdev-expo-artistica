import { after, beforeEach, describe, test } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import supertest from "supertest";
import app from "../../src/app.ts";
import helper from "./test_helper.ts";

const api = supertest(app);

beforeEach(async () => {
    await helper.resetDb();
});

const newArtwork = { title: "Faro", artistId: "luis-soto", medium: "Escultura", year: 2023 };

describe("GET /api/artworks", () => {
    test("devuelve todas las obras con el nombre de su artista", async () => {
        const response = await api.get("/api/artworks").expect(200);
        assert.strictEqual(response.body.length, helper.initialArtworks.length);
        assert.deepStrictEqual(response.body[0].artist, { id: "ana-perez", name: "Ana Pérez" });
    });

    test("una obra se obtiene por su id, y si no existe responde 404", async () => {
        const response = await api.get("/api/artworks/mar-azul").expect(200);
        assert.strictEqual(response.body.title, "Mar azul");
        await api.get("/api/artworks/no-existe").expect(404);
    });
});

describe("POST /api/artworks", () => {
    test("crea una obra válida", async () => {
        const response = await api.post("/api/artworks").send(newArtwork).expect(201);
        assert.strictEqual(response.body.id, "faro");
        assert.strictEqual(response.body.artist.name, "Luis Soto");
        const artworks = await helper.artworksInDb();
        assert.strictEqual(artworks.length, helper.initialArtworks.length + 1);
    });

    test("con un artista que no existe responde 400 y no agrega nada", async () => {
        await api.post("/api/artworks").send({ ...newArtwork, artistId: "fantasma" }).expect(400);
        const artworks = await helper.artworksInDb();
        assert.strictEqual(artworks.length, helper.initialArtworks.length);
    });

    test("un año que no es número responde 400 indicando el campo", async () => {
        const response = await api.post("/api/artworks").send({ ...newArtwork, year: "abc" }).expect(400);
        assert.match(response.body.error, /year/);
    });
});

describe("PUT /api/artworks/:id", () => {
    test("actualiza una obra y el cambio queda guardado", async () => {
        await api.put("/api/artworks/mar-azul").send({ year: 2020 }).expect(200);
        const artworks = await helper.artworksInDb();
        assert.strictEqual(artworks.find((artwork) => artwork.id === "mar-azul")?.year, 2020);
    });

    test("cambiar a un artista que no existe responde 400", async () => {
        await api.put("/api/artworks/mar-azul").send({ artistId: "fantasma" }).expect(400);
    });

    test("una obra que no existe responde 404", async () => {
        await api.put("/api/artworks/no-existe").send({ year: 2020 }).expect(404);
    });
});

describe("DELETE /api/artworks/:id", () => {
    test("elimina una obra", async () => {
        await api.delete("/api/artworks/mar-azul").expect(204);
        const artworks = await helper.artworksInDb();
        assert.strictEqual(artworks.length, helper.initialArtworks.length - 1);
    });

    test("una obra que no existe responde 404", async () => {
        await api.delete("/api/artworks/no-existe").expect(404);
    });
});

after(async () => {
    await mongoose.connection.close();
});
