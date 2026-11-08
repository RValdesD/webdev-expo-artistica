import axios from 'axios';

export function apiError(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; fields?: Record<string, string> }>(error) && typeof error.response?.data.error === 'string') {
    const { error: message, fields } = error.response.data;
    return fields ? [message, ...Object.values(fields)].join(' ') : message;
  }
  return 'No pudimos completar la solicitud. Comprueba la conexión e inténtalo nuevamente.';
}
