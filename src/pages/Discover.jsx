import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGenres, getTrending, discoverMovies, searchMovies } from '../api/tmdb';

const SORTS = {
  popularity: { label: 'Popularity', tmdb: 'popularity.desc', field: 'popularity' },
  release_date: { label: 'Release Date', tmdb: 'primary_release_date.desc', field: 'release_date' },
  rating: { label: 'Rating', tmdb: 'vote_average.desc', field: 'vote_average' },
};
const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const genreParam = params.get('genre') || '';
  const genreSlugs = genreParam ? genreParam.split(',') : [];
  const minRating = Number(params.get('min_rating') || 0);
  const sort = params.get('sort') || 'popularity';

  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading');
  const [text, setText] = useState(search); // what's typed in the box

  // Update one URL param (remove it if empty)
  const setParam = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      return next;
    }, { replace: true });

  const toggleGenre = (s) => {
    const next = genreSlugs.includes(s) ? genreSlugs.filter((x) => x !== s) : [...genreSlugs, s];
    setParam('genre', next.join(','));
  };

  // Debounce: only update the URL 400ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => setParam('search', text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => { getGenres().then((d) => setGenres(d.genres)); }, []);

  useEffect(() => {
    if (!genres.length) return; // need genre IDs before fetching
    let ignore = false;
    setStatus('loading');
    const ids = genres.filter((g) => genreSlugs.includes(slug(g.name))).map((g) => g.id);

    async function load() {
      if (search) {
        const f = SORTS[sort].field;
        const data = await searchMovies(search);
        return data.results
          .filter((m) => m.vote_average >= minRating)
          .filter((m) => ids.every((id) => m.genre_ids.includes(id)))
          .sort((a, b) => (a[f] < b[f] ? 1 : a[f] > b[f] ? -1 : 0));
      }
      if (!ids.length && !minRating && sort === 'popularity') {
        return (await getTrending()).results;
      }
      const data = await discoverMovies({
        with_genres: ids.join(','), // comma = must match ALL selected genres
        'vote_average.gte': minRating || '',
        'vote_count.gte': sort === 'rating' ? 200 : '', // avoids 10/10 movies with 2 votes
        'primary_release_date.lte': new Date().toISOString().slice(0, 10), // hide unreleased
        sort_by: SORTS[sort].tmdb,
      });
      return data.results;
    }

    load()
      .then((r) => { if (!ignore) { setMovies(r); setStatus('ok'); } })
      .catch(() => { if (!ignore) setStatus('error'); });
    return () => { ignore = true; }; // ignore stale responses
  }, [genres, search, genreParam, minRating, sort]);

  return (
    <main className="page">
      <input
        className="search"
        placeholder="Search movies…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="genres">
        {genres.map((g) => (
          <label key={g.id}>
            <input
              type="checkbox"
              checked={genreSlugs.includes(slug(g.name))}
              onChange={() => toggleGenre(slug(g.name))}
            />{' '}
            {g.name}
          </label>
        ))}
      </div>

      <div className="controls">
        <label>
          Min rating: {minRating.toFixed(1)}{' '}
          <input
            type="range" min="0" max="10" step="0.5" value={minRating}
            onChange={(e) => setParam('min_rating', e.target.value === '0' ? '' : e.target.value)}
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value === 'popularity' ? '' : e.target.value)}
        >
          {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </div>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p className="error">Couldn't load movies. Check your token.</p>}
      {status === 'ok' && movies.length === 0 && <p>No movies match these filters.</p>}

      <div className="grid">
        {movies.map((m) => (
          <article key={m.id} className="card">
            {m.poster_path && (
              <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} />
            )}
            <h3>{m.title}</h3>
            <p>⭐ {m.vote_average.toFixed(1)} · {m.release_date?.slice(0, 4)}</p>
          </article>
        ))}
      </div>
    </main>
  );
}