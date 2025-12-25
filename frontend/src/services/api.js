import axios from 'axios';

const isLocalHost = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname);

const resolveBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;

  if (envBase) {
    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(envBase);
        // If the env var still points to localhost but the app is served from a
        // public/remote host, use the current host so API calls don't time out.
        if (isLocalHost(parsed.hostname) && !isLocalHost(window.location.hostname)) {
          const fallbackPort = parsed.port || import.meta.env.VITE_API_PORT || '4000';
          return `${window.location.protocol}//${window.location.hostname}:${fallbackPort}`;
        }
      } catch (error) {
        console.warn('Invalid VITE_API_BASE_URL; falling back to window location.', error);
      }
    }
    return envBase;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const explicitPort = import.meta.env.VITE_API_PORT;

    if (isLocalHost(hostname)) {
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
