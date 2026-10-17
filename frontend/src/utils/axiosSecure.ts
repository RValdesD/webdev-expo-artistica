import axios from 'axios';

export const CSRF_STORAGE_KEY = 'expo_csrf';

const axiosSecure = axios.create({ withCredentials: true });

axiosSecure.interceptors.request.use(config => {
  const csrf = localStorage.getItem(CSRF_STORAGE_KEY);
  if (csrf) config.headers.set('X-CSRF-Token', csrf);
  return config;
});

export default axiosSecure;
