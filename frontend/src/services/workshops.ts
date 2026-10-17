import type { Workshop } from '../types/workshop';
import axiosSecure from '../utils/axiosSecure';

const baseUrl = '/api/workshops';

const getAll = (signal?: AbortSignal): Promise<Workshop[]> =>
  axiosSecure.get<Workshop[]>(baseUrl, { signal }).then(response => response.data);

const register = (id: string): Promise<Workshop> =>
  axiosSecure.post<{ workshop: Workshop }>(`${baseUrl}/${encodeURIComponent(id)}/registrations`)
    .then(response => response.data.workshop);

export default { getAll, register };
