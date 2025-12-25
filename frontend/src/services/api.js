import axios from 'axios';

const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const explicitPort = import.meta.env.VITE_API_PORT;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const targetPort = explicitPort || '4000';
      return `${protocol}//${hostname}:${targetPort}`;
    }

    const targetPort = explicitPort ?? port;
    return `${protocol}//${hostname}${targetPort ? `:${targetPort}` : ''}`;
  }

  return 'http://localhost:4000';
};

const api = axios.create({
  baseURL: resolveBaseUrl()
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ccd-auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to attach token', error);
    }
  }
  return config;
});

export default api;
