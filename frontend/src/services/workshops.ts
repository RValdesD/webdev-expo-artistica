import axios from 'axios';
import type { Workshop, WorkshopRegistration } from '../types/workshop';

const baseUrl = '/api/workshops';

const getAll = (signal?: AbortSignal): Promise<Workshop[]> =>
  axios.get<Workshop[]>(baseUrl, { signal }).then(response => response.data);

const register = (id: string, data: WorkshopRegistration): Promise<Workshop> =>
  axios.post<{ workshop: Workshop }>(`${baseUrl}/${encodeURIComponent(id)}/registrations`, data)
    .then(response => response.data.workshop);

export default { getAll, register };
