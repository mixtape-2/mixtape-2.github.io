import React, { useState, useMemo } from 'react';
import {
  Plus,
  Play,
  Shuffle,
  Heart,
  ListMusic,
  Disc3,
  Podcast,
  ArrowLeft,
  Pencil,
  Trash2,
  Search,
  FileSpreadsheet,
  Gauge,
  Clock,
} from 'lucide-react';
import type { Playlist, PodcastShow, Track } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { tapeProgressService, type TapeProgress } from '../services/tapeProgressService';
import { bpmService } from '../services/bpmService';
import { TrackRow, formatDuration } from './TrackRow';
import { EditPlaylistModal } from './EditPlaylistModal';
import { ResumeTapeModal } from './ResumeTapeModal';
import { PodcastDetailModal } from './PodcastDetailModal';

interface LibraryViewProps {
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  isFavoritesView?: boolean;
  openNewPlaylistModal: () => void;
  openSpotifyCsvModal: () => void;
  openRpmModal: () => void;
  onAddTrackToPlaylist: (track: Track) => void;
}

type LibrarySubTab = 'tapes' | 'vinyls' | 'favorites' | 'podcasts';
type BpmFilter = 'all' | '33' | '45' | '78';

export const LibraryView: React.FC<LibraryViewProps> = ({
  selectedPlaylistId,
  setSelectedPlaylistId,
  isFavoritesView = false,
  openNewPlaylistModal,
  openSpotifyCsvModal,
  openRpmModal,
  onAddTrackToPlaylist,
}) => {
  const {
    playlists,
    likedTracks,
    followedPodcasts,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    reorderLikedTracks,
    removeLikedTrack,
    clearLikedTracks,
  } = useLibrary();

  const { playTrack, playTape } = usePlayer();

  const [subTab, setSubTab] = useState<LibrarySubTab>(isFavoritesView ? 'favorites' : 'tapes');
  const [filterText, setFilterText] = useState('');
  const [bpmFilter, setBpmFilter] = useState<BpmFilter>('all');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{
    playlist: Playlist;
    progress: TapeProgress;
  } | null>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastShow | null>(null);

  const activePlaylist = useMemo(() => {
    if (isFavoritesView || selectedPlaylistId === 'favorites') return null;
    if (!selectedPlaylistId) return null;
    return playlists.find((p) => p.id === selectedPlaylistId) || null;
  }, [playlists, selectedPlaylistId, isFavoritesView]);

  const showingFavoritesDetail = isFavoritesView || selectedPlaylistId === 'favorites';

  const handlePlayPlaylistSmart = (pl: Playlist) => {
    if (pl.tracks.length === 0) return;
    const saved = tapeProgressService.getProgress(pl.id);
    if (saved && saved.currentTime > 5 && saved.trackIndex < pl.tracks.length) {
      setResumePrompt({ playlist: pl, progress: saved });
    } else {
      playTape(pl, 0);
    }
  };

  // DETAIL VIEW (Playlist or Favorites)
  if (activePlaylist || showingFavoritesDetail) {
    const title = showingFavoritesDetail ? 'Canciones Favoritas' : activePlaylist!.name;
    const subtitle = showingFavoritesDetail
      ? 'Tu colección personal de pistas marcadas con corazón'
      : activePlaylist!.description ||
        (activePlaylist!.artist
          ? `${activePlaylist!.artist}${activePlaylist!.year ? ` · ${activePlaylist!.year}` : ''}`
          : 'Lista de reproducción');

    const rawTracks = showingFavoritesDetail ? likedTracks : activePlaylist!.tracks;
    const totalDuration = rawTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

    const filteredTracks = rawTracks.filter((t) => {
      const q = filterText.trim().toLowerCase();
      const matchesText =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album || '').toLowerCase().includes(q);
      if (!matchesText) return false;
      if (bpmFilter === 'all') return true;
      const bpm = t.bpm || bpmService.getTrackBpm(t);
      if (bpmFilter === '33') return bpm <= 95;
      if (bpmFilter === '45') return bpm > 95 && bpm <= 122;
      return bpm > 122;
    });

    const savedProgress = activePlaylist ? tapeProgressService.getProgress(activePlaylist.id) : null;

    return (
      <div className="space-y-6 pb-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            setFilterText('');
            setBpmFilter('all');
            setSelectedPlaylistId(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Biblioteca
        </button>

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-black/30 shadow-xl shrink-0">
            {showingFavoritesDetail ? (
              <div className="w-full h-full bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)]">
                <Heart className="w-14 h-14 fill-current" />
              </div>
            ) : activePlaylist!.coverUrl || activePlaylist!.tracks[0]?.thumbnail ? (
              <img
                src={activePlaylist!.coverUrl || activePlaylist!.tracks[0]?.thumbnail}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <ListMusic className="w-12 h-12" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-accent)]">
              {showingFavoritesDetail
                ? 'Favoritos'
                : activePlaylist!.mediaType === 'vinyl'
                ? 'Álbum'
                : 'Playlist'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
            <p className="text-xs font-mono-tech text-[var(--text-muted)] mt-2">
              {rawTracks.length} pistas · {formatDuration(totalDuration)}
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                type="button"
                disabled={rawTracks.length === 0}
                onClick={() => {
                  if (showingFavoritesDetail) {
                    playTrack(rawTracks[0], rawTracks);
                  } else {
                    handlePlayPlaylistSmart(activePlaylist!);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--theme-accent)] text-black font-bold text-xs hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {savedProgress ? 'Reproducir / Reanudar' : 'Reproducir'}
              </button>

              <button
                type="button"
                disabled={rawTracks.length === 0}
                onClick={() => {
                  const albumCover =
                    activePlaylist?.mediaType === 'vinyl' ? activePlaylist.coverUrl : undefined;
                  const prepared = albumCover
                    ? rawTracks.map((t) => ({ ...t, thumbnail: albumCover }))
                    : rawTracks;
                  const shuffled = [...prepared].sort(() => Math.random() - 0.5);
                  playTrack(shuffled[0], shuffled);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 transition cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Aleatorio
              </button>

              {activePlaylist && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingPlaylist(activePlaylist)}
                    className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                    title="Editar lista"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la lista "${activePlaylist.name}"?`)) {
                        deletePlaylist(activePlaylist.id);
                        setSelectedPlaylistId(null);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-rose-400 transition cursor-pointer"
                    title="Eliminar lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {showingFavoritesDetail && likedTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Vaciar todas las canciones favoritas?')) {
                      clearLikedTracks();
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Filter & BPM Range Pills */}
        {rawTracks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filtrar canciones en esta lista..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Todos BPM' },
                  { id: '33', label: 'Relax ≤95' },
                  { id: '45', label: 'Groove 96-122' },
                  { id: '78', label: 'Turbo ≥123' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBpmFilter(b.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    bpmFilter === b.id
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tracklist */}
        {filteredTracks.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">
            {rawTracks.length === 0
              ? 'Esta lista todavía no tiene canciones.'
              : 'No hay pistas que coincidan con el filtro actual.'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTracks.map((track, idx) => {
              const isUnfiltered = !filterText.trim() && bpmFilter === 'all';
              const trackWithBpm = track.bpm ? track : { ...track, bpm: bpmService.getTrackBpm(track) };
              return (
                <TrackRow
                  key={`${track.id}_${idx}`}
                  track={trackWithBpm}
                  index={idx}
                  queue={filteredTracks}
                  showBpm
                  onPlay={() =>
                    showingFavoritesDetail
                      ? playTrack(track, filteredTracks)
                      : playTape(activePlaylist!, isUnfiltered ? idx : 0)
                  }
                  onAddToPlaylist={onAddTrackToPlaylist}
                  onRemove={() =>
                    showingFavoritesDetail
                      ? removeLikedTrack(track.id)
                      : removeTrackFromPlaylist(activePlaylist!.id, track.id)
                  }
                  onMoveUp={
                    isUnfiltered
                      ? () =>
                          showingFavoritesDetail
                            ? reorderLikedTracks(idx, idx - 1)
                            : reorderPlaylistTracks(activePlaylist!.id, idx, idx - 1)
                      : undefined
                  }
                  onMoveDown={
                    isUnfiltered
                      ? () =>
                          showingFavoritesDetail
                            ? reorderLikedTracks(idx, idx + 1)
                            : reorderPlaylistTracks(activePlaylist!.id, idx, idx + 1)
                      : undefined
                  }
                  canMoveUp={idx > 0}
                  canMoveDown={idx < filteredTracks.length - 1}
                />
              );
            })}
          </div>
        )}

        <EditPlaylistModal playlist={editingPlaylist} onClose={() => setEditingPlaylist(null)} />
        <ResumeTapeModal
          isOpen={!!resumePrompt}
          progress={resumePrompt?.progress || null}
          onResume={() => {
            if (resumePrompt) {
              playTape(
                resumePrompt.playlist,
                resumePrompt.progress.trackIndex,
                resumePrompt.progress.currentTime
              );
            }
            setResumePrompt(null);
          }}
          onRestart={() => {
            if (resumePrompt) {
              tapeProgressService.clearProgress(resumePrompt.playlist.id);
              playTape(resumePrompt.playlist, 0, 0);
            }
            setResumePrompt(null);
          }}
          onClose={() => setResumePrompt(null)}
        />
      </div>
    );
  }

  // LIBRARY OVERVIEW
  const tapes = playlists.filter((p) => p.mediaType !== 'vinyl');
  const vinyls = playlists.filter((p) => p.mediaType === 'vinyl');

  const subTabs: { id: LibrarySubTab; label: string; count: number; icon: any }[] = [
    { id: 'tapes', label: 'Listas', count: tapes.length, icon: ListMusic },
    { id: 'vinyls', label: 'Álbumes', count: vinyls.length, icon: Disc3 },
    { id: 'favorites', label: 'Favoritos', count: likedTracks.length, icon: Heart },
    { id: 'podcasts', label: 'Podcasts', count: followedPodcasts.length, icon: Podcast },
  ];

  const renderPlaylistGrid = (items: Playlist[], emptyMsg: string) => {
    if (items.length === 0) {
      return (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-[var(--text-muted)]">
          <p className="text-sm font-medium">{emptyMsg}</p>
          <button
            type="button"
            onClick={openNewPlaylistModal}
            className="mt-3 px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-black font-bold text-xs cursor-pointer"
          >
            + Crear Lista
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {items.map((pl) => {
          const prog = tapeProgressService.getProgress(pl.id);
          return (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30 mb-3">
                {pl.coverUrl || pl.tracks[0]?.thumbnail ? (
                  <img
                    src={pl.coverUrl || pl.tracks[0]?.thumbnail}
                    alt={pl.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    {pl.mediaType === 'vinyl' ? (
                      <Disc3 className="w-10 h-10" />
                    ) : (
                      <ListMusic className="w-10 h-10" />
                    )}
                  </div>
                )}

                {prog && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 text-amber-300 flex items-center gap-1 backdrop-blur-sm">
                    <Clock className="w-2.5 h-2.5" />
                    En curso
                  </span>
                )}

                {pl.tracks.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylistSmart(pl);
                    }}
                    className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 shadow-lg transition-all cursor-pointer"
                    title="Reproducir"
                  >
                    <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  </button>
                )}
              </div>

              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{pl.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {pl.artist ? `${pl.artist} · ` : ''}
                {pl.tracks.length} pistas
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Tu Biblioteca
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openRpmModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            BPM / RPM
          </button>
          <button
            type="button"
            onClick={openSpotifyCsvModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            CSV Spotify
          </button>
          <button
            type="button"
            onClick={openNewPlaylistModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-xs font-bold hover:brightness-110 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Lista
          </button>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className="opacity-70 font-mono-tech">({t.count})</span>
            </button>
          );
        })}
      </div>

      {/* SubTab Content */}
      {subTab === 'tapes' &&
        renderPlaylistGrid(tapes, 'Aún no tienes listas de reproducción creadas.')}

      {subTab === 'vinyls' &&
        renderPlaylistGrid(
          vinyls,
          'Guarda cualquier álbum desde Explorar para verlo aquí.'
        )}

      {subTab === 'favorites' && (
        <div className="space-y-3">
          {likedTracks.length > 0 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => playTrack(likedTracks[0], likedTracks)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-black font-bold text-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Reproducir Favoritos ({likedTracks.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlaylistId('favorites')}
                className="text-xs font-semibold text-[var(--theme-accent)] hover:underline cursor-pointer"
              >
                Ver detalle y filtros BPM →
              </button>
            </div>
          )}
          {likedTracks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
              Pulsa el corazón en cualquier canción para guardarla en Favoritos.
            </div>
          ) : (
            <div className="space-y-1">
              {likedTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queue={likedTracks}
                  onAddToPlaylist={onAddTrackToPlaylist}
                  onRemove={() => removeLikedTrack(track.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'podcasts' &&
        (followedPodcasts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            No sigues ningún podcast todavía. Descubre programas en la pestaña Podcasts.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {followedPodcasts.map((show) => (
              <div
                key={show.id}
                onClick={() => setSelectedPodcast(show)}
                className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                  <img
                    src={show.artwork}
                    alt={show.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {show.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{show.author}</p>
              </div>
            ))}
          </div>
        ))}

      <ResumeTapeModal
        isOpen={!!resumePrompt}
        progress={resumePrompt?.progress || null}
        onResume={() => {
          if (resumePrompt) {
            playTape(
              resumePrompt.playlist,
              resumePrompt.progress.trackIndex,
              resumePrompt.progress.currentTime
            );
          }
          setResumePrompt(null);
        }}
        onRestart={() => {
          if (resumePrompt) {
            tapeProgressService.clearProgress(resumePrompt.playlist.id);
            playTape(resumePrompt.playlist, 0, 0);
          }
          setResumePrompt(null);
        }}
        onClose={() => setResumePrompt(null)}
      />

      <PodcastDetailModal
        show={selectedPodcast}
        onClose={() => setSelectedPodcast(null)}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
      />
    </div>
  );
};
