import axios from 'axios';

export function apiError(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error) && typeof error.response?.data.error === 'string') {
    return error.response.data.error;
  }
  return 'No pudimos completar la solicitud. Comprueba la conexión e inténtalo nuevamente.';
}
