import axios from 'axios';

// Solo el mensaje general, sin el detalle de cada campo (los formularios lo muestran junto al campo).
export function apiMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error) && typeof error.response?.data.error === 'string') {
    return error.response.data.error;
  }
  return apiError(error);
}

// Errores por campo que manda el backend: { fields: { title: 'Este campo es obligatorio.' } }.
export function apiFields(error: unknown): Record<string, string> {
  if (axios.isAxiosError<{ fields?: unknown }>(error)) {
    const fields = error.response?.data?.fields;
    if (fields && typeof fields === 'object') {
      return Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
    }
  }
  return {};
}

export function apiError(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; fields?: Record<string, string> }>(error) && typeof error.response?.data.error === 'string') {
    const { error: message, fields } = error.response.data;
    return fields ? [message, ...Object.values(fields)].join(' ') : message;
  }
  return 'No pudimos completar la solicitud. Comprueba la conexión e inténtalo nuevamente.';
}
