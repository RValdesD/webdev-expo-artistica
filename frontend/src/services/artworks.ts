import axios from 'axios';
import type { Artwork, ArtworkInput } from '../types/artwork';
import axiosSecure from '../utils/axiosSecure';

const baseUrl = '/api/artworks';

const getAll = (signal?: AbortSignal): Promise<Artwork[]> =>
  axios.get<Artwork[]>(baseUrl, { signal }).then(response => response.data);

const create = (input: ArtworkInput): Promise<void> =>
  axiosSecure.post(baseUrl, input).then(() => undefined);

const update = (id: string, input: ArtworkInput): Promise<void> =>
  axiosSecure.put(`${baseUrl}/${encodeURIComponent(id)}`, input).then(() => undefined);

const remove = (id: string): Promise<void> =>
  axiosSecure.delete(`${baseUrl}/${encodeURIComponent(id)}`).then(() => undefined);

export default { getAll, create, update, remove };
