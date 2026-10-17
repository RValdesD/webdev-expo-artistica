import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../dist/auth/passwords.js';
import { parseSignup, parseCredentials } from '../dist/auth/validation.js';
import { trustedWrite } from '../dist/auth/guards.js';
import { optionalClient, requireClient, startSession, endSession, tokenHash } from '../dist/auth/sessions.js';
import { ClientSession } from '../dist/models/ClientSession.js';
import { Client } from '../dist/models/Client.js';
import { Workshop } from '../dist/models/Workshop.js';
import { Artist } from '../dist/models/Artist.js';
import { registerForWorkshop } from '../dist/controllers/workshopsController.js';
import { signup, login } from '../dist/controllers/authController.js';

function response(client = null) {
  return {
    locals: { client }, code: 200, payload: null, cookies: [], headers: {},
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
    end() { return this; },
    setHeader(name, value) { this.headers[name] = value; },
    clearCookie(name, options) { this.cleared = { name, options }; },
    cookie(name, value, options) { this.cookies.push({ name, value, options }); },
  };
}

test('passwords use distinct salts, verify correctly and reject incorrect/malformed values', async () => {
  const password = 'A long sample passphrase 42';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect password', first), false);
  assert.equal(await verifyPassword(password, 'broken'), false);
});

test('signup normalizes email, preserves password, rejects bad input and excludes role escalation', () => {
  const parsed = parseSignup({ name: ' Ana ', email: ' ANA@EXAMPLE.COM ', password: '  long passphrase here  ', role: 'organizer' });
  assert.deepEqual(parsed, { name: 'Ana', email: 'ana@example.com', password: '  long passphrase here  ' });
  assert.equal(parseSignup({ name: 'Ana', email: 'a@example.com', password: 'short' }), null);
  assert.equal(parseCredentials({ email: { $ne: null }, password: 'long password' }), null);
  assert.equal(parseCredentials(null), null);
});

test('write guard requires an allowlisted origin and custom header', () => {
  const previous = process.env.APP_ORIGINS;
  process.env.APP_ORIGINS = 'http://localhost:5173';
  try {
    for (const headers of [ {}, { Origin: 'https://other.example', 'X-Expo-Request': '1' }, { Origin: 'http://localhost:5173' } ]) {
      const res = response();
      trustedWrite({ get: name => headers[name] }, res, () => assert.fail('Must reject'));
      assert.equal(res.code, 403);
    }
    let passed = false;
    trustedWrite({ get: name => ({ Origin: 'http://localhost:5173', 'X-Expo-Request': '1' })[name] }, response(), () => { passed = true; });
    assert.equal(passed, true);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGINS;
    else process.env.APP_ORIGINS = previous;
  }
});

test('signup uses a fixed client role and handles duplicate email', async t => {
  t.mock.method(Client, 'init', async () => {});
  let stored;
  t.mock.method(Client, 'create', async value => { stored = value; });
  const res = response();
  await signup({ body: { name: 'Ana', email: 'a@example.com', password: 'long sample phrase 123', role: 'admin' } }, res, error => { throw error; });
  assert.equal(res.code, 201);
  assert.equal(stored.role, 'client');
  assert.equal('password' in stored, false);
  assert.ok(stored.passwordHash.startsWith('scrypt-v1:'));
  t.mock.method(Client, 'create', async () => { throw { code: 11000 }; });
  const duplicate = response();
  await signup({ body: { name: 'Ana', email: 'a@example.com', password: 'long sample phrase 123' } }, duplicate, error => { throw error; });
  assert.equal(duplicate.code, 409);
});

test('login failure is generic and creates no session', async t => {
  t.mock.method(Client, 'findOne', () => ({ select: async () => null }));
  const res = response();
  await login({ body: { email: 'unknown@example.com', password: 'wrong password' } }, res, error => { throw error; });
  assert.equal(res.code, 401);
  assert.equal(res.cookies.length, 0);
});

test('successful login returns a public Client and creates a session', async t => {
  const passwordHash = await hashPassword('sample passphrase for login');
  t.mock.method(Client, 'findOne', () => ({ select: async () => ({
    _id: 'stored-id', id: 'stored-id', name: 'Ana', email: 'ana@example.com', role: 'client', passwordHash,
  }) }));
  t.mock.method(ClientSession, 'create', async () => {});
  const res = response();
  await login({ headers: {}, body: { email: 'ana@example.com', password: 'sample passphrase for login' } }, res, error => { throw error; });
  assert.equal(res.code, 200);
  assert.equal(res.payload.client.id, 'stored-id');
  assert.equal('passwordHash' in res.payload.client, false);
  assert.equal(res.cookies.length, 1);
});

test('session token is hashed in storage, rotated and revoked on logout', async t => {
  const old = 'a'.repeat(64);
  let stored;
  const revoked = [];
  t.mock.method(ClientSession, 'deleteOne', async filter => { revoked.push(filter); });
  t.mock.method(ClientSession, 'create', async value => { stored = value; });
  const res = response();
  await startSession('test-client-id', { headers: { cookie: `expo_session=${old}` } }, res);
  const issued = res.cookies[0];
  assert.notEqual(issued.value, old);
  assert.equal(issued.options.httpOnly, true);
  assert.equal(issued.options.sameSite, 'lax');
  assert.equal(stored.tokenHash, tokenHash(issued.value));
  assert.notEqual(stored.tokenHash, issued.value);
  assert.equal(revoked[0].tokenHash, tokenHash(old));
  await endSession({ headers: { cookie: `expo_session=${issued.value}` } }, res);
  assert.equal(revoked[1].tokenHash, stored.tokenHash);
});

test('expired/unknown session has no identity; protected requests return 401', async t => {
  let query;
  t.mock.method(ClientSession, 'findOne', async filter => { query = filter; return null; });
  const res = response();
  await optionalClient({ headers: { cookie: `expo_session=${'b'.repeat(64)}` } }, res, error => { if (error) throw error; });
  assert.ok(query.expiresAt.$gt instanceof Date);
  assert.equal(res.locals.client, null);
  requireClient({}, res, () => assert.fail('Must reject'));
  assert.equal(res.code, 401);
});

test('workshop registration uses session identity, not submitted identity; hides private data', async t => {
  const client = { id: 'client-a', name: 'Ana', email: 'ana@example.com', role: 'client' };
  let filter;
  let update;
  t.mock.method(Workshop, 'findOneAndUpdate', (query, change) => {
    filter = query; update = change;
    return { select: () => ({ lean: async () => ({
      id: 'workshop', title: 'Workshop', description: '', artistId: 'artist', date: new Date('2030-01-01'),
      durationMinutes: 60, location: 'Room', capacity: 1, isSample: true,
      registrations: [change.$push.registrations],
    }) }) };
  });
  t.mock.method(Artist, 'findOne', () => ({ lean: async () => ({ name: 'Artist' }) }));
  const res = response(client);
  await registerForWorkshop({ params: { id: 'workshop' }, body: { clientId: 'client-b', name: 'Other', email: 'other@example.com' } }, res, error => { throw error; });
  assert.equal(update.$push.registrations.clientId, client.id);
  assert.equal(update.$push.registrations.email, client.email);
  assert.equal(filter['registrations.clientId'].$ne, client.id);
  assert.ok(filter.$expr.$lt);
  assert.ok(filter.date.$gt instanceof Date);
  assert.equal(res.code, 201);
  assert.equal(res.payload.workshop.isRegistered, true);
  assert.equal(res.payload.workshop.availablePlaces, 0);
  assert.equal(JSON.stringify(res.payload).includes(client.email), false);
  assert.equal('registrations' in res.payload.workshop, false);
});

test('unavailable or duplicate workshop registration returns conflict', async t => {
  t.mock.method(Workshop, 'findOneAndUpdate', () => ({ select: () => ({ lean: async () => null }) }));
  t.mock.method(Workshop, 'exists', async () => ({ _id: 'workshop' }));
  const res = response({ id: 'a', name: 'Ana', email: 'ana@example.com' });
  await registerForWorkshop({ params: { id: 'workshop' } }, res, error => { throw error; });
  assert.equal(res.code, 409);
});
