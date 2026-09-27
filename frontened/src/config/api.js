// frontend/src/config/api.js
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol || 'http:';
    const host = window.location.hostname;

    // 1. If running live on Vercel or any HTTPS cloud domain, use same origin (serverless function)
    if (protocol === 'https:' || host.includes('vercel.app')) {
      return ''; // Calls /analytics, /shorten directly on current Vercel domain
    }

    // 2. If running locally on phone/other devices on Wi-Fi (e.g. 192.168.x.x)
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${protocol}//${host}:5000`;
    }
  }

  // 3. Default local development on PC
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
