import React, { useEffect, useState } from 'react';
import { X, Play, Disc3, Plus, Loader2, Check, Shuffle } from 'lucide-react';
import type { YouTubeRelease, Track } from '../types/music';
import { youtubeReleaseService } from '../services/youtubeReleaseService';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { TrackRow } from './TrackRow';

interface AlbumDetailModalProps {
  release: YouTubeRelease | null;
  onClose: () => void;
  onAddTrackToPlaylist: (track: Track) => void;
}

export const AlbumDetailModal: React.FC<AlbumDetailModalProps> = ({
  release,
  onClose,
  onAddTrackToPlaylist,
}) => {
  const { playTrack } = usePlayer();
  const { createPlaylist } = useLibrary();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!release) return;
    setSaved(false);
    const applyAlbumCover = (list: Track[]) =>
      list.map((t) => ({
        ...t,
        thumbnail: release.thumbnail || t.thumbnail,
        album: release.title || t.album,
      }));

    if (release.tracks && release.tracks.length > 0) {
      setTracks(applyAlbumCover(release.tracks));
      return;
    }
    let cancelled = false;
    setLoading(true);
    youtubeReleaseService
      .getReleaseDetails(release.id, release)
      .then((res) => {
        if (!cancelled) setTracks(applyAlbumCover(res?.tracks || []));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [release]);

  if (!release) return null;

  const handlePlayAll = (shuffle = false) => {
    if (tracks.length === 0) return;
    const list = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    playTrack(list[0], list, false, 'vinyl', release.title);
  };

  const handleSaveAlbum = () => {
    if (tracks.length === 0) return;
    createPlaylist(
      release.title,
      `Álbum de ${release.artist}${release.year ? ` (${release.year})` : ''}`,
      release.thumbnail,
      'vinyl',
      release.artist,
      release.year,
      tracks
    );
    setSaved(true);
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
        {/* Hero Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-black/40 shadow-lg shrink-0">
            {release.thumbnail ? (
              <img
                src={release.thumbnail}
                alt={release.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <Disc3 className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] mb-1.5">
              {release.type === 'ep' ? 'EP' : release.type === 'single' ? 'Single' : 'Álbum'}
              {release.year ? ` · ${release.year}` : ''}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight">
              {release.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{release.artist}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              <button
                type="button"
                disabled={loading || tracks.length === 0}
                onClick={() => handlePlayAll(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-black font-bold text-xs hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Reproducir
              </button>
              <button
                type="button"
                disabled={loading || tracks.length === 0}
                onClick={() => handlePlayAll(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 transition cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Aleatorio
              </button>
              <button
                type="button"
                disabled={loading || tracks.length === 0 || saved}
                onClick={handleSaveAlbum}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--bg-surface-hover)] disabled:opacity-60 transition cursor-pointer"
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Guardado en Biblioteca
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Guardar Álbum
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--theme-accent)] mb-2" />
              <p className="text-xs font-medium">Cargando pistas del álbum...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No se pudieron cargar las pistas de este lanzamiento.
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queue={tracks}
                  hideThumbnail
                  onPlay={() => playTrack(track, tracks, false, 'vinyl', release.title)}
                  onAddToPlaylist={onAddTrackToPlaylist}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
