// Temas de color de una exposición. La misma lista (solo los valores) está en
// backend/src/models/Exhibition.ts; los colores de cada tema van en styles/themes.css.
export const exhibitionThemes = [
  { value: 'sea', label: 'Clásico (dorado)' },
  { value: 'ocean', label: 'Océano (azul)' },
  { value: 'green', label: 'Bosque (verde)' },
  { value: 'terracotta', label: 'Terracota' },
  { value: 'violet', label: 'Violeta' },
  { value: 'crimson', label: 'Carmesí' },
  { value: 'sand', label: 'Arena' },
  { value: 'mono', label: 'Monocromo' },
] as const;

export type ExhibitionTheme = (typeof exhibitionThemes)[number]['value'];

// Clase CSS que aplica los colores del tema a un bloque y a todo lo que contiene.
export const themeClass = (theme: string | undefined) => `theme--${theme || 'sea'}`;
