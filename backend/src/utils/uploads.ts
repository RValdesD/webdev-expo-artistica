import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
export const uploadDirectory = process.env.UPLOAD_DIR ? resolve(process.env.UPLOAD_DIR) : fileURLToPath(new URL('../../uploads/', import.meta.url));
export async function saveImage(buffer: Buffer, userId: string): Promise<string> {
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new Error('Usa una imagen de hasta 5 MB.');
  const image = sharp(buffer, { limitInputPixels: 25000000 });
  const metadata = await image.metadata();
  if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1) throw new Error('Usa JPG, PNG o WebP sin animación.');
  if ((metadata.width ?? 0) < 100 || (metadata.height ?? 0) < 100) throw new Error('La imagen debe medir al menos 100 × 100 píxeles.');
  // Re-encode real pixels and strip metadata; never trust an uploaded filename.
  const output = await image.rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  const filename = `${userId}-${randomUUID()}.webp`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(resolve(uploadDirectory, filename), output, { flag: 'wx' });
  return `/images/uploads/${filename}`;
}
export function ownsImage(value: unknown, userId: string): value is string {
  return typeof value === 'string' && new RegExp(`^/images/uploads/${userId}-[a-f0-9-]{36}\\.webp$`).test(value);
}
