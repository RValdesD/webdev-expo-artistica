// Error de un campo, mostrado justo debajo del campo que falló.
export type FieldErrors = Record<string, string>;

// Atributos para el campo: lo marca como inválido y lo une a su mensaje (lectores de pantalla).
export function fieldProps(fields: FieldErrors, name: string, id: string) {
  return fields[name]
    ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` }
    : {};
}

export default function FieldError({ fields, name, id }: { fields: FieldErrors; name: string; id: string }) {
  if (!fields[name]) return null;
  // role="alert": el lector de pantalla lo lee apenas aparece.
  return <p className="field-error" id={`${id}-error`} role="alert">{fields[name]}</p>;
}
