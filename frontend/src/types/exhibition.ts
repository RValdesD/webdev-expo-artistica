export interface ExhibitionInput {
  title: string;
  heading: string;
  description: string;
  theme: 'sea' | 'green';
  imageUrl: string;
  imageAlt: string;
  caption: string;
  order: number;
}
export interface Exhibition extends ExhibitionInput { id: string }
