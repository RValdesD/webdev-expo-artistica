import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'exhibition-tests';
const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Exhibition } = await import('../src/models/Exhibition.js');
const original = { user: User.findById, create: Exhibition.create, update: Exhibition.findOneAndUpdate, remove: Exhibition.findOneAndDelete, find: Exhibition.find };
let role = 'visitante';
let saved: Record<string, unknown> = {};
User.findById = (async () => ({ role })) as unknown as typeof User.findById;
Exhibition.create = (async (data: Record<string, unknown>) => {
  await new Exhibition(data).validate(); saved = data; return data;
}) as unknown as typeof Exhibition.create;
Exhibition.findOneAndUpdate = (async (_filter: unknown, data: { $set: Record<string, unknown> }) => {
  await new Exhibition({ ...saved, ...data.$set }).validate(); saved = { ...saved, ...data.$set }; return saved;
}) as unknown as typeof Exhibition.findOneAndUpdate;
Exhibition.findOneAndDelete = (async () => saved) as unknown as typeof Exhibition.findOneAndDelete;
Exhibition.find = (() => ({ sort: () => ({ select: () => ({ lean: async () => [saved] }) }) })) as unknown as typeof Exhibition.find;
after(() => { User.findById = original.user; Exhibition.create = original.create; Exhibition.findOneAndUpdate = original.update; Exhibition.findOneAndDelete = original.remove; Exhibition.find = original.find; });
const token = jwt.sign({ id: '507f1f77bcf86cd799439011', username: 'admin', csrf: 'csrf' }, process.env.JWT_SECRET!);
const auth = (method: 'post'|'put'|'delete', path: string) => request(app)[method](path).set('Cookie', 'token=' + token).set('X-CSRF-Token', 'csrf');
for (const method of ['post', 'put', 'delete'] as const) {
  const path = '/api/exhibitions' + (method === 'post' ? '' : '/example');
  test(method + ': visitor and unauthenticated writes blocked', async () => {
    role = 'visitante';
    assert.equal((await request(app)[method](path).send({})).status, 401);
    assert.equal((await auth(method, path).send({ role: 'organizador' })).status, 403);
  });
}
test('admin creates editable item; public reads; immutable ID and safe URL validation', async () => {
  role = 'organizador';
  const created = await auth('post', '/api/exhibitions').send({ id: 'forged', title: 'Example', heading: 'Heading', theme: 'green', order: 1 });
  assert.equal(created.status, 201); assert.notEqual(created.body.id, 'forged');
  const id = created.body.id;
  assert.equal((await request(app).get('/api/exhibitions')).body[0].title, 'Example');
  assert.equal((await auth('put', '/api/exhibitions/' + id).send({ id: 'changed', title: 'Edited' })).status, 200);
  assert.equal(saved.id, id); assert.equal(saved.title, 'Edited');
  assert.equal((await auth('put', '/api/exhibitions/' + id).send({ imageUrl: 'javascript:alert(1)' })).status, 400);
  assert.equal((await auth('put', '/api/exhibitions/' + id).send({ theme: 'bad' })).status, 400);
  assert.equal((await auth('put', '/api/exhibitions/' + id).send({ order: -1 })).status, 400);
  assert.equal((await auth('post', '/api/exhibitions').send({ title: 'No heading' })).status, 400);
  assert.equal((await auth('delete', '/api/exhibitions/' + id)).status, 204);
});
test('admin still requires matching CSRF', async () => {
  role = 'organizador';
  assert.equal((await request(app).post('/api/exhibitions').set('Cookie', 'token=' + token).send({})).status, 401);
});
