import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'isolated-integration-tests-secret';
const { default: app } = await import('../../src/app.js');
const { Artist } = await import('../../src/models/Artist.js');
const { Artwork } = await import('../../src/models/Artwork.js');
const { Workshop } = await import('../../src/models/Workshop.js');
const { User } = await import('../../src/models/User.js');
const { Expo } = await import('../../src/models/expo.js');
const { sampleExpo } = await import('../../src/data/sampleExpo.js');
let mongo: MongoMemoryServer;
let organizer: string;
let visitor: string;
let other: string;
let visitorId: string;
const csrf = 'test-csrf';
const artist = { id: 'artist', name: 'Artist', bio: 'Biography', discipline: 'Painting' };
const artwork = { id: 'artwork', title: 'Artwork', artistId: 'artist', medium: 'Oil', year: 2026, description: '' };
const workshop = { id: 'workshop', title: 'Workshop', artistId: 'artist', description: 'Learn painting', date: '2099-01-01T12:00:00Z', durationMinutes: 60, location: 'Gallery', capacity: 2 };
const send = (method: 'post'|'put'|'delete'|'get', path: string, token = organizer) =>
  request(app)[method](path).set('Cookie', 'token=' + token).set('X-CSRF-Token', csrf);

before(async () => {
  // Always isolated: never connect to or wipe the user's configured database.
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'art_expo_test' });
  await Promise.all([Artist.init(), Artwork.init(), Workshop.init(), User.init(), Expo.init()]);
});
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
beforeEach(async () => {
  await Promise.all([Artist.deleteMany({}), Artwork.deleteMany({}), Workshop.deleteMany({}), User.deleteMany({}), Expo.deleteMany({})]);
  const users = await User.create([
    { username: 'organizer', name: 'Organizer', passwordHash: 'unused', role: 'organizador' },
    { username: 'visitor', name: 'Visitor', passwordHash: 'unused' },
    { username: 'other', name: 'Other', passwordHash: 'unused' },
  ]);
  [organizer, visitor, other] = users.map(user => jwt.sign({ id: user.id, username: user.username, csrf }, process.env.JWT_SECRET!, { expiresIn: '1h' }));
  visitorId = users[1].id;
  await Artist.create(artist);
  await Expo.create(sampleExpo);
});

for (const [resource, input] of [
  ['artists', { ...artist, id: 'new-artist' }],
  ['artworks', artwork], ['workshops', workshop],
] as const) {
  const path = '/api/' + resource;
  test(resource + ': create, persist, read, update and delete', async () => {
    assert.equal((await send('post', path).send(input)).status, 201);
    assert.equal((await request(app).get(path + '/' + input.id)).body.id, input.id);
    assert.ok((await request(app).get(path)).body.some((item: {id:string}) => item.id === input.id));
    const change = resource === 'artists' ? { name: 'Changed' } : { title: 'Changed' };
    assert.equal((await send('put', path + '/' + input.id).send(change)).status, 200);
    const read = await request(app).get(path + '/' + input.id);
    assert.equal(read.body[resource === 'artists' ? 'name' : 'title'], 'Changed');
    assert.equal((await send('delete', path + '/' + input.id)).status, 204);
    assert.equal((await request(app).get(path + '/' + input.id)).status, 404);
  });
  test(resource + ': duplicate id returns 409', async () => {
    await send('post', path).send(input);
    assert.equal((await send('post', path).send(input)).status, 409);
  });
  test(resource + ': missing required fields return 400', async () => {
    assert.equal((await send('post', path).send({ id: 'missing', artistId: 'artist' })).status, 400);
  });
  for (const method of ['get','put','delete'] as const) {
    test(resource + ': missing ' + method + ' returns 404', async () => {
      assert.equal((await send(method, path + '/absent').send({})).status, 404);
    });
  }
  test(resource + ': invalid update does not persist', async () => {
    await send('post', path).send(input);
    assert.equal((await send('put', path + '/' + input.id).send(resource === 'artists' ? { name: '' } : { title: '' })).status, 400);
    const read = await request(app).get(path + '/' + input.id);
    assert.ok(read.body[resource === 'artists' ? 'name' : 'title']);
  });
  test(resource + ': ignores protected fields on create and update', async () => {
    const created = await send('post', path).send({ ...input, isSample: true, registrations: [{ userId: visitorId }] });
    assert.equal(created.status, 201);
    assert.equal(created.body.isSample, false);
    const updated = await send('put', path + '/' + input.id).send({ isSample: true, registrations: [{ userId: visitorId }] });
    assert.equal(updated.status, 200);
    const read = await request(app).get(path + '/' + input.id);
    assert.equal(read.body.isSample, false);
    if (resource === 'workshops') assert.equal(read.body.availablePlaces, workshop.capacity);
  });
}
for (const resource of ['artworks','workshops']) {
  test(resource + ': invalid artist rejected on create and update', async () => {
    const input = resource === 'artworks' ? artwork : workshop;
    assert.equal((await send('post', '/api/' + resource).send({ ...input, artistId: 'absent' })).status, 400);
    await send('post', '/api/' + resource).send(input);
    assert.equal((await send('put', '/api/' + resource + '/' + input.id).send({ artistId: 'absent' })).status, 400);
    assert.equal((await send('delete', '/api/artists/artist')).status, 409);
  });
}
test('expo GET/PUT persists allowed fields and validates', async () => {
  assert.equal((await request(app).get('/api/expo')).status, 200);
  assert.equal((await send('put', '/api/expo').send({ name: 'Updated', slug: 'forbidden' })).status, 200);
  assert.equal((await Expo.findOne({ slug: 'main' }))?.name, 'Updated');
  assert.equal((await send('put', '/api/expo').send({ name: '' })).status, 400);
  await Expo.deleteMany({});
  assert.equal((await request(app).get('/api/expo')).status, 404);
  assert.equal((await send('put', '/api/expo').send({ name: 'Updated' })).status, 404);
});
test('registration ownership, duplicate rejection and cancellation persist', async () => {
  await Workshop.create(workshop);
  assert.equal((await send('post', '/api/workshops/workshop/registrations', visitor).send({ userId: 'forged' })).status, 201);
  assert.equal((await send('post', '/api/workshops/workshop/registrations', visitor)).status, 409);
  assert.equal((await send('get', '/api/registrations/me', visitor)).body.length, 1);
  assert.equal((await send('get', '/api/registrations/me', other)).body.length, 0);
  assert.equal((await send('delete', '/api/workshops/workshop/registrations', other)).status, 404);
  assert.equal((await Workshop.findOne({ id: 'workshop' }).select('+registrations'))?.registrations[0].userId, visitorId);
  assert.equal((await send('delete', '/api/workshops/workshop/registrations', visitor)).status, 204);
  assert.equal((await send('get', '/api/registrations/me', visitor)).body.length, 0);
});
test('capacity rejects numeric strings and values below enrollment', async () => {
  await Workshop.create(workshop);
  await send('post', '/api/workshops/workshop/registrations', visitor);
  await send('post', '/api/workshops/workshop/registrations', other);
  for (const capacity of [1, '1', 0, 201, null, 1.5]) {
    assert.equal((await send('put', '/api/workshops/workshop').send({ capacity })).status, 400);
  }
  assert.equal((await Workshop.findOne({ id: 'workshop' }))?.capacity, 2);
});
test('concurrent registration and reduction never exceed capacity', async () => {
  await Workshop.create(workshop);
  await send('post', '/api/workshops/workshop/registrations', visitor);
  await Promise.all([
    send('post', '/api/workshops/workshop/registrations', other),
    send('put', '/api/workshops/workshop').send({ capacity: 1 }),
  ]);
  const saved = await Workshop.findOne({ id: 'workshop' }).select('+registrations');
  assert.ok(saved && saved.registrations.length <= saved.capacity);
});
test('simultaneous registrations compete for the last place', async () => {
  await Workshop.create({ ...workshop, capacity: 1 });
  const responses = await Promise.all([visitor, other].map(token => send('post', '/api/workshops/workshop/registrations', token)));
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
});
test('expired cookie can browse workshops but cannot register', async () => {
  await Workshop.create(workshop);
  const expired = jwt.sign({ id: visitorId, username: 'visitor', csrf }, process.env.JWT_SECRET!, { expiresIn: -1 });
  assert.equal((await send('get', '/api/workshops', expired)).status, 200);
  assert.equal((await send('post', '/api/workshops/workshop/registrations', expired)).status, 401);
});
test('malformed JSON and unknown API routes return JSON errors', async () => {
  assert.equal((await request(app).post('/api/users').set('Content-Type', 'application/json').send('{')).status, 400);
  const response = await request(app).get('/api/absent');
  assert.equal(response.status, 404);
  assert.equal(typeof response.body.error, 'string');
});
