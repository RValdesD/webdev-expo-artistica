import axios from 'axios';
import type { Artwork } from '../types/artwork';

const getAll = (signal?: AbortSignal): Promise<Artwork[]> =>
  axios.get<Artwork[]>('/api/artworks', { signal }).then(response => response.data);

export default { getAll };
