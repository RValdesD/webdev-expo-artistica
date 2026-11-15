import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'registered-users-tests';
const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const csrf = 'users-csrf';
const token = jwt.sign({ id: '507f1f77bcf86cd799439011', username: 'admin', csrf }, process.env.JWT_SECRET);
const auth = (r: request.Test) => r.set('Cookie', `token=${token}`).set('X-CSRF-Token', csrf);

test('account directory requires login and current organizer role', async t => {
  assert.equal((await request(app).get('/api/users')).status, 401);
  for (const role of ['visitante', 'artista']) {
    const mock = t.mock.method(User, 'findById', async () => ({ role }));
    assert.equal((await auth(request(app).get('/api/users'))).status, 403);
    mock.mock.restore();
  }
});
test('directory includes explicit safe fields and labels legacy origin unknown', async t => {
  t.mock.method(User, 'findById', async () => ({ role: 'organizador' }));
  const rows = [
    { _id: '1', username: 'admin', name: 'Admin', role: 'organizador', createdVia: 'console', passwordHash: 'NEVER RETURN' },
    { _id: '2', username: 'visitor', name: 'Visitor', email: 'v@example.com', role: 'visitante', createdVia: 'registration' },
    { _id: '3', username: 'legacy', name: 'Legacy', role: 'artista' },
  ];
  t.mock.method(User, 'find', () => ({ select: () => ({ sort: () => ({ lean: async () => rows }) }) }));
  const response = await auth(request(app).get('/api/users'));
  assert.equal(response.status, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.deepEqual(response.body.map((u: { createdVia: string }) => u.createdVia), ['console', 'registration', 'unknown']);
  assert.equal(JSON.stringify(response.body).includes('passwordHash'), false);
  assert.deepEqual(Object.keys(response.body[0]).sort(), ['createdVia', 'id', 'name', 'role', 'username']);
});
test('public registration forces its origin and visitor role', async t => {
  let saved: Record<string, unknown> | undefined;
  t.mock.method(User, 'create', async (value: Record<string, unknown>) => { saved = value; return { username: value.username }; });
  const response = await request(app).post('/api/users').send({ username: 'newvisitor', email: 'visitor@example.com', name: 'Visitor', password: 'example-password', createdVia: 'console', role: 'organizador' });
  assert.equal(response.status, 201);
  assert.equal(saved?.createdVia, 'registration');
  assert.equal(saved?.role, 'visitante');
});
