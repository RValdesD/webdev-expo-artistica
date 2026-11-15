import axios from 'axios';
import axiosSecure from '../utils/axiosSecure';
import type { Artist, ArtistInput } from '../types/artist';

const baseUrl = '/api/artists';

const getAll = (signal?: AbortSignal): Promise<Artist[]> =>
  axios.get<Artist[]>(baseUrl, { signal }).then(response => response.data);

const getById = (id: string, signal?: AbortSignal): Promise<Artist> =>
  axios
    .get<Artist>(`${baseUrl}/${encodeURIComponent(id)}`, { signal })
    .then(response => response.data);

const create = (artist: ArtistInput): Promise<Artist> =>
  axiosSecure.post<Artist>(baseUrl, artist).then(response => response.data);

const update = (id: string, artist: Partial<ArtistInput>): Promise<Artist> =>
  axiosSecure.put<Artist>(`${baseUrl}/${encodeURIComponent(id)}`, artist).then(response => response.data);

const remove = (id: string): Promise<void> =>
  axiosSecure.delete(`${baseUrl}/${encodeURIComponent(id)}`).then(() => undefined);

export default { getAll, getById, create, update, remove };
