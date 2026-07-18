import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Error de conexión';
    console.error('[API Error]', message);
    return Promise.reject(err);
  },
);
