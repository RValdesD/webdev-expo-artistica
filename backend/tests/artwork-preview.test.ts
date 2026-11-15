import test from 'node:test';
import assert from 'node:assert/strict';
import { Artwork } from '../src/models/Artwork.js';
const base = { id: 'obra-test', title: 'Obra', artistId: 'artista', medium: 'Pintura', year: 2026 };
test('existing artworks are not automatically published in the slideshow', () => {
  const artwork = new Artwork(base);
  assert.equal(artwork.inSlideshow, false);
  assert.equal(artwork.previewImageUrl, '');
  assert.equal(artwork.validateSync(), undefined);
});
test('preview and slideshow selection are independent from the main image', () => {
  const artwork = new Artwork({ ...base, imageUrl: '/images/full.jpg', previewImageUrl: '/images/preview.jpg', inSlideshow: true });
  assert.equal(artwork.validateSync(), undefined);
  assert.equal(artwork.toObject().previewImageUrl, '/images/preview.jpg');
  assert.equal(artwork.toObject().inSlideshow, true);
  assert.ok(new Artwork({ ...base, previewImageUrl: 'javascript:alert(1)' }).validateSync()?.errors.previewImageUrl);
});
