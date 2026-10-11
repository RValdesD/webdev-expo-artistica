import axios from 'axios';
import type { Artist } from '../types/artist';

const baseUrl = '/api/artists';

const getAll = (signal?: AbortSignal): Promise<Artist[]> =>
  axios.get<Artist[]>(baseUrl, { signal }).then(response => response.data);

const getById = (id: string, signal?: AbortSignal): Promise<Artist> =>
  axios
    .get<Artist>(`${baseUrl}/${encodeURIComponent(id)}`, { signal })
    .then(response => response.data);

export default { getAll, getById };
