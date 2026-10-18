import type { ArtistData } from '../models/Artist.js';

// Fictional demonstration profiles. Add local portrait paths when available.
// Imágenes: fotos de licencia libre de Unsplash (unsplash.com/license), sin rostros
// para no asociar personas reales a perfiles ficticios.
export const sampleArtists: ArtistData[] = [
  {
    id: 'demo-elena-rios',
    name: 'Elena Ríos',
    discipline: 'Pintura',
    bio: 'Perfil ficticio para explorar el sitio. Su práctica pictórica estudia la luz y las huellas del tiempo en espacios cotidianos.\n\nTrabaja con capas de color y superficies que invitan a observar de cerca.',
    imageUrl: 'https://images.unsplash.com/photo-1758522276340-9cd1383f9d64?w=600&h=750&fit=crop&q=80&auto=format',
    isSample: true,
  },
  {
    id: 'demo-tomas-vidal',
    name: 'Tomás Vidal',
    discipline: 'Escultura',
    bio: 'Perfil ficticio para explorar el sitio. Desarrolla composiciones escultóricas centradas en el equilibrio, el volumen y la relación entre los objetos y el espacio.',
    imageUrl: 'https://images.unsplash.com/photo-1422246358533-95dcd3d48961?w=600&h=750&fit=crop&q=80&auto=format',
    isSample: true,
  },
  {
    id: 'demo-ines-soto',
    name: 'Inés Soto',
    discipline: 'Fotografía',
    bio: 'Perfil ficticio para explorar el sitio. Su trabajo fotográfico reúne detalles arquitectónicos, sombras y escenas silenciosas de la ciudad.',
    imageUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&h=750&fit=crop&q=80&auto=format',
    isSample: true,
  },
  
  {
    id: 'demo-lucia-mora',
    name: 'Lucía Mora',
    discipline: 'Pintura e ilustración',
    bio: 'Perfil ficticio. Explora paisajes y arquitectura mediante acuarela.\n\nSu trabajo combina observación y memoria.',
    imageUrl: 'https://images.unsplash.com/photo-1605007623951-d53263481857?w=600&h=750&fit=crop&q=80&auto=format',
    isSample: true,
  },
];
