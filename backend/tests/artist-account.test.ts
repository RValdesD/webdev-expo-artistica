import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
process.env.JWT_SECRET = 'artist-tests-secret';
process.env.UPLOAD_DIR = await mkdtemp(join(tmpdir(), 'expo-upload-test-'));
const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Artist } = await import('../src/models/Artist.js');
const { Submission } = await import('../src/models/Submission.js');
const { Artwork } = await import('../src/models/Artwork.js');
const originals = { init: Artist.init, findArtist: Artist.findOne, findUser: User.findById, updateUser: User.findByIdAndUpdate, profile: Artist.findOneAndUpdate, exists: Artist.exists, create: Submission.create, review: Submission.findOneAndUpdate, approve: Submission.findByIdAndUpdate, publish: Artwork.updateOne };
const id = '507f1f77bcf86cd799439011'; const csrf = 'artist-csrf';
const token = jwt.sign({ id, username: 'artist', csrf }, process.env.JWT_SECRET, { expiresIn: '1h' });
let role = 'artista'; let profileFilter: unknown; let submitted: Record<string, unknown> | undefined; let published = false; let reviewFilter: unknown; let publishedArtwork: Record<string, unknown> | undefined;
const auth = (req: request.Test) => req.set('Cookie', `token=${token}`).set('X-CSRF-Token', csrf);
beforeEach(() => {
  Artist.init = (async () => Artist) as typeof Artist.init;
  Artist.findOne = (async () => ({ slug: 'artist' })) as unknown as typeof Artist.findOne;
  role = 'artista'; published = false; submitted = undefined; profileFilter = undefined;
  User.findById = (async () => ({ id, role, name: 'Artista' })) as unknown as typeof User.findById;
  User.findByIdAndUpdate = (async () => ({})) as unknown as typeof User.findByIdAndUpdate;
  Artist.findOneAndUpdate = (async (filter: unknown, update: { $set: object }) => { profileFilter = filter; return { ...update.$set, id: `artist-${id}` }; }) as unknown as typeof Artist.findOneAndUpdate;
  Artist.exists = (async () => ({ _id: id })) as unknown as typeof Artist.exists;
  Submission.create = (async (value: Record<string, unknown>) => { submitted = value; return value; }) as unknown as typeof Submission.create;
  Submission.findOneAndUpdate = (async (filter: unknown) => { reviewFilter = filter; return { id, title: 'Obra', artistId: `artist-${id}`, medium: 'Pintura', year: 2026, imageUrl: '/images/test.webp', images: ['/images/test-2.webp', '/images/test-3.webp'] }; }) as unknown as typeof Submission.findOneAndUpdate;
  Submission.findByIdAndUpdate = (async () => ({ status: 'approved' })) as unknown as typeof Submission.findByIdAndUpdate;
  Artwork.updateOne = (async (_filter: unknown, update: { $setOnInsert: Record<string, unknown> }) => { published = true; publishedArtwork = update.$setOnInsert; return {}; }) as unknown as typeof Artwork.updateOne;
});
after(async () => {
  Artist.init = originals.init; Artist.findOne = originals.findArtist;
  User.findById = originals.findUser; User.findByIdAndUpdate = originals.updateUser;
  Artist.findOneAndUpdate = originals.profile; Artist.exists = originals.exists;
  Submission.create = originals.create; Submission.findOneAndUpdate = originals.review; Submission.findByIdAndUpdate = originals.approve; Artwork.updateOne = originals.publish;
  await rm(process.env.UPLOAD_DIR!, { recursive: true, force: true });
});
async function upload() {
  const png = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#335588' } }).png().toBuffer();
  const response = await auth(request(app).post('/api/artist-account/images')).set('Content-Type', 'application/octet-stream').send(png);
  assert.equal(response.status, 201); return response.body.url as string;
}
test('artist role exists but reserved-domain public signup is rejected', async () => {
  assert.equal(new User({ username: 'artist', email: 'a@artista.cl', name: 'A', passwordHash: 'hash', role: 'artista' }).validateSync(), undefined);
  const r = await request(app).post('/api/users').send({ username: 'artist', email: 'a@artista.cl', name: 'A', password: 'password123' });
  assert.equal(r.status, 403);
});
test('anonymous and visitor cannot edit artist profiles', async () => {
  assert.equal((await request(app).put('/api/artist-account/profile').send({})).status, 401);
  role = 'visitante'; assert.equal((await auth(request(app).put('/api/artist-account/profile')).send({})).status, 403);
});
test('artist cannot publish directly or access organizer review', async () => {
  assert.equal((await auth(request(app).post('/api/artworks')).send({})).status, 403);
  assert.equal((await auth(request(app).get('/api/submissions'))).status, 403);
});
test('upload validates actual pixels and re-encodes to owned WebP', async () => {
  const url = await upload(); assert.ok(url.startsWith(`/images/uploads/${id}-`));
  const metadata = await sharp(await readFile(join(process.env.UPLOAD_DIR!, basename(url)))).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal((await auth(request(app).post('/api/artist-account/images')).set('Content-Type', 'application/octet-stream').send(Buffer.from('<svg/>'))).status, 400);
});
test('upload rejects oversized data', async () => {
  const r = await auth(request(app).post('/api/artist-account/images')).set('Content-Type', 'application/octet-stream').send(Buffer.alloc(5 * 1024 * 1024 + 1));
  assert.equal(r.status, 413);
});
test('profile writes ignore supplied ownership and cannot borrow another image', async () => {
  const url = await upload();
  assert.equal((await auth(request(app).put('/api/artist-account/profile')).send({ id: 'someone-else', userId: 'someone-else', name: 'Artist', discipline: 'Art', bio: 'Bio', imageUrl: url })).status, 200);
  assert.deepEqual(profileFilter, { id: `artist-${id}` });
  assert.equal((await auth(request(app).put('/api/artist-account/profile')).send({ name: 'Artist', discipline: 'Art', bio: 'Bio', imageUrl: '/images/uploads/other-user.webp' })).status, 400);
});
test('submission always belongs to current artist and starts pending', async () => {
  const imageUrl = await upload();
  const r = await auth(request(app).post('/api/artist-account/submissions')).send({ title: 'Obra', medium: 'Pintura', year: 2026, imageUrl, userId: 'other', artistId: 'other', status: 'approved' });
  assert.equal(r.status, 201); assert.equal(submitted?.status, 'pending'); assert.equal(submitted?.userId, id); assert.equal(submitted?.artistId, `artist-${id}`); assert.equal(published, false);
});
test('organizer approval publishes a deterministic artwork, rejection does not', async () => {
  role = 'organizador';
  assert.equal((await auth(request(app).post(`/api/submissions/${id}/review`)).send({ decision: 'approved' })).status, 200);
  assert.equal(published, true);
  published = false;
  assert.equal((await auth(request(app).post(`/api/submissions/${id}/review`)).send({ decision: 'rejected' })).status, 200);
  assert.equal(published, false); assert.deepEqual(reviewFilter, { _id: id, status: 'pending' });
});
test('submission accepts several distinct images uploaded by the same artist', async () => {
  const [imageUrl, second, third] = [await upload(), await upload(), await upload()];
  const r = await auth(request(app).post('/api/artist-account/submissions')).send({ title: 'Obra', medium: 'Pintura', year: 2026, imageUrl, images: [second, third] });
  assert.equal(r.status, 201);
  assert.deepEqual(submitted?.images, [second, third]);
});
test('submission rejects extra images that are foreign, repeated, malformed or too many', async () => {
  const imageUrl = await upload(); const second = await upload();
  const send = (images: unknown) => auth(request(app).post('/api/artist-account/submissions')).send({ title: 'Obra', medium: 'Pintura', year: 2026, imageUrl, images });
  for (const images of [[`/images/uploads/other-${'a'.repeat(36)}.webp`], [second, second], [imageUrl], 'nope', [42]]) {
    const r = await send(images);
    assert.equal(r.status, 400, JSON.stringify(images));
    assert.equal(submitted, undefined);
  }
  const many = []; for (let i = 0; i < 11; i += 1) many.push(await upload());
  assert.equal((await send(many)).status, 400);
});
test('approval copies the extra images to the published artwork', async () => {
  role = 'organizador';
  assert.equal((await auth(request(app).post(`/api/submissions/${id}/review`)).send({ decision: 'approved' })).status, 200);
  assert.deepEqual(publishedArtwork?.images, ['/images/test-2.webp', '/images/test-3.webp']);
});
