import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-this-suite';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Artist } = await import('../src/models/Artist.js');

const originalFindOne = User.findOne;
const originalFindById = User.findById;
const originalArtistCreate = Artist.create;
const passwordHash = await bcrypt.hash('correct-password', 4);
const user = {
  id: '507f1f77bcf86cd799439011',
  username: 'ana',
  name: 'Ana',
  role: 'organizador',
  passwordHash,
  toJSON: () => ({ id: '507f1f77bcf86cd799439011', username: 'ana', name: 'Ana' }),
};

before(() => {
  User.findOne = (() => ({ select: async () => user })) as typeof User.findOne;
  User.findById = (async () => user) as unknown as typeof User.findById;
  Artist.create = (async input => input) as typeof Artist.create;
});

after(() => {
  User.findOne = originalFindOne;
  User.findById = originalFindById;
  Artist.create = originalArtistCreate;
});

test('rechaza credenciales incorrectas', async () => {
  const response = await request(app).post('/api/login').send({ username: 'ana', password: 'wrong' });
  assert.equal(response.status, 401);
  assert.match(response.body.error, /incorrectos/i);
});

test('inicia sesión con cookie httpOnly y entrega CSRF', async () => {
  const response = await request(app).post('/api/login').send({ username: 'ana', password: 'correct-password' });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.passwordHash, undefined);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  assert.equal(typeof response.headers['x-csrf-token'], 'string');
});

test('una escritura sin cookie ni CSRF devuelve 401', async () => {
  const response = await request(app).post('/api/artists').send({ id: 'nuevo', name: 'Nueva' });
  assert.equal(response.status, 401);
});

test('una escritura acepta cookie y CSRF coincidentes', async () => {
  const csrf = 'csrf-test';
  const token = jwt.sign({ id: user.id, username: user.username, csrf }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  const response = await request(app)
    .post('/api/artists')
    .set('Cookie', `token=${token}`)
    .set('X-CSRF-Token', csrf)
    .send({ id: 'nueva-artista', name: 'Nueva', bio: 'Bio', discipline: 'Pintura', imageUrl: '', isSample: true });
  assert.equal(response.status, 201);
  assert.equal(response.body.isSample, undefined);
});

test('rechaza un CSRF que no corresponde al JWT', async () => {
  const token = jwt.sign({ id: user.id, username: user.username, csrf: 'correcto' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  const response = await request(app)
    .post('/api/artists')
    .set('Cookie', `token=${token}`)
    .set('X-CSRF-Token', 'incorrecto')
    .send({});
  assert.equal(response.status, 401);
});

test('restaura el usuario desde una sesión válida', async () => {
  const csrf = 'restore-test';
  const token = jwt.sign({ id: user.id, username: user.username, csrf }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  const response = await request(app).get('/api/login/me').set('Cookie', `token=${token}`).set('X-CSRF-Token', csrf);
  assert.equal(response.status, 200);
  assert.equal(response.body.user.username, 'ana');
});

test('logout invalida la cookie del navegador', async () => {
  const csrf = 'logout-test';
  const token = jwt.sign({ id: user.id, username: user.username, csrf }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  const response = await request(app).post('/api/login/logout').set('Cookie', `token=${token}`).set('X-CSRF-Token', csrf);
  assert.equal(response.status, 204);
  assert.match(response.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/);
});
