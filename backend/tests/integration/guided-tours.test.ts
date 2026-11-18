import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'guided-tours-integration-secret';
const { default: app } = await import('../../src/app.js');
const { Exhibition } = await import('../../src/models/Exhibition.js');
const { GuidedTour } = await import('../../src/models/GuidedTour.js');
const { User } = await import('../../src/models/User.js');

let mongo: MongoMemoryServer;
const tokens: Record<'organizer' | 'visitor' | 'other' | 'third', string> = { organizer: '', visitor: '', other: '', third: '' };
const csrf = 'tour-csrf';
const exhibition = { id: 'mares', title: 'Los Grandes Mares', heading: 'Un viaje', order: 0 };
const tour = { exhibitionId: 'mares', date: '2099-03-01T15:00:00Z', durationMinutes: 45, capacity: 2, guide: 'Ana', meetingPoint: 'Hall central' };
const send = (method: 'post' | 'put' | 'delete' | 'get', path: string, who: keyof typeof tokens = 'organizer') =>
  request(app)[method](path).set('Cookie', 'token=' + tokens[who]).set('X-CSRF-Token', csrf);

async function createTour(input: Record<string, unknown> = {}): Promise<string> {
  const response = await send('post', '/api/guided-tours').send({ ...tour, ...input });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.id as string;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'art_expo_tours_test' });
  await Promise.all([Exhibition.init(), GuidedTour.init(), User.init()]);
});
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
beforeEach(async () => {
  await Promise.all([Exhibition.deleteMany({}), GuidedTour.deleteMany({}), User.deleteMany({})]);
  const users = await User.create([
    { username: 'organizer', name: 'Organizer', passwordHash: 'unused', role: 'organizador' },
    { username: 'visitor', name: 'Visitor', passwordHash: 'unused' },
    { username: 'other', name: 'Other', passwordHash: 'unused' },
    { username: 'third', name: 'Third', passwordHash: 'unused' },
  ]);
  for (const user of users) tokens[user.username as keyof typeof tokens] = jwt.sign({ id: user.id, username: user.username, csrf }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  await Exhibition.create(exhibition);
});

test('solo un organizador crea visitas, y solo para exposiciones existentes', async () => {
  assert.equal((await request(app).post('/api/guided-tours').send(tour)).status, 401);
  assert.equal((await send('post', '/api/guided-tours', 'visitor').send(tour)).status, 403);
  const missing = await send('post', '/api/guided-tours').send({ ...tour, exhibitionId: 'no-existe' });
  assert.equal(missing.status, 400);
  assert.ok(missing.body.fields.exhibitionId);
  assert.equal((await send('post', '/api/guided-tours').send({ ...tour, capacity: 0 })).status, 400);
  assert.equal((await send('post', '/api/guided-tours').send({ ...tour, meetingPoint: '' })).status, 400);
  const id = await createTour({ id: 'forjado' });
  assert.notEqual(id, 'forjado');
});

test('la lista pública filtra por exposición y no expone quién reservó', async () => {
  await Exhibition.create({ id: 'otra', title: 'Otra', heading: 'Otra', order: 1 });
  const id = await createTour();
  await createTour({ exhibitionId: 'otra' });
  assert.equal((await send('post', `/api/guided-tours/${id}/bookings`, 'visitor')).status, 201);
  const list = await request(app).get('/api/guided-tours?exhibitionId=mares');
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);
  assert.deepEqual(list.body[0].exhibition, { id: 'mares', title: 'Los Grandes Mares' });
  assert.equal(list.body[0].availablePlaces, 1);
  assert.equal(list.body[0].isBooked, false);
  assert.equal(list.body[0].bookings, undefined);
  assert.equal((await request(app).get('/api/guided-tours')).body.length, 2);
});

test('reservar, ver en Mi visita, no duplicar y cancelar', async () => {
  const id = await createTour();
  const booked = await send('post', `/api/guided-tours/${id}/bookings`, 'visitor');
  assert.equal(booked.status, 201);
  assert.equal(booked.body.isBooked, true);
  assert.equal((await send('post', `/api/guided-tours/${id}/bookings`, 'visitor')).status, 409);
  const mine = await send('get', '/api/guided-tours/mine', 'visitor');
  assert.deepEqual(mine.body.map((item: { id: string }) => item.id), [id]);
  assert.equal(mine.body[0].exhibition.title, 'Los Grandes Mares');
  assert.equal((await send('get', '/api/guided-tours/mine', 'other')).body.length, 0);
  assert.equal((await send('delete', `/api/guided-tours/${id}/bookings`, 'visitor')).status, 204);
  assert.equal((await send('delete', `/api/guided-tours/${id}/bookings`, 'visitor')).status, 404);
  assert.equal((await send('get', '/api/guided-tours/mine', 'visitor')).body.length, 0);
});

test('reservas simultáneas nunca superan los cupos', async () => {
  const id = await createTour({ capacity: 2 });
  const results = await Promise.all((['visitor', 'other', 'third'] as const).map(who => send('post', `/api/guided-tours/${id}/bookings`, who)));
  assert.deepEqual(results.map(result => result.status).sort(), [201, 201, 409]);
  const [saved] = await GuidedTour.find({ id }).select('+bookings').lean();
  assert.equal(saved.bookings.length, 2);
});

test('no se reserva una visita que ya pasó', async () => {
  const id = await createTour({ date: '2001-01-01T12:00:00Z' });
  assert.equal((await send('post', `/api/guided-tours/${id}/bookings`, 'visitor')).status, 409);
});

test('los cupos no bajan de las reservas existentes', async () => {
  const id = await createTour({ capacity: 2 });
  await send('post', `/api/guided-tours/${id}/bookings`, 'visitor');
  await send('post', `/api/guided-tours/${id}/bookings`, 'other');
  const reduced = await send('put', `/api/guided-tours/${id}`).send({ capacity: 1 });
  assert.equal(reduced.status, 400);
  assert.ok(reduced.body.fields.capacity);
  assert.equal((await send('put', `/api/guided-tours/${id}`).send({ capacity: '3' })).status, 400);
  const raised = await send('put', `/api/guided-tours/${id}`).send({ capacity: 3, guide: 'Bruno' });
  assert.equal(raised.status, 200);
  assert.equal(raised.body.availablePlaces, 1);
  assert.equal(raised.body.guide, 'Bruno');
});

test('una exposición con visitas guiadas no se puede borrar', async () => {
  const id = await createTour();
  assert.equal((await send('delete', '/api/exhibitions/mares')).status, 409);
  assert.equal((await send('delete', `/api/guided-tours/${id}`)).status, 204);
  assert.equal((await send('delete', '/api/exhibitions/mares')).status, 204);
});
