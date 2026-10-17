import axiosSecure from '../utils/axiosSecure';
import type { Workshop } from '../types/workshop';

const getMine = (signal?: AbortSignal): Promise<Workshop[]> =>
  axiosSecure.get<Workshop[]>('/api/registrations/me', { signal }).then(response => response.data);

const cancel = (workshopId: string): Promise<void> =>
  axiosSecure.delete(`/api/workshops/${encodeURIComponent(workshopId)}/registrations`).then(() => undefined);

export default { getMine, cancel };
