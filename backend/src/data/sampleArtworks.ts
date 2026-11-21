import type { ArtworkData } from '../models/Artwork.js';

// Fictional examples linked to the demonstration artists from step 2.
// Imágenes: fotos de licencia libre de Unsplash (unsplash.com/license).
// Las imágenes extra (`images`) son recortes de detalle de la misma foto, en frontend/public/images/samples/.
// Están en el slideshow del Catálogo para que no quede vacío en una instalación nueva.

export const sampleArtworks: ArtworkData[] = [
  {
    id: 'demo-ventana',
    images: ['/images/samples/demo-ventana-detalle-1.webp', '/images/samples/demo-ventana-detalle-2.webp'],
    title: 'La ventana quieta',
    artistId: 'demo-elena-rios',
    medium: 'Pintura',
    imageUrl: 'https://images.unsplash.com/photo-1718550849266-affb20320942?w=1000&h=750&fit=crop&q=80&auto=format',
    year: 2025,
    description: 'Obra ficticia: un estudio de luz y color en un espacio cotidiano.',
    inSlideshow: true,
    isSample: true,
  },
  {
    id: 'demo-equilibrio',
    images: ['/images/samples/demo-equilibrio-detalle-1.webp', '/images/samples/demo-equilibrio-detalle-2.webp'],
    title: 'Equilibrio de formas',
    artistId: 'demo-tomas-vidal',
    medium: 'Escultura',
    imageUrl: 'https://images.unsplash.com/photo-1706821856764-4e85de5482d3?w=1000&h=750&fit=crop&q=80&auto=format',
    year: 2024,
    description: 'Obra ficticia: una composición de volúmenes y espacios vacíos.',
    inSlideshow: true,
    isSample: true,
  },
  {
    id: 'demo-pasaje',
    images: ['/images/samples/demo-pasaje-detalle-1.webp', '/images/samples/demo-pasaje-detalle-2.webp'],
    title: 'Pasaje al atardecer',
    artistId: 'demo-ines-soto',
    medium: 'Fotografía',
    imageUrl: 'https://images.unsplash.com/photo-1711104443942-4afd80b80a36?w=1000&h=750&fit=crop&q=80&auto=format',
    year: 2025,
    description: 'Obra ficticia: sombras y detalles arquitectónicos de un pasaje urbano.',
    inSlideshow: true,
    isSample: true,
  },
  {
    id: 'demo-memoria',
    images: ['/images/samples/demo-memoria-detalle-1.webp', '/images/samples/demo-memoria-detalle-2.webp'],
    title: 'Memoria del jardín',
    artistId: 'demo-elena-rios',
    medium: 'Pintura',
    imageUrl: 'https://images.unsplash.com/photo-1780561928096-fad50d38c41a?w=1000&h=750&fit=crop&q=80&auto=format',
    year: 2026,
    description: 'Obra ficticia: capas de color inspiradas en un jardín imaginario.',
    inSlideshow: true,
    isSample: true,
  },
];
