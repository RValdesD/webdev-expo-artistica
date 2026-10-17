import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'registration-tests-use-a-long-secret-value';

const { default: app } = await import('../src/app.js');
const { Workshop } = await import('../src/models/Workshop.js');
const { Artist } = await import('../src/models/Artist.js');

const userId = '507f1f77bcf86cd799439011';
const csrf = 'registration-csrf';
const token = jwt.sign({ id: userId, username: 'ana', csrf }, process.env.JWT_SECRET!, { expiresIn: '1h' });
const auth = (method: 'get' | 'delete', path: string) =>
  request(app)[method](path).set('Cookie', `token=${token}`).set('X-CSRF-Token', csrf);

const registrationWorkshop = {
  id: 'demo-acuarela',
  title: 'Luz y color en acuarela',
  description: 'Descripción',
  artistId: 'demo-elena-rios',
  date: new Date('2027-06-12T18:00:00.000Z'),
  durationMinutes: 90,
  location: 'Sala A',
  capacity: 12,
  isSample: true,
  registrations: [{ userId, name: 'Ana', username: 'ana' }],
};

const originalWorkshopFind = Workshop.find;
const originalWorkshopUpdate = Workshop.findOneAndUpdate;
const originalWorkshopExists = Workshop.exists;
const originalArtistFind = Artist.find;
let updateResult: object | null = registrationWorkshop;

before(() => {
  Workshop.find = (() => ({
    select: () => ({ sort: () => ({ lean: async () => [registrationWorkshop] }) }),
  })) as unknown as typeof Workshop.find;
  Workshop.findOneAndUpdate = (async () => updateResult) as unknown as typeof Workshop.findOneAndUpdate;
  Workshop.exists = (async () => ({ _id: 'workshop-id' })) as unknown as typeof Workshop.exists;
  Artist.find = (() => ({
    select: () => ({ lean: async () => [{ id: 'demo-elena-rios', name: 'Elena Ríos' }] }),
  })) as unknown as typeof Artist.find;
});

after(() => {
  Workshop.find = originalWorkshopFind;
  Workshop.findOneAndUpdate = originalWorkshopUpdate;
  Workshop.exists = originalWorkshopExists;
  Artist.find = originalArtistFind;
});

test('mis inscripciones exige una sesión válida', async () => {
  const response = await request(app).get('/api/registrations/me');
  assert.equal(response.status, 401);
});

test('devuelve solamente los talleres inscritos por el usuario', async () => {
  const response = await auth('get', '/api/registrations/me');
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].id, 'demo-acuarela');
  assert.equal(response.body[0].isRegistered, true);
  assert.equal(response.body[0].artist.name, 'Elena Ríos');
  assert.equal(response.body[0].registrations, undefined);
});

test('cancelar inscripción exige una sesión válida', async () => {
  const response = await request(app).delete('/api/workshops/demo-acuarela/registrations');
  assert.equal(response.status, 401);
});

test('cancela la inscripción del usuario actual', async () => {
  updateResult = registrationWorkshop;
  const response = await auth('delete', '/api/workshops/demo-acuarela/registrations');
  assert.equal(response.status, 204);
});

test('cancelar una inscripción inexistente devuelve 404', async () => {
  updateResult = null;
  const response = await auth('delete', '/api/workshops/demo-acuarela/registrations');
  assert.equal(response.status, 404);
  assert.match(response.body.error, /No estás inscrito/i);
});
