import axiosSecure from '../utils/axiosSecure';
import type { GuidedTour, GuidedTourInput } from '../types/guidedTour';

const baseUrl = '/api/guided-tours';
const tourUrl = (id: string) => `${baseUrl}/${encodeURIComponent(id)}`;

// Con sesión, cada visita indica si la persona ya la reservó (isBooked).
const getAll = (exhibitionId?: string, signal?: AbortSignal): Promise<GuidedTour[]> =>
  axiosSecure.get<GuidedTour[]>(baseUrl, { params: exhibitionId ? { exhibitionId } : undefined, signal }).then(r => r.data);

const getMine = (signal?: AbortSignal): Promise<GuidedTour[]> =>
  axiosSecure.get<GuidedTour[]>(`${baseUrl}/mine`, { signal }).then(r => r.data);

const book = (id: string): Promise<GuidedTour> => axiosSecure.post<GuidedTour>(`${tourUrl(id)}/bookings`).then(r => r.data);
const cancel = (id: string): Promise<void> => axiosSecure.delete(`${tourUrl(id)}/bookings`).then(() => undefined);
const create = (input: GuidedTourInput): Promise<GuidedTour> => axiosSecure.post<GuidedTour>(baseUrl, input).then(r => r.data);
const update = (id: string, input: GuidedTourInput): Promise<GuidedTour> => axiosSecure.put<GuidedTour>(tourUrl(id), input).then(r => r.data);
const remove = (id: string): Promise<void> => axiosSecure.delete(tourUrl(id)).then(() => undefined);

export default { getAll, getMine, book, cancel, create, update, remove };
