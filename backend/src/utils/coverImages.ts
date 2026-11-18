import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Portadas de las exposiciones: imágenes puestas a mano en frontend/public/images/
// (no en subcarpetas: images/uploads/ son las subidas de los artistas).
// Vite las sirve en desarrollo y las copia a frontend/dist/images/ al compilar,
// así que después de agregar una imagen hay que volver a compilar para producción.
export const coverImagesDirectory = process.env.COVER_IMAGES_DIR
  ? resolve(process.env.COVER_IMAGES_DIR)
  : fileURLToPath(new URL('../../../frontend/public/images/', import.meta.url));

const IMAGE_FILE = /^[\w.-]+\.(avif|gif|jpe?g|png|svg|webp)$/i;
export const COVER_URL = /^\/images\/[\w.-]+\.(avif|gif|jpe?g|png|svg|webp)$/i;

export interface CoverImage { url: string; name: string }

export async function listCoverImages(): Promise<CoverImage[]> {
  try {
    const entries = await readdir(coverImagesDirectory, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && IMAGE_FILE.test(entry.name) && !entry.name.startsWith('.'))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map(name => ({ url: `/images/${name}`, name }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function isCoverImage(url: string): Promise<boolean> {
  return COVER_URL.test(url) && (await listCoverImages()).some(image => image.url === url);
}
