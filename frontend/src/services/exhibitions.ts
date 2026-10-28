import axios from 'axios';
import axiosSecure from '../utils/axiosSecure';
import type { Exhibition, ExhibitionInput } from '../types/exhibition';
const url = '/api/exhibitions';
export default {
  getAll: (signal?: AbortSignal) => axios.get<Exhibition[]>(url, { signal }).then(r => r.data),
  create: (input: ExhibitionInput) => axiosSecure.post(url, input),
  update: (id: string, input: ExhibitionInput) => axiosSecure.put(`${url}/${encodeURIComponent(id)}`, input),
  remove: (id: string) => axiosSecure.delete(`${url}/${encodeURIComponent(id)}`),
};
