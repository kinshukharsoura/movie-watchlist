const BASE = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;

async function tmdb(path, params = {}, options = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) url.searchParams.set(k, v);
  });
  const res = await fetch(url, {
    ...options,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(options.body && { 'Content-Type': 'application/json' }),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.status_message || 'TMDB request failed');
  return data;
}

export const getGenres = () => tmdb('/genre/movie/list');
export const getTrending = () => tmdb('/trending/movie/day');
export const discoverMovies = (p) => tmdb('/discover/movie', p);
export const searchMovies = (query) => tmdb('/search/movie', { query });

// Login flow: 3 calls
export const createRequestToken = () => tmdb('/authentication/token/new');
export const validateWithLogin = (username, password, request_token) =>
  tmdb('/authentication/token/validate_with_login', {}, {
    method: 'POST',
    body: JSON.stringify({ username, password, request_token }),
  });
export const createSession = (request_token) =>
  tmdb('/authentication/session/new', {}, {
    method: 'POST',
    body: JSON.stringify({ request_token }),
  });
export const getAccount = (session_id) => tmdb('/account', { session_id });