import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'roles-tests-only-secret';
const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Artwork } = await import('../src/models/Artwork.js');
const { Workshop } = await import('../src/models/Workshop.js');
const { Artist } = await import('../src/models/Artist.js');
const { Expo } = await import('../src/models/Expo.js');
const originals = {
  findUser: User.findById, createUser: User.create,
  createArtwork: Artwork.create, updateArtwork: Artwork.findOneAndUpdate, deleteArtwork: Artwork.findOneAndDelete,
  createWorkshop: Workshop.create, updateWorkshop: Workshop.findOneAndUpdate, deleteWorkshop: Workshop.findOneAndDelete,
  createArtist: Artist.create, updateArtist: Artist.findOneAndUpdate, deleteArtist: Artist.findOneAndDelete,
  updateExpo: Expo.findOneAndUpdate,
};
let role: string | undefined = 'visitante';
let exists = true;
let mutations = 0;
const id = '507f1f77bcf86cd799439011';
const csrf = 'roles-csrf';
// The forged organizer claim must never override the database role.
const token = jwt.sign({ id, username: 'ana', csrf, role: 'organizador' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
const routes = [
  ...['artists', 'artworks', 'workshops'].flatMap(resource => [
    ['post', '/api/' + resource], ['put', '/api/' + resource + '/sample'],
    ['delete', '/api/' + resource + '/sample'],
  ]),
  ['put', '/api/expo'],
] as Array<['post' | 'put' | 'delete', string]>;

beforeEach(() => {
  role = 'visitante'; exists = true; mutations = 0;
  User.findById = (async () => exists ? { id, username: 'ana', name: 'Ana', role } : null) as unknown as typeof User.findById;
  const mutate = async () => { mutations++; return { id: 'sample' }; };
  Artist.create = mutate as unknown as typeof Artist.create;
  Artist.findOneAndUpdate = mutate as unknown as typeof Artist.findOneAndUpdate;
  Artist.findOneAndDelete = mutate as unknown as typeof Artist.findOneAndDelete;
  Artwork.create = mutate as unknown as typeof Artwork.create;
  Artwork.findOneAndUpdate = mutate as unknown as typeof Artwork.findOneAndUpdate;
  Artwork.findOneAndDelete = mutate as unknown as typeof Artwork.findOneAndDelete;
  Workshop.create = mutate as unknown as typeof Workshop.create;
  Workshop.findOneAndUpdate = mutate as unknown as typeof Workshop.findOneAndUpdate;
  Workshop.findOneAndDelete = mutate as unknown as typeof Workshop.findOneAndDelete;
  Expo.findOneAndUpdate = mutate as unknown as typeof Expo.findOneAndUpdate;
});
after(() => {
  User.findById = originals.findUser; User.create = originals.createUser;
  Artwork.create = originals.createArtwork; Artwork.findOneAndUpdate = originals.updateArtwork; Artwork.findOneAndDelete = originals.deleteArtwork;
  Workshop.create = originals.createWorkshop; Workshop.findOneAndUpdate = originals.updateWorkshop; Workshop.findOneAndDelete = originals.deleteWorkshop;
  Artist.create = originals.createArtist; Artist.findOneAndUpdate = originals.updateArtist; Artist.findOneAndDelete = originals.deleteArtist;
  Expo.findOneAndUpdate = originals.updateExpo;
});

for (const [method, path] of routes) {
  test(method.toUpperCase() + ' ' + path + ': guest 401, visitor 403, no mutation', async () => {
    assert.equal((await request(app)[method](path).send({})).status, 401);
    assert.equal((await request(app)[method](path).set('Cookie', 'token=' + token).set('X-CSRF-Token', csrf).send({ role: 'organizador' })).status, 403);
    assert.equal(mutations, 0);
  });
}

test('organizer can write; demotion blocks the same JWT immediately', async () => {
  role = 'organizador';
  const send = () => request(app).post('/api/artists').set('Cookie', 'token=' + token).set('X-CSRF-Token', csrf).send({ id: 'sample' });
  assert.equal((await send()).status, 201);
  role = 'visitante';
  assert.equal((await send()).status, 403);
  assert.equal(mutations, 1);
});

test('legacy user without a role cannot manage', async () => {
  role = undefined;
  assert.equal((await request(app).put('/api/expo').set('Cookie', 'token=' + token).set('X-CSRF-Token', csrf).send({})).status, 403);
});

test('deleted account receives 401', async () => {
  exists = false;
  assert.equal((await request(app).put('/api/expo').set('Cookie', 'token=' + token).set('X-CSRF-Token', csrf).send({})).status, 401);
});

test('organizer still requires CSRF', async () => {
  role = 'organizador';
  assert.equal((await request(app).put('/api/expo').set('Cookie', 'token=' + token).send({})).status, 401);
});

test('signup ignores a supplied organizer role and stores a visitor', async () => {
  let saved: Record<string, unknown> = {};
  User.create = (async (data: Record<string, unknown>) => {
    saved = data;
    return new User(data);
  }) as unknown as typeof User.create;
  const response = await request(app).post('/api/users').send({
    username: 'visitor', email: 'Visitor@Example.com', name: 'Visitante', password: 'long-password-example', role: 'organizador',
  });
  assert.equal(response.status, 201);
  assert.equal(saved.role, 'visitante');
  assert.equal(saved.email, 'visitor@example.com');
  assert.equal(response.body.user.role, 'visitante');
  assert.equal(response.body.user.passwordHash, undefined);
});

test('signup requires a valid email', async () => {
  for (const email of [undefined, '', 'sin-arroba', 'a@b']) {
    const response = await request(app).post('/api/users').send({
      username: 'visitor', email, name: 'Visitante', password: 'long-password-example',
    });
    assert.equal(response.status, 400);
    assert.match(response.body.error, /correo/i);
  }
});

test('signup rejects organizer-domain emails without creating the account', async () => {
  let created = false;
  User.create = (async () => { created = true; }) as unknown as typeof User.create;
  const response = await request(app).post('/api/users').send({
    username: 'colado', email: 'Colado@Admin.Expo.cl', name: 'Colado', password: 'long-password-example',
  });
  assert.equal(response.status, 403);
  assert.match(response.body.error, /organizadores/);
  assert.equal(created, false);
});

test('signup from another site is blocked (login CSRF)', async () => {
  const response = await request(app).post('/api/users')
    .set('Origin', 'https://sitio-malicioso.example')
    .send({ username: 'visitor', email: 'v@example.com', name: 'V', password: 'long-password-example' });
  assert.equal(response.status, 403);
});

test('schema defaults to visitor and rejects unsupported roles', async () => {
  const user = new User({ username: 'ana', name: 'Ana', passwordHash: 'hash' });
  assert.equal(user.role, 'visitante');
  await assert.rejects(new User({ username: 'ana', name: 'Ana', passwordHash: 'hash', role: 'admin' }).validate());
});
