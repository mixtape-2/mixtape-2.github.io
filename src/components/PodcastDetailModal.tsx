import React, { useEffect, useState } from 'react';
import { X, Play, Pause, Podcast, Bell, BellOff, Loader2, Clock, Plus } from 'lucide-react';
import type { PodcastShow, Track } from '../types/music';
import { podcastService } from '../services/podcastService';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from './TrackRow';

interface PodcastDetailModalProps {
  show: PodcastShow | null;
  onClose: () => void;
  onAddTrackToPlaylist?: (track: Track) => void;
}

export const PodcastDetailModal: React.FC<PodcastDetailModalProps> = ({
  show,
  onClose,
  onAddTrackToPlaylist,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isPodcastFollowed, toggleFollowPodcast } = useLibrary();

  const [episodes, setEpisodes] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    setLoading(true);
    podcastService
      .getPodcastEpisodes(show, 30)
      .then((eps) => {
        if (!cancelled) setEpisodes(eps);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show]);

  if (!show) return null;

  const followed = isPodcastFollowed(show.id);

  const handlePlayEpisode = (ep: Track) => {
    if (currentTrack?.id === ep.id) {
      togglePlay();
      return;
    }
    const saved = podcastService.getEpisodeProgress(ep.id);
    const startSec = saved && saved.currentTime > 5 ? saved.currentTime : undefined;
    playTrack(ep, episodes, false, 'tape', show.title, null, startSec);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/40 shadow-lg shrink-0">
            {show.artwork ? (
              <img src={show.artwork} alt={show.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400">
                <Podcast className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] mb-1.5">
              {show.genre || 'Podcast'}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight">
              {show.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{show.author}</p>

            <div className="flex items-center gap-2 mt-3.5">
              <button
                type="button"
                onClick={() => toggleFollowPodcast(show)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  followed
                    ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] border border-[var(--theme-badge-border)]'
                    : 'bg-[var(--theme-accent)] text-white hover:brightness-110'
                }`}
              >
                {followed ? (
                  <>
                    <BellOff className="w-3.5 h-3.5" />
                    Siguiendo
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Seguir Podcast
                  </>
                )}
              </button>
              {episodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => handlePlayEpisode(episodes[0])}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Último episodio
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Episodes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Loader2 className="w-7 h-7 animate-spin text-purple-400 mb-2" />
              <p className="text-xs font-medium">Cargando episodios...</p>
            </div>
          ) : episodes.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No hay episodios disponibles en este momento.
            </div>
          ) : (
            episodes.map((ep) => {
              const isCurrent = currentTrack?.id === ep.id;
              const prog = podcastService.getEpisodeProgress(ep.id);
              const pct =
                prog && prog.duration > 0
                  ? Math.min(100, Math.round((prog.currentTime / prog.duration) * 100))
                  : 0;
              const dateLabel = ep.releaseDate
                ? new Date(ep.releaseDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';

              return (
                <div
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--theme-badge-bg)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--theme-accent)] text-black shrink-0 mt-0.5 cursor-pointer"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-bold leading-snug ${
                            isCurrent ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {ep.title}
                        </h4>
                        {onAddTrackToPlaylist && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddTrackToPlaylist(ep);
                            }}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
                            title="Añadir a lista"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {ep.podcastDescription && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                          {ep.podcastDescription.replace(/<[^>]+>/g, '')}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono-tech text-[var(--text-muted)]">
                        {dateLabel && <span>{dateLabel}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(ep.duration)}
                        </span>
                        {prog && prog.currentTime > 5 && (
                          <span className="text-[var(--theme-accent)] font-bold">
                            Reanudar en {formatDuration(prog.currentTime)} ({pct}%)
                          </span>
                        )}
                      </div>

                      {pct > 0 && (
                        <div className="h-1 w-full rounded-full bg-[var(--border-strong)] overflow-hidden mt-2">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: 'var(--theme-accent)' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
