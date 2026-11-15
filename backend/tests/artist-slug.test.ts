import test from 'node:test';
import assert from 'node:assert/strict';
import { Artist } from '../src/models/Artist.js';
import { artistSlug, ensureArtistSlug } from '../src/utils/artistSlug.js';
test('name normalization, duplicate suffix and concurrent collision retry', async t => {
  assert.equal(artistSlug('  Juán Caffé! '), 'juan-caffe');
  assert.equal(artistSlug('!!!'), 'artista');
  t.mock.method(Artist, 'init', async () => Artist);
  t.mock.method(Artist, 'findOne', async () => ({ id: 'owned' }));
  t.mock.method(Artist, 'exists', async (query: { $or: { slug?: string }[] }) => query.$or[0].slug === 'juan-caffe');
  const attempts: string[] = [];
  t.mock.method(Artist, 'findOneAndUpdate', async (_query: unknown, update: { $set: { slug: string } }) => {
    attempts.push(update.$set.slug);
    if (attempts.length === 1) throw { code: 11000, keyPattern: { slug: 1 } };
    return update.$set;
  });
  assert.equal(await ensureArtistSlug('owned', 'Juan Caffe'), 'juan-caffe-3');
  assert.deepEqual(attempts, ['juan-caffe-2', 'juan-caffe-3']);
});
test('existing URL is preserved after a name change', async t => {
  t.mock.method(Artist, 'init', async () => Artist);
  t.mock.method(Artist, 'findOne', async () => ({ slug: 'juan-caffe' }));
  assert.equal(await ensureArtistSlug('owned', 'Different Name'), 'juan-caffe');
});
