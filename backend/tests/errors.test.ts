import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

process.env.JWT_SECRET ??= 'errors-tests-only-secret';
const { errorHandler } = await import('../src/utils/middleware.js');
const { Artist } = await import('../src/models/Artist.js');

function fakeResponse() {
  const sent: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) { sent.status = code; return res; },
    json(body: unknown) { sent.body = body; return res; },
  } as unknown as Response;
  return { res, sent };
}

test('los errores de validación se devuelven por campo y en español', async () => {
  const artist = new Artist({ id: 'x', name: 'X', bio: 'Y', discipline: 'Z', socials: { instagram: 'nope' } });
  const error = await artist.validate().then(() => null, (reason: unknown) => reason);
  const { res, sent } = fakeResponse();
  errorHandler(error, {} as Request, res, () => undefined);
  assert.equal(sent.status, 400);
  assert.deepEqual(sent.body, {
    error: 'Revisa los campos.',
    fields: { instagram: 'El enlace de Instagram debe ser una URL segura (https://...).' },
  });
});

test('los errores de validación de Mongoose salen en español, no en inglés', async () => {
  const { Artwork } = await import('../src/models/Artwork.js');
  const error = await new Artwork({ id: 'Con Espacios', artistId: 'a', medium: 'Óleo', year: 2024.5, title: 'x'.repeat(201) })
    .validate().then(() => null, (reason: unknown) => reason);
  const { res, sent } = fakeResponse();
  errorHandler(error, {} as Request, res, () => undefined);
  const body = sent.body as { error: string; fields: Record<string, string> };
  assert.equal(sent.status, 400);
  assert.equal(body.fields.title, 'Máximo 200 caracteres.');
  assert.equal(body.fields.id, 'Usa solo minúsculas, números y guiones.');
  assert.equal(body.fields.year, 'El año debe ser un entero.');
  assert.doesNotMatch(JSON.stringify(body), /Path|validation failed|is required|is longer/i);
});

test('el 409 dice qué valor está repetido', () => {
  const { res, sent } = fakeResponse();
  errorHandler({ code: 11000, keyValue: { id: 'demo-ventana' } }, {} as Request, res, () => undefined);
  assert.equal(sent.status, 409);
  assert.deepEqual(sent.body, {
    error: 'Ya existe un registro con identificador «demo-ventana».',
    fields: { id: 'Ya está en uso.' },
  });
});

