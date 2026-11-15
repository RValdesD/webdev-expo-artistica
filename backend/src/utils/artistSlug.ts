import { Artist } from '../models/Artist.js';

export function artistSlug(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'artista';
}

// Keep internal IDs unchanged: works, workshops and account ownership use them.
export async function ensureArtistSlug(id: string, name: string): Promise<string> {
  await Artist.init(); // The unique index also protects concurrent registrations.
  const base = artistSlug(name);
  for (let suffix = 1; ; suffix++) {
    const current = await Artist.findOne({ id });
    if (!current) throw new Error('Artista no encontrado.');
    if (current.slug) return current.slug;
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    if (await Artist.exists({ $or: [{ slug }, { id: slug }], id: { $ne: id } })) continue;
    try {
      const updated = await Artist.findOneAndUpdate(
        { id, slug: { $exists: false } }, { $set: { slug } }, { new: true, runValidators: true });
      if (updated?.slug) return updated.slug;
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000
        && 'keyPattern' in error && (error.keyPattern as Record<string, unknown>).slug)) throw error;
    }
  }
}
