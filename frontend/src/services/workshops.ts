import type { Workshop, WorkshopInput } from '../types/workshop';
import axiosSecure from '../utils/axiosSecure';

const baseUrl = '/api/workshops';

const getAll = (signal?: AbortSignal): Promise<Workshop[]> =>
  axiosSecure.get<Workshop[]>(baseUrl, { signal }).then(response => response.data);

const register = (id: string): Promise<Workshop> =>
  axiosSecure.post<{ workshop: Workshop }>(`${baseUrl}/${encodeURIComponent(id)}/registrations`)
    .then(response => response.data.workshop);

const create = (input: WorkshopInput): Promise<void> =>
  axiosSecure.post(baseUrl, input).then(() => undefined);

const update = (id: string, input: WorkshopInput): Promise<void> =>
  axiosSecure.put(`${baseUrl}/${encodeURIComponent(id)}`, input).then(() => undefined);

const remove = (id: string): Promise<void> =>
  axiosSecure.delete(`${baseUrl}/${encodeURIComponent(id)}`).then(() => undefined);

export default { getAll, register, create, update, remove };
