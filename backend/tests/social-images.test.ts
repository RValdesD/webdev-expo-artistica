import test from 'node:test';
import assert from 'node:assert/strict';
import { Artist } from '../src/models/Artist.js';
const artist = (socialImages?: Record<string, string>) => new Artist({
  id: 'test-social', name: 'Artista', discipline: 'Pintura', bio: 'Biografía',
  socials: { instagram: 'https://instagram.com/artista' }, socialImages,
});
test('existing artists keep their social links without custom images', () => {
  const value = artist();
  assert.equal(value.validateSync(), undefined);
  assert.equal(value.socials?.instagram, 'https://instagram.com/artista');
});
test('custom social images accept local images, HTTPS, and clearing a value', () => {
  const value = artist({ instagram: '/images/instagram.png', website: 'https://example.com/logo.png', twitter: '' });
  assert.equal(value.validateSync(), undefined);
  assert.equal(value.toObject().socialImages?.instagram, '/images/instagram.png');
});
test('custom social images reject executable, protocol-relative and malformed URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/icon.png', 'https://', 'https://user:pass@example.com/icon.png']) {
    assert.ok(artist({ instagram: url }).validateSync()?.errors['socialImages.instagram'], url);
  }
});
