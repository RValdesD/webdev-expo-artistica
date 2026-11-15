import axios from 'axios';
import axiosSecure from '../utils/axiosSecure';
import type { Exhibition, ExhibitionInput } from '../types/exhibition';
const url = '/api/exhibitions';
// Las fechas vacías no se envían, para que el backend no intente leer "" como fecha.
const body = (input: ExhibitionInput) => ({ ...input, startDate: input.startDate || undefined, endDate: input.endDate || undefined });
export default {
  getAll: (signal?: AbortSignal) => axios.get<Exhibition[]>(url, { signal }).then(r => r.data),
  getOne: (id: string, signal?: AbortSignal) => axios.get<Exhibition>(`${url}/${encodeURIComponent(id)}`, { signal }).then(r => r.data),
  create: (input: ExhibitionInput) => axiosSecure.post(url, body(input)),
  update: (id: string, input: ExhibitionInput) => axiosSecure.put(`${url}/${encodeURIComponent(id)}`, body(input)),
  remove: (id: string) => axiosSecure.delete(`${url}/${encodeURIComponent(id)}`),
};
