/** API base: relative in production (same host), absolute in local dev */
export const API_BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

export const APP_NAME = 'Surakhsa Core';
export const APP_TAGLINE = 'Smart Healthcare Emergency Monitoring System';
export const APP_TITLE = `${APP_NAME} - ${APP_TAGLINE}`;
