import axios from 'axios';
import type { ExpoInformation } from '../types/expo';

const getInformation = (signal?: AbortSignal): Promise<ExpoInformation> =>
  axios.get<ExpoInformation>('/api/expo', { signal }).then(response => response.data);

export default { getInformation };
