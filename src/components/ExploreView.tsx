import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Loader2,
  Disc3,
  Podcast,
  CheckSquare,
  Plus,
  Heart,
  Clock,
} from 'lucide-react';
import type { Track, YouTubeRelease, PodcastShow } from '../types/music';
import { streamResolver } from '../services/streamResolver';
import { youtubeReleaseService } from '../services/youtubeReleaseService';
import { podcastService } from '../services/podcastService';
import { recommendationService } from '../services/recommendationService';
import { useLibrary } from '../context/LibraryContext';
import { TrackRow } from './TrackRow';
import { AlbumDetailModal } from './AlbumDetailModal';
import { PodcastDetailModal } from './PodcastDetailModal';

interface ExploreViewProps {
  initialQuery?: string;
  onAddTrackToPlaylist: (track: Track) => void;
  onAddMultipleToPlaylist: (tracks: Track[]) => void;
}

type SearchFilter = 'all' | 'tracks' | 'albums' | 'podcasts' | 'audius';

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialQuery = '',
  onAddTrackToPlaylist,
  onAddMultipleToPlaylist,
}) => {
  const { addMultipleToLiked } = useLibrary();

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<YouTubeRelease[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastShow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState<string[]>(() =>
    recommendationService.getSearchHistory()
  );

  const [selectedRelease, setSelectedRelease] = useState<YouTubeRelease | null>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastShow | null>(null);

  // Multi-select batch mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const runSearch = useCallback(
    async (term: string, activeFilter: SearchFilter = filter) => {
      const clean = term.trim();
      if (!clean) return;
      setLoading(true);
      setHasSearched(true);
      setPage(1);
      setSelectedIds(new Set());
      recommendationService.recordSearch(clean);
      setHistory(recommendationService.getSearchHistory());

      try {
        const promises: Promise<any>[] = [];
        const wantTracks =
          activeFilter === 'all' || activeFilter === 'tracks' || activeFilter === 'audius';
        const wantAlbums = activeFilter === 'all' || activeFilter === 'albums';
        const wantPodcasts = activeFilter === 'all' || activeFilter === 'podcasts';

        promises.push(
          wantTracks
            ? streamResolver.search(clean, activeFilter === 'audius' ? 'audius' : 'all', 1)
            : Promise.resolve([])
        );
        promises.push(
          wantAlbums ? youtubeReleaseService.searchReleases(clean) : Promise.resolve([])
        );
        promises.push(
          wantPodcasts ? podcastService.searchPodcasts(clean, 12) : Promise.resolve([])
        );

        const [tRes, aRes, pRes] = await Promise.allSettled(promises);
        setTracks(tRes.status === 'fulfilled' ? tRes.value : []);
        setAlbums(aRes.status === 'fulfilled' ? aRes.value : []);
        setPodcasts(pRes.status === 'fulfilled' ? pRes.value : []);
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      runSearch(initialQuery, filter);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query, filter);
  };

  const handleLoadMore = async () => {
    if (!query.trim() || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const more = await streamResolver.search(
        query.trim(),
        filter === 'audius' ? 'audius' : 'all',
        nextPage
      );
      const existing = new Set(tracks.map((t) => t.id));
      const unique = more.filter((t) => !existing.has(t.id));
      setTracks((prev) => [...prev, ...unique]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleSelectTrack = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedTracks = tracks.filter((t) => selectedIds.has(t.id));

  const filterPills: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'Todo' },
    { id: 'tracks', label: 'Canciones' },
    { id: 'albums', label: 'Álbumes' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'audius', label: 'Audius' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca canciones, artistas, álbumes, podcasts o pega un enlace de YouTube..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-[var(--theme-accent)] text-white font-bold text-sm hover:brightness-110 disabled:opacity-50 transition shrink-0 cursor-pointer"
          >
            Buscar
          </button>
        </div>

        {/* Filter Pills + Multi-Select Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {filterPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setFilter(pill.id);
                  if (query.trim()) runSearch(query, pill.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  filter === pill.id
                    ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {tracks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                selectMode
                  ? 'bg-[var(--theme-accent)] text-black border-transparent'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {selectMode ? 'Cancelar selección' : 'Seleccionar varias'}
            </button>
          )}
        </div>
      </form>

      {/* Batch Action Bar */}
      {selectMode && selectedTracks.length > 0 && (
        <div className="sticky top-2 z-20 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--theme-accent)] shadow-xl flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            {selectedTracks.length} seleccionadas
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                addMultipleToLiked(selectedTracks);
                setSelectMode(false);
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5" />
              A Favoritos
            </button>
            <button
              type="button"
              onClick={() => {
                onAddMultipleToPlaylist(selectedTracks);
                setSelectMode(false);
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-accent)] text-black text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir a Lista
            </button>
          </div>
        </div>
      )}

      {/* Search History (when empty) */}
      {!hasSearched && history.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            Búsquedas recientes
          </div>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 12).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  runSearch(term, filter);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-accent)] mb-3" />
          <p className="text-sm font-medium">Buscando en catálogo global...</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div className="space-y-8">
          {/* Albums */}
          {albums.length > 0 && (filter === 'all' || filter === 'albums') && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Disc3 className="w-4 h-4 text-[var(--theme-accent)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Álbumes y Lanzamientos
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
                {albums.slice(0, filter === 'albums' ? 24 : 6).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedRelease(rel)}
                    className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-3">
                      <img
                        src={rel.thumbnail}
                        alt={rel.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      {rel.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {rel.artist} {rel.year ? `· ${rel.year}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Podcasts */}
          {podcasts.length > 0 && (filter === 'all' || filter === 'podcasts') && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Podcast className="w-4 h-4 text-[var(--theme-accent)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">Podcasts</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
                {podcasts.slice(0, filter === 'podcasts' ? 24 : 6).map((show) => (
                  <div
                    key={show.id}
                    onClick={() => setSelectedPodcast(show)}
                    className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-3">
                      <img
                        src={show.artwork}
                        alt={show.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      {show.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {show.author}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tracks */}
          {tracks.length > 0 &&
            (filter === 'all' || filter === 'tracks' || filter === 'audius') && (
              <section>
                <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">
                  Canciones ({tracks.length})
                </h2>
                <div className="space-y-1">
                  {tracks.map((track, idx) => (
                    <TrackRow
                      key={`${track.id}_${idx}`}
                      track={track}
                      index={idx}
                      queue={tracks}
                      onAddToPlaylist={onAddTrackToPlaylist}
                      selectable={selectMode}
                      selected={selectedIds.has(track.id)}
                      onToggleSelect={() => toggleSelectTrack(track.id)}
                    />
                  ))}
                </div>

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 transition cursor-pointer"
                  >
                    {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Cargar más resultados
                  </button>
                </div>
              </section>
            )}

          {tracks.length === 0 && albums.length === 0 && podcasts.length === 0 && (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No se encontraron resultados para «{query}». Prueba con otro término.
            </div>
          )}
        </div>
      )}

      {/* Detail Modals */}
      <AlbumDetailModal
        release={selectedRelease}
        onClose={() => setSelectedRelease(null)}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
      />

      <PodcastDetailModal
        show={selectedPodcast}
        onClose={() => setSelectedPodcast(null)}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
      />
    </div>
  );
};
