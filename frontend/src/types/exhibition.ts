export interface ExhibitionInput {
  title: string;
  heading: string;
  description: string;
  theme: 'sea' | 'green';
  imageUrl: string;
  imageAlt: string;
  caption: string;
  order: number;
  // true: se muestra grande en el inicio. false: va en "Otras exposiciones".
  featured: boolean;
  discipline: string;
  room: string;
  artistId: string;
  // Fechas como texto: "2027-06-12" en el formulario; el backend responde en formato ISO.
  startDate: string;
  endDate: string;
}
export interface Exhibition extends Partial<ExhibitionInput> {
  id: string;
  title: string;
  heading: string;
  description: string;
  theme: 'sea' | 'green';
  imageUrl: string;
  imageAlt: string;
  caption: string;
  order: number;
}
