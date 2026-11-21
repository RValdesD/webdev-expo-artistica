import mongoose from 'mongoose';

// Nombre de cada campo tal como lo ve el usuario en los formularios.
const LABELS: Record<string, string> = {
  id: 'identificador', title: 'título', heading: 'título principal', name: 'nombre', username: 'usuario',
  email: 'correo', password: 'contraseña', artistId: 'artista', medium: 'medio', year: 'año',
  description: 'descripción', bio: 'biografía', discipline: 'disciplina', imageUrl: 'imagen',
  images: 'imágenes', imageAlt: 'descripción de la imagen', caption: 'pie de imagen', theme: 'tema',
  order: 'orden', date: 'fecha', durationMinutes: 'duración', location: 'lugar', capacity: 'cupos',
  room: 'sala', instagram: 'Instagram', website: 'sitio web', behance: 'Behance', pixiv: 'Pixiv', twitter: 'X / Twitter', startDate: 'fecha de inicio', endDate: 'fecha de término', socials: 'redes',
  slug: 'identificador', edition: 'edición', introduction: 'introducción', dateLabel: 'fechas',
  hours: 'horario', venue: 'lugar', address: 'dirección', admission: 'entrada', transport: 'cómo llegar',
  accessibility: 'accesibilidad', faqs: 'preguntas frecuentes',
};

// "images.0" o "faqs.1.answer" -> el campo de primer nivel ("images", "faqs").
// Las redes ("socials.instagram") usan el último tramo ("instagram"), como el formulario de artistas.
export const fieldOf = (path: string) => path.startsWith('socials.') ? path.split('.').pop()! : path.split('.')[0];
export const labelOf = (path: string) => LABELS[fieldOf(path)] ?? fieldOf(path);

// Mensaje en español de un error de un campo de Mongoose.
function messageOf(path: string, error: mongoose.Error.ValidatorError | mongoose.Error.CastError): string {
  if (error instanceof mongoose.Error.CastError) return 'El valor no es válido.';
  const { kind } = error;
  // Mongoose guarda aquí el límite del validador (maxlength, min, …).
  const properties = error.properties as Record<string, unknown> & { message?: unknown };
  // Si el esquema trae su propio mensaje en español (por ejemplo el de las redes), se usa ese.
  const custom = typeof properties.message === 'string' ? properties.message : '';
  if (custom && !/path `|Validator failed|is not a valid enum/i.test(custom)) return custom;
  switch (kind) {
    case 'required': return 'Este campo es obligatorio.';
    case 'maxlength': return `Máximo ${properties.maxlength} caracteres.`;
    case 'minlength': return `Mínimo ${properties.minlength} caracteres.`;
    case 'min': return `Debe ser ${properties.min} o más.`;
    case 'max': return `Debe ser ${properties.max} o menos.`;
    case 'enum': return 'Elige una de las opciones permitidas.';
    case 'regexp': return fieldOf(path) === 'id' || fieldOf(path) === 'artistId'
      ? 'Usa solo minúsculas, números y guiones.' : 'El formato no es válido.';
    default: return 'El valor no es válido.';
  }
}

// { error: 'Revisa los campos.', fields: { title: 'Este campo es obligatorio.', year: '…' } }
export function validationBody(error: mongoose.Error.ValidationError) {
  const fields: Record<string, string> = {};
  // La clave trae el nombre completo ("socials.instagram"); item.path a veces solo el último tramo.
  for (const [path, item] of Object.entries(error.errors)) {
    const field = fieldOf(path);
    fields[field] ??= messageOf(path, item);
  }
  return { error: 'Revisa los campos.', fields };
}

// Índice único repetido (código 11000): dice qué campo y qué valor ya existen.
export function duplicateBody(error: unknown) {
  const keyValue = typeof error === 'object' && error !== null && 'keyValue' in error
    && typeof error.keyValue === 'object' && error.keyValue !== null
    ? error.keyValue as Record<string, unknown> : {};
  const [field, value] = Object.entries(keyValue)[0] ?? [];
  if (!field) return { error: 'Ya existe un registro con esos datos.' };
  return {
    error: `Ya existe un registro con ${labelOf(field)} «${String(value)}».`,
    fields: { [fieldOf(field)]: 'Ya está en uso.' },
  };
}
