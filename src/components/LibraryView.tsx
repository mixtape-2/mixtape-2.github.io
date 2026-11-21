import React, { useState, useMemo } from 'react';
import {
  Plus,
  Play,
  Shuffle,
  Heart,
  ListMusic,
  Mic2,
  Disc3,
  Music,
  Podcast,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Search,
  FileSpreadsheet,
  Gauge,
  Clock,
} from 'lucide-react';
import type { AudiobookItem, Playlist, PodcastShow, Track } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { tapeProgressService, type TapeProgress } from '../services/tapeProgressService';
import { bpmService } from '../services/bpmService';
import { TrackRow, formatDuration } from './TrackRow';
import { EditPlaylistModal } from './EditPlaylistModal';
import { ResumeTapeModal } from './ResumeTapeModal';
import { PodcastDetailModal } from './PodcastDetailModal';
import { AudiobookDetailModal } from './AudiobookDetailModal';

interface LibraryViewProps {
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  isFavoritesView?: boolean;
  openNewPlaylistModal: () => void;
  openSpotifyCsvModal: () => void;
  openRpmModal: () => void;
  onAddTrackToPlaylist: (track: Track) => void;
}

type LibrarySection =
  | 'root'
  | 'playlists'
  | 'artists'
  | 'albums'
  | 'songs'
  | 'podcasts'
  | 'audiobooks';
type BpmFilter = 'all' | '33' | '45' | '78';

interface RecentItem {
  key: string;
  kind: 'playlist' | 'album' | 'podcast' | 'audiobook' | 'track';
  title: string;
  subtitle: string;
  artwork?: string;
  timestamp: number;
  playlist?: Playlist;
  podcast?: PodcastShow;
  audiobook?: AudiobookItem;
  track?: Track;
}

interface ArtistEntry {
  name: string;
  photo?: string;
  albums: Playlist[];
  tracks: Track[];
}

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
    savedAudiobooks,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    reorderLikedTracks,
    removeLikedTrack,
    clearLikedTracks,
  } = useLibrary();

  const { playTrack, playTape } = usePlayer();

  const [section, setSection] = useState<LibrarySection>('root');
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [songsSearch, setSongsSearch] = useState('');
  const [bpmFilter, setBpmFilter] = useState<BpmFilter>('all');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{
    playlist: Playlist;
    progress: TapeProgress;
  } | null>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastShow | null>(null);
  const [selectedAudiobook, setSelectedAudiobook] = useState<AudiobookItem | null>(null);

  // Derived collections
  const userPlaylists = useMemo(
    () => playlists.filter((p) => p.mediaType !== 'vinyl'),
    [playlists]
  );

  const savedAlbums = useMemo(
    () =>
      playlists
        .filter((p) => p.mediaType === 'vinyl')
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [playlists]
  );

  const allSongsAlphabetical = useMemo(() => {
    const map = new Map<string, Track>();
    for (const t of likedTracks) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    for (const pl of playlists) {
      const albumCover = pl.mediaType === 'vinyl' ? pl.coverUrl : undefined;
      for (const t of pl.tracks) {
        if (!map.has(t.id)) {
          map.set(t.id, albumCover ? { ...t, thumbnail: albumCover } : t);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })
    );
  }, [likedTracks, playlists]);

  const artistsAlphabetical = useMemo<ArtistEntry[]>(() => {
    const map = new Map<string, ArtistEntry>();

    const ensureArtist = (rawName: string, photo?: string): ArtistEntry => {
      const clean = (rawName || 'Artista desconocido').trim();
      const key = clean.toLowerCase();
      let entry = map.get(key);
      if (!entry) {
        entry = { name: clean, photo, albums: [], tracks: [] };
        map.set(key, entry);
      } else if (!entry.photo && photo) {
        entry.photo = photo;
      }
      return entry;
    };

    for (const alb of savedAlbums) {
      const artistName = alb.artist || alb.tracks[0]?.artist || 'Varios Artistas';
      const photo = alb.coverUrl || alb.tracks[0]?.thumbnail;
      const entry = ensureArtist(artistName, photo);
      entry.albums.push(alb);
    }

    for (const t of allSongsAlphabetical) {
      const entry = ensureArtist(t.artist, t.thumbnail);
      entry.tracks.push(t);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [savedAlbums, allSongsAlphabetical]);

  const podcastsAlphabetical = useMemo(
    () =>
      followedPodcasts
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })),
    [followedPodcasts]
  );

  const audiobooksAlphabetical = useMemo(
    () =>
      savedAudiobooks
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })),
    [savedAudiobooks]
  );

  const recentlyAdded = useMemo<RecentItem[]>(() => {
    const items: RecentItem[] = [];

    for (const pl of playlists) {
      items.push({
        key: `pl_${pl.id}`,
        kind: pl.mediaType === 'vinyl' ? 'album' : 'playlist',
        title: pl.name,
        subtitle:
          pl.mediaType === 'vinyl'
            ? pl.artist || 'Álbum'
            : `Playlist · ${pl.tracks.length} pistas`,
        artwork: pl.coverUrl || pl.tracks[0]?.thumbnail,
        timestamp: pl.updatedAt || pl.createdAt || 0,
        playlist: pl,
      });
    }

    for (const show of followedPodcasts) {
      items.push({
        key: `pod_${show.id}`,
        kind: 'podcast',
        title: show.title,
        subtitle: show.author || 'Podcast',
        artwork: show.artwork,
        timestamp: show.followedAt || 0,
        podcast: show,
      });
    }

    for (const book of savedAudiobooks) {
      items.push({
        key: `ab_${book.id}`,
        kind: 'audiobook',
        title: book.title,
        subtitle: book.author || 'Audiolibro',
        artwork: book.artwork,
        timestamp: book.savedAt || 0,
        audiobook: book,
      });
    }

    likedTracks.forEach((t, idx) => {
      items.push({
        key: `trk_${t.id}`,
        kind: 'track',
        title: t.title,
        subtitle: t.artist,
        artwork: t.thumbnail,
        timestamp: t.addedAt || Date.now() - (idx + 1) * 60_000,
        track: t,
      });
    });

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 20);
  }, [playlists, followedPodcasts, savedAudiobooks, likedTracks]);

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

  // =========================================================================
  // 1. PLAYLIST / ALBUM / FAVORITES DETAIL VIEW
  // =========================================================================
  if (activePlaylist || showingFavoritesDetail) {
    const isAlbum = activePlaylist?.mediaType === 'vinyl';
    const title = showingFavoritesDetail ? 'Canciones Favoritas' : activePlaylist!.name;
    const subtitle = showingFavoritesDetail
      ? 'Tu colección personal de pistas marcadas con corazón'
      : activePlaylist!.description ||
        (activePlaylist!.artist
          ? `${activePlaylist!.artist}${activePlaylist!.year ? ` · ${activePlaylist!.year}` : ''}`
          : 'Playlist');

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

    const backLabel =
      section === 'albums'
        ? 'Volver a Álbumes'
        : section === 'artists' && selectedArtistName
        ? `Volver a ${selectedArtistName}`
        : section === 'playlists'
        ? 'Volver a Playlists'
        : 'Volver a Biblioteca';

    return (
      <div className="space-y-6 pb-8">
        <button
          type="button"
          onClick={() => {
            setFilterText('');
            setBpmFilter('all');
            setSelectedPlaylistId(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
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
                {isAlbum ? <Disc3 className="w-12 h-12" /> : <ListMusic className="w-12 h-12" />}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-accent)]">
              {showingFavoritesDetail ? 'Favoritos' : isAlbum ? 'Álbum' : 'Playlist'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
            <p className="text-xs sm:text-sm font-mono-tech font-medium text-[var(--text-secondary)] mt-2">
              {rawTracks.length} pistas · {formatDuration(totalDuration)}
            </p>

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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--theme-accent)] text-white font-bold text-xs hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
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
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${activePlaylist.name}"?`)) {
                        deletePlaylist(activePlaylist.id);
                        setSelectedPlaylistId(null);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--theme-accent)] transition cursor-pointer"
                    title="Eliminar"
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
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-badge-text)] text-xs font-semibold hover:brightness-110 transition cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Filter & BPM Pills */}
        {rawTracks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filtrar pistas..."
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
              ? 'Todavía no hay canciones aquí.'
              : 'No hay pistas que coincidan con el filtro.'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTracks.map((track, idx) => {
              const isUnfiltered = !filterText.trim() && bpmFilter === 'all';
              const trackWithBpm = track.bpm
                ? track
                : { ...track, bpm: bpmService.getTrackBpm(track) };
              return (
                <TrackRow
                  key={`${track.id}_${idx}`}
                  track={trackWithBpm}
                  index={idx}
                  queue={filteredTracks}
                  showBpm
                  hideThumbnail={isAlbum}
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

  // =========================================================================
  // 2. SUB-SCREENS FOR EACH LIBRARY SECTION
  // =========================================================================

  // --- PLAYLISTS SCREEN (vertical list with cover on the left) ---
  if (section === 'playlists') {
    return (
      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => setSection('root')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Biblioteca
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Playlists
            </h1>
          </div>
          <button
            type="button"
            onClick={openNewPlaylistModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-xs font-bold hover:brightness-110 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Playlist
          </button>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
          {/* Favorites Row */}
          <div
            onClick={() => setSelectedPlaylistId('favorites')}
            className="flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">Favoritos</p>
              <p className="text-xs text-[var(--text-muted)]">{likedTracks.length} canciones</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          </div>

          {userPlaylists.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-muted)]">
              Aún no has creado ninguna playlist.
            </div>
          ) : (
            userPlaylists.map((pl) => {
              const prog = tapeProgressService.getProgress(pl.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="group flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center shrink-0">
                    {pl.coverUrl || pl.tracks[0]?.thumbnail ? (
                      <img
                        src={pl.coverUrl || pl.tracks[0]?.thumbnail}
                        alt={pl.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ListMusic className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {pl.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                      <span>{pl.tracks.length} pistas</span>
                      {prog && (
                        <span className="inline-flex items-center gap-1 text-[var(--theme-accent)] font-semibold">
                          <Clock className="w-3 h-3" />
                          En curso
                        </span>
                      )}
                    </div>
                  </div>

                  {pl.tracks.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPlaylistSmart(pl);
                      }}
                      className="p-2 rounded-full bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Reproducir"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                </div>
              );
            })
          )}
        </div>

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

  // --- ARTISTS SCREEN (alphabetical list with photo on the left -> opens artist's saved albums) ---
  if (section === 'artists') {
    if (selectedArtistName) {
      const artistEntry = artistsAlphabetical.find(
        (a) => a.name.toLowerCase() === selectedArtistName.toLowerCase()
      );
      const artistAlbums = artistEntry?.albums || [];
      const artistTracks = artistEntry?.tracks || [];

      return (
        <div className="space-y-6 pb-8">
          <div>
            <button
              type="button"
              onClick={() => setSelectedArtistName(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Artistas
            </button>
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                {artistEntry?.photo ? (
                  <img
                    src={artistEntry.photo}
                    alt={selectedArtistName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Mic2 className="w-6 h-6 text-[var(--text-muted)]" />
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {selectedArtistName}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {artistAlbums.length} {artistAlbums.length === 1 ? 'álbum guardado' : 'álbumes guardados'}
                </p>
              </div>
            </div>
          </div>

          {artistAlbums.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Álbumes guardados
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
                {artistAlbums.map((alb) => (
                  <div
                    key={alb.id}
                    onClick={() => setSelectedPlaylistId(alb.id)}
                    className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                      {alb.coverUrl || alb.tracks[0]?.thumbnail ? (
                        <img
                          src={alb.coverUrl || alb.tracks[0]?.thumbnail}
                          alt={alb.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <Disc3 className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {alb.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {alb.year ? `${alb.year} · ` : ''}
                      {alb.tracks.length} pistas
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center text-sm text-[var(--text-muted)]">
              No tienes álbumes guardados de {selectedArtistName}.
            </div>
          )}

          {artistTracks.length > 0 && artistAlbums.length === 0 && (
            <section className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Canciones guardadas ({artistTracks.length})
              </h2>
              {artistTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queue={artistTracks}
                  onPlay={() => playTrack(track, artistTracks, false, undefined, 'songs-mini')}
                  onAddToPlaylist={onAddTrackToPlaylist}
                />
              ))}
            </section>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5 pb-8">
        <div>
          <button
            type="button"
            onClick={() => setSection('root')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Biblioteca
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Artistas
          </h1>
        </div>

        {artistsAlphabetical.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            Aún no tienes artistas en tu biblioteca.
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {artistsAlphabetical.map((artist) => (
              <div
                key={artist.name}
                onClick={() => setSelectedArtistName(artist.name)}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-black/30 flex items-center justify-center shrink-0">
                  {artist.photo ? (
                    <img
                      src={artist.photo}
                      alt={artist.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Mic2 className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {artist.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {artist.albums.length > 0
                      ? `${artist.albums.length} ${artist.albums.length === 1 ? 'álbum' : 'álbumes'}`
                      : `${artist.tracks.length} ${artist.tracks.length === 1 ? 'canción' : 'canciones'}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- ALBUMS SCREEN (alphabetical cover grid -> selecting opens album player) ---
  if (section === 'albums') {
    return (
      <div className="space-y-5 pb-8">
        <div>
          <button
            type="button"
            onClick={() => setSection('root')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Biblioteca
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Álbumes
          </h1>
        </div>

        {savedAlbums.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            Guarda álbumes desde Buscar para verlos aquí ordenados alfabéticamente.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
            {savedAlbums.map((alb) => (
              <div
                key={alb.id}
                onClick={() => {
                  setSelectedPlaylistId(alb.id);
                  if (alb.tracks.length > 0) {
                    playTape(alb, 0);
                  }
                }}
                className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                  {alb.coverUrl || alb.tracks[0]?.thumbnail ? (
                    <img
                      src={alb.coverUrl || alb.tracks[0]?.thumbnail}
                      alt={alb.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <Disc3 className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{alb.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  {alb.artist || alb.tracks[0]?.artist || 'Álbum'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- SONGS SCREEN (alphabetical list -> clicking plays in mini-player ONLY) ---
  if (section === 'songs') {
    const q = songsSearch.trim().toLowerCase();
    const visibleSongs = q
      ? allSongsAlphabetical.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            (t.album || '').toLowerCase().includes(q)
        )
      : allSongsAlphabetical;

    return (
      <div className="space-y-5 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => {
                setSongsSearch('');
                setSection('root');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Biblioteca
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Canciones
            </h1>
          </div>

          {allSongsAlphabetical.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={songsSearch}
                onChange={(e) => setSongsSearch(e.target.value)}
                placeholder="Filtrar canciones..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          )}
        </div>

        {visibleSongs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            {allSongsAlphabetical.length === 0
              ? 'No tienes canciones guardadas todavía.'
              : 'Ninguna canción coincide con tu filtro.'}
          </div>
        ) : (
          <div className="space-y-1">
            {visibleSongs.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                queue={visibleSongs}
                onPlay={() => playTrack(track, visibleSongs, false, undefined, 'songs-mini')}
                onAddToPlaylist={onAddTrackToPlaylist}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- PODCASTS SCREEN (alphabetical vertical list) ---
  if (section === 'podcasts') {
    return (
      <div className="space-y-5 pb-8">
        <div>
          <button
            type="button"
            onClick={() => setSection('root')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Biblioteca
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Podcasts
          </h1>
        </div>

        {podcastsAlphabetical.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            No sigues ningún podcast todavía. Descubre programas en la pestaña Podcasts.
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {podcastsAlphabetical.map((show) => (
              <div
                key={show.id}
                onClick={() => setSelectedPodcast(show)}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center shrink-0">
                  {show.artwork ? (
                    <img
                      src={show.artwork}
                      alt={show.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Podcast className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {show.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{show.author}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </div>
            ))}
          </div>
        )}

        <PodcastDetailModal
          show={selectedPodcast}
          onClose={() => setSelectedPodcast(null)}
          onAddTrackToPlaylist={onAddTrackToPlaylist}
        />
      </div>
    );
  }

  // --- AUDIOBOOKS SCREEN (alphabetical vertical list) ---
  if (section === 'audiobooks') {
    return (
      <div className="space-y-5 pb-8">
        <div>
          <button
            type="button"
            onClick={() => setSection('root')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Biblioteca
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Audiolibros
          </h1>
        </div>

        {audiobooksAlphabetical.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            No tienes audiolibros guardados todavía. Descubre títulos en la pestaña Audiolibros.
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {audiobooksAlphabetical.map((book) => (
              <div
                key={book.id}
                onClick={() => setSelectedAudiobook(book)}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center shrink-0">
                  {book.artwork ? (
                    <img
                      src={book.artwork}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {book.author} · {book.provider === 'archive' ? 'Capítulos' : 'YouTube'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </div>
            ))}
          </div>
        )}

        <AudiobookDetailModal
          book={selectedAudiobook}
          onClose={() => setSelectedAudiobook(null)}
        />
      </div>
    );
  }

  // =========================================================================
  // 3. LIBRARY ROOT VIEW (6 Sections at top + Recently Added covers below)
  // =========================================================================
  const menuRows: {
    id: Exclude<LibrarySection, 'root'>;
    label: string;
    count: number;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'playlists', label: 'Playlists', count: userPlaylists.length + (likedTracks.length > 0 ? 1 : 0), icon: ListMusic },
    { id: 'artists', label: 'Artistas', count: artistsAlphabetical.length, icon: Mic2 },
    { id: 'albums', label: 'Álbumes', count: savedAlbums.length, icon: Disc3 },
    { id: 'songs', label: 'Canciones', count: allSongsAlphabetical.length, icon: Music },
    { id: 'podcasts', label: 'Podcasts', count: podcastsAlphabetical.length, icon: Podcast },
    { id: 'audiobooks', label: 'Audiolibros', count: audiobooksAlphabetical.length, icon: BookOpen },
  ];

  return (
    <div className="space-y-7 pb-8">
      {/* Header & Utility Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Biblioteca
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

      {/* Top 5 Navigation Sections with Left Icons */}
      <nav className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
        {menuRows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                setSelectedArtistName(null);
                setSection(row.id);
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[var(--bg-surface-hover)] transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <Icon className="w-5 h-5 text-[var(--theme-accent)] shrink-0" />
                <span className="text-base font-semibold text-[var(--text-primary)]">
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span className="text-xs font-mono-tech">{row.count}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Recently Added (up to 20 covers) */}
      <section>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3.5">Recién añadido</h2>
        {recentlyAdded.length === 0 ? (
          <div className="py-14 text-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-muted)]">
            Aquí aparecerán las carátulas de tus álbumes, playlists, podcasts y canciones recientes.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
            {recentlyAdded.map((item) => (
              <div
                key={item.key}
                onClick={() => {
                  if (item.playlist) {
                    setSelectedPlaylistId(item.playlist.id);
                    if (item.kind === 'album' && item.playlist.tracks.length > 0) {
                      playTape(item.playlist, 0);
                    }
                  } else if (item.podcast) {
                    setSelectedPodcast(item.podcast);
                  } else if (item.audiobook) {
                    setSelectedAudiobook(item.audiobook);
                  } else if (item.track) {
                    playTrack(item.track, likedTracks, false, undefined, 'songs-mini');
                  }
                }}
                className="group p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                  {item.artwork ? (
                    <img
                      src={item.artwork}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      {item.kind === 'album' ? (
                        <Disc3 className="w-8 h-8" />
                      ) : item.kind === 'podcast' ? (
                        <Podcast className="w-8 h-8" />
                      ) : (
                        <ListMusic className="w-8 h-8" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  {item.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <PodcastDetailModal
        show={selectedPodcast}
        onClose={() => setSelectedPodcast(null)}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
      />

      <AudiobookDetailModal
        book={selectedAudiobook}
        onClose={() => setSelectedAudiobook(null)}
      />
    </div>
  );
};
