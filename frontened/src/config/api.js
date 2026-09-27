// frontend/src/config/api.js
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol || 'http:';
    const host = window.location.hostname;
    // When accessing from mobile/other devices on the network, point to the host machine's port 5000
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${protocol}//${host}:5000`;
    }
  }
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
