const TOKEN_KEY = 'astro-world-token';

/** Read the stored auth token (browser only). */
export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

/** Authorization header for authenticated API requests. */
export function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getAuthToken()}`, ...extra };
}
