import { after, beforeEach, describe, test } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import supertest from "supertest";
import app from "../../src/app.ts";
import { Expo } from "../../src/models/expo.ts";
import helper from "./test_helper.ts";

const api = supertest(app);

beforeEach(async () => {
    await helper.resetDb();
});

describe("/api/expo", () => {
    test("GET devuelve la información de la expo", async () => {
        const response = await api.get("/api/expo").expect(200);
        assert.strictEqual(response.body.name, "Expo Artística");
        assert.strictEqual(response.body._id, undefined);
    });

    test("PUT actualiza la información y queda guardada", async () => {
        await api.put("/api/expo").send({ hours: "Martes a domingo, 10:00 a 19:00" }).expect(200);
        const expo = await Expo.findOne({ slug: "main" }).lean();
        assert.strictEqual(expo?.hours, "Martes a domingo, 10:00 a 19:00");
    });

    test("PUT con un campo obligatorio vacío responde 400", async () => {
        await api.put("/api/expo").send({ name: "" }).expect(400);
    });

    test("PUT sin expo publicada responde 404", async () => {
        await Expo.deleteMany({});
        await api.put("/api/expo").send({ hours: "x" }).expect(404);
    });
});

describe("rutas desconocidas", () => {
    test("responden 404 con un JSON de error", async () => {
        const response = await api
            .get("/api/no-existe")
            .expect(404)
            .expect("Content-Type", /application\/json/);
        assert.ok(response.body.error);
    });
});

after(async () => {
    await mongoose.connection.close();
});
