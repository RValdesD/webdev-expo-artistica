import axiosSecure from '../utils/axiosSecure';

// Subida de imágenes de un artista: el servidor las valida, las convierte a WebP
// y devuelve su URL (/images/uploads/...). Mismos límites que valida el backend.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Mensaje de error si el archivo no sirve, o '' si se puede subir.
export function imageFileError(file: File): string {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES
    ? '' : `«${file.name}»: selecciona JPG, PNG o WebP de hasta 5 MB.`;
}

export const uploadArtistImage = (file: File): Promise<string> =>
  axiosSecure.post<{ url: string }>('/api/artist-account/images', file, { headers: { 'Content-Type': 'application/octet-stream' } })
    .then(response => response.data.url);
