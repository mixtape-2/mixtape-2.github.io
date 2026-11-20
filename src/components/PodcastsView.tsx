import React, { useState, useEffect } from 'react';
import { Search, Podcast, Loader2, X, Sparkles } from 'lucide-react';
import type { PodcastShow, Track } from '../types/music';
import { podcastService } from '../services/podcastService';
import { useLibrary } from '../context/LibraryContext';
import { PodcastDetailModal } from './PodcastDetailModal';

interface PodcastsViewProps {
  onAddTrackToPlaylist: (track: Track) => void;
}

const PODCAST_CATEGORIES = [
  { label: 'Destacados', query: 'podcast español' },
  { label: 'Historia', query: 'historia podcast' },
  { label: 'Tecnología', query: 'tecnología inteligencia artificial' },
  { label: 'Ciencia', query: 'ciencia divulgación' },
  { label: 'Música', query: 'música rock historia' },
  { label: 'Comedia', query: 'comedia humor español' },
  { label: 'True Crime', query: 'criminología misterio' },
  { label: 'Deportes', query: 'deportes fútbol podcast' },
];

export const PodcastsView: React.FC<PodcastsViewProps> = ({ onAddTrackToPlaylist }) => {
  const { followedPodcasts } = useLibrary();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(PODCAST_CATEGORIES[0].label);
  const [results, setResults] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShow, setSelectedShow] = useState<PodcastShow | null>(null);

  const search = async (term: string) => {
    setLoading(true);
    try {
      const list = await podcastService.searchPodcasts(term, 20);
      setResults(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search(PODCAST_CATEGORIES[0].query);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveCategory('');
    search(query.trim());
  };

  return (
    <div className="space-y-7 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Podcasts
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Miles de programas con reanudación automática por episodio
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar podcasts por título, tema o autor..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-[var(--theme-accent)] text-white font-bold text-sm hover:brightness-110 transition cursor-pointer"
        >
          Buscar
        </button>
      </form>

      {/* Followed Podcasts Shelf */}
      {followedPodcasts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Podcast className="w-4 h-4 text-[var(--theme-accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Tus Podcasts Seguidos ({followedPodcasts.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {followedPodcasts.map((show) => (
              <div
                key={show.id}
                onClick={() => setSelectedShow(show)}
                className="group p-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2">
                  <img
                    src={show.artwork}
                    alt={show.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {show.title}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {show.author}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Chips */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Explorar categorías</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {PODCAST_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => {
                setActiveCategory(cat.label);
                setQuery('');
                search(cat.query);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeCategory === cat.label
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-purple-400 mb-2" />
            <p className="text-xs font-medium">Cargando podcasts...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">
            No se encontraron podcasts para esta búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {results.map((show) => (
              <div
                key={show.id}
                onClick={() => setSelectedShow(show)}
                className="group p-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                  <img
                    src={show.artwork}
                    alt={show.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {show.title}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {show.author}
                </p>
                {show.genre && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                    {show.genre}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <PodcastDetailModal
        show={selectedShow}
        onClose={() => setSelectedShow(null)}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
      />
    </div>
  );
};
