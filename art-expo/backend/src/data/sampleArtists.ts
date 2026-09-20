import type { ArtistData } from '../models/Artist.js';

// Fictional demonstration profiles. Add local portrait paths when available.
export const sampleArtists: ArtistData[] = [
  {
    id: 'demo-elena-rios',
    name: 'Elena Ríos',
    discipline: 'Pintura',
    bio: 'Perfil ficticio para explorar el sitio. Su práctica pictórica estudia la luz y las huellas del tiempo en espacios cotidianos.\n\nTrabaja con capas de color y superficies que invitan a observar de cerca.',
    imageUrl: '',
    isSample: true,
  },
  {
    id: 'demo-tomas-vidal',
    name: 'Tomás Vidal',
    discipline: 'Escultura',
    bio: 'Perfil ficticio para explorar el sitio. Desarrolla composiciones escultóricas centradas en el equilibrio, el volumen y la relación entre los objetos y el espacio.',
    imageUrl: '',
    isSample: true,
  },
  {
    id: 'demo-ines-soto',
    name: 'Inés Soto',
    discipline: 'Fotografía',
    bio: 'Perfil ficticio para explorar el sitio. Su trabajo fotográfico reúne detalles arquitectónicos, sombras y escenas silenciosas de la ciudad.',
    imageUrl: '',
    isSample: true,
  },
];
