import axios from 'axios';

const isLocalHost = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname);

const resolveBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  const explicitPort = import.meta.env.VITE_API_PORT || '4000';

  // If we're running the SPA locally (e.g., docker-compose or `npm run dev`),
  // always talk to the local API port, even if the env file contains a remote
  // hostname from a previous deployment.
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:${explicitPort}`;
  }

  if (envBase) {
    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(envBase);
        // If the env var still points to localhost but the app is served from a
        // public/remote host, use the current host so API calls don't time out.
        if (isLocalHost(parsed.hostname) && !isLocalHost(window.location.hostname)) {
          const fallbackPort = parsed.port || explicitPort;
          return `${window.location.protocol}//${window.location.hostname}:${fallbackPort}`;
        }
      } catch (error) {
        console.warn('Invalid VITE_API_BASE_URL; falling back to window location.', error);
      }
    }
    return envBase;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${explicitPort}`;
  }

  return `http://localhost:${explicitPort}`;
};

const resolvedBaseUrl = resolveBaseUrl();
console.info('[API] Using base URL:', resolvedBaseUrl);

const api = axios.create({
  baseURL: resolvedBaseUrl
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
