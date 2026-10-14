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

const newWorkshop = {
    title: "Tallado en madera",
    description: "Herramientas básicas de tallado.",
    artistId: "luis-soto",
    date: "2099-07-01T15:00:00.000Z",
    durationMinutes: 120,
    location: "Sala B",
    capacity: 10,
};

const register = (email: string) =>
    api.post("/api/workshops/acuarela/registrations").send({ name: "Visitante", email });

describe("GET /api/workshops", () => {
    test("un taller se obtiene por su id, sin datos de los inscritos", async () => {
        await register("a@test.cl").expect(201);
        const response = await api.get("/api/workshops/acuarela").expect(200);
        assert.strictEqual(response.body.availablePlaces, 2);
        assert.strictEqual(response.body.registrations, undefined);
        assert.strictEqual(JSON.stringify(response.body).includes("a@test.cl"), false);
    });

    test("un taller que no existe responde 404", async () => {
        await api.get("/api/workshops/no-existe").expect(404);
    });
});

describe("POST /api/workshops", () => {
    test("crea un taller válido", async () => {
        const response = await api.post("/api/workshops").send(newWorkshop).expect(201);
        assert.strictEqual(response.body.id, "tallado-en-madera");
        assert.strictEqual(response.body.availablePlaces, 10);
    });

    test("una fecha inválida responde 400 y no agrega nada", async () => {
        await api.post("/api/workshops").send({ ...newWorkshop, date: "no-es-fecha" }).expect(400);
        const workshops = await helper.workshopsInDb();
        assert.strictEqual(workshops.length, helper.initialWorkshops.length);
    });

    test("con un artista que no existe responde 400", async () => {
        await api.post("/api/workshops").send({ ...newWorkshop, artistId: "fantasma" }).expect(400);
    });
});

describe("PUT /api/workshops/:id", () => {
    test("actualiza un taller y el cambio queda guardado", async () => {
        await api.put("/api/workshops/acuarela").send({ location: "Sala C" }).expect(200);
        const workshops = await helper.workshopsInDb();
        assert.strictEqual(workshops[0]?.location, "Sala C");
    });

    test("no deja bajar la capacidad por debajo de los inscritos", async () => {
        await register("a@test.cl").expect(201);
        await register("b@test.cl").expect(201);
        await api.put("/api/workshops/acuarela").send({ capacity: 1 }).expect(400);
        const workshops = await helper.workshopsInDb();
        assert.strictEqual(workshops[0]?.capacity, 3);
    });

    test("no deja sobrescribir las inscripciones desde el cuerpo", async () => {
        await register("a@test.cl").expect(201);
        await api.put("/api/workshops/acuarela").send({ registrations: [] }).expect(200);
        const workshops = await helper.workshopsInDb();
        assert.strictEqual(workshops[0]?.registrations.length, 1);
    });

    test("un taller que no existe responde 404", async () => {
        await api.put("/api/workshops/no-existe").send({ location: "x" }).expect(404);
    });
});

describe("DELETE /api/workshops/:id", () => {
    test("elimina un taller", async () => {
        await api.delete("/api/workshops/acuarela").expect(204);
        assert.strictEqual((await helper.workshopsInDb()).length, 0);
    });

    test("un taller que no existe responde 404", async () => {
        await api.delete("/api/workshops/no-existe").expect(404);
    });
});

describe("POST /api/workshops/:id/registrations", () => {
    test("inscribirse descuenta un cupo, y el mismo correo no se repite", async () => {
        await register("a@test.cl").expect(201);
        await register("a@test.cl").expect(409);
        const response = await api.get("/api/workshops/acuarela");
        assert.strictEqual(response.body.availablePlaces, 2);
    });
});

after(async () => {
    await mongoose.connection.close();
});
