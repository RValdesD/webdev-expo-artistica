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
