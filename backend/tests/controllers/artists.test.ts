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

describe("GET /api/artists", () => {
    test("devuelve todos los artistas en JSON", async () => {
        const response = await api
            .get("/api/artists")
            .expect(200)
            .expect("Content-Type", /application\/json/);
        assert.strictEqual(response.body.length, helper.initialArtists.length);
    });

    test("un artista existente se obtiene por su id", async () => {
        const response = await api.get("/api/artists/ana-perez").expect(200);
        assert.strictEqual(response.body.name, "Ana Pérez");
        assert.strictEqual(response.body._id, undefined);
    });

    test("un artista que no existe responde 404 con JSON", async () => {
        const response = await api
            .get("/api/artists/no-existe")
            .expect(404)
            .expect("Content-Type", /application\/json/);
        assert.ok(response.body.error);
    });
});

describe("POST /api/artists", () => {
    test("crea un artista válido y genera su id desde el nombre", async () => {
        const response = await api
            .post("/api/artists")
            .send({ name: "María José Ríos", bio: "Fotógrafa.", discipline: "Fotografía" })
            .expect(201)
            .expect("Content-Type", /application\/json/);

        assert.strictEqual(response.body.id, "maria-jose-rios");
        const artists = await helper.artistsInDb();
        assert.strictEqual(artists.length, helper.initialArtists.length + 1);
    });

    test("sin un campo obligatorio responde 400 y no agrega nada", async () => {
        await api.post("/api/artists").send({ name: "Sin Bio", discipline: "Pintura" }).expect(400);
        const artists = await helper.artistsInDb();
        assert.strictEqual(artists.length, helper.initialArtists.length);
    });

    test("un id repetido responde 409", async () => {
        await api
            .post("/api/artists")
            .send({ id: "ana-perez", name: "Otra Ana", bio: "x", discipline: "Pintura" })
            .expect(409);
    });

    test("no deja escribir campos internos como isSample", async () => {
        const response = await api
            .post("/api/artists")
            .send({ name: "Nuevo", bio: "x", discipline: "Pintura", isSample: true })
            .expect(201);
        assert.strictEqual(response.body.isSample, false);
    });

    test("un cuerpo que no es un objeto responde 400", async () => {
        await api.post("/api/artists").send(["no", "es", "objeto"]).expect(400);
    });
});

describe("PUT /api/artists/:id", () => {
    test("actualiza un artista y el cambio queda guardado", async () => {
        const response = await api
            .put("/api/artists/ana-perez")
            .send({ bio: "Pintora y grabadora." })
            .expect(200);
        assert.strictEqual(response.body.bio, "Pintora y grabadora.");

        const artists = await helper.artistsInDb();
        const ana = artists.find((artist) => artist.id === "ana-perez");
        assert.strictEqual(ana?.bio, "Pintora y grabadora.");
    });

    test("con datos inválidos responde 400 y no modifica nada", async () => {
        await api.put("/api/artists/ana-perez").send({ name: "" }).expect(400);
        const artists = await helper.artistsInDb();
        assert.strictEqual(artists.find((artist) => artist.id === "ana-perez")?.name, "Ana Pérez");
    });

    test("no permite cambiar el id", async () => {
        await api.put("/api/artists/ana-perez").send({ id: "otro-id" }).expect(400);
    });

    test("un artista que no existe responde 404", async () => {
        await api.put("/api/artists/no-existe").send({ bio: "x" }).expect(404);
    });
});

describe("DELETE /api/artists/:id", () => {
    test("elimina un artista sin obras ni talleres", async () => {
        await api.delete("/api/artists/luis-soto").expect(204);
        const artists = await helper.artistsInDb();
        assert.strictEqual(artists.some((artist) => artist.id === "luis-soto"), false);
    });

    test("un artista con obras o talleres no se elimina: 409", async () => {
        await api.delete("/api/artists/ana-perez").expect(409);
        const artists = await helper.artistsInDb();
        assert.strictEqual(artists.some((artist) => artist.id === "ana-perez"), true);
    });

    test("un artista que no existe responde 404", async () => {
        await api.delete("/api/artists/no-existe").expect(404);
    });
});

after(async () => {
    await mongoose.connection.close();
});
