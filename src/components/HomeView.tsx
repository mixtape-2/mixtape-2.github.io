import React, { useEffect, useState } from 'react';
import {
  Play,
  Heart,
  Gauge,
  FileSpreadsheet,
  QrCode,
  Sparkles,
  Clock,
  Radio,
  ListMusic,
  Loader2,
  Compass,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import {
  recommendationService,
  type ContentWindow,
  type FeaturedCollection,
} from '../services/recommendationService';
import { playbackHistoryService } from '../services/playbackHistoryService';
import { tapeProgressService, type TapeProgress } from '../services/tapeProgressService';
import type { Track, Playlist } from '../types/music';
import { TrackRow, formatDuration } from './TrackRow';

interface HomeViewProps {
  onSearchGenre: (query: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenFavorites: () => void;
  onOpenRpmModal: () => void;
  onOpenSpotifyCsvModal: () => void;
  onOpenSyncModal: () => void;
  onAddTrackToPlaylist: (track: Track) => void;
}

const QUICK_GENRES = [
  'Rock Clásico 80s',
  'Rock Español',
  'Indie España',
  'Jazz & Chill',
  'Electrónica',
  'Blues & Soul',
  'Acústico',
  'Reggaeton',
];

export const HomeView: React.FC<HomeViewProps> = ({
  onSearchGenre,
  onSelectPlaylist,
  onOpenFavorites,
  onOpenRpmModal,
  onOpenSpotifyCsvModal,
  onOpenSyncModal,
  onAddTrackToPlaylist,
}) => {
  const { playlists, likedTracks } = useLibrary();
  const { playTrack, playTape } = usePlayer();

  const [discoveryWindows, setDiscoveryWindows] = useState<ContentWindow[]>([]);
  const [channels, setChannels] = useState<Track[]>([]);
  const [collections, setCollections] = useState<FeaturedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [inProgressTapes, setInProgressTapes] = useState<
    { playlist: Playlist; progress: TapeProgress }[]
  >([]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 13) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const isMusicTrack = (t: Track) =>
    t.source !== 'podcast' && !t.id.startsWith('pod_') && !t.showId;

  useEffect(() => {
    const recent = playbackHistoryService.getRecentTracks(20).filter(isMusicTrack).slice(0, 10);
    setRecentTracks(recent);

    const allProg = tapeProgressService.getAllProgress();
    const matched = playlists
      .map((pl) => ({ playlist: pl, progress: allProg[pl.id] }))
      .filter((item) => item.progress && item.playlist.tracks.length > 0)
      .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)
      .slice(0, 4);
    setInProgressTapes(matched);
  }, [playlists]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const musicLiked = likedTracks.filter(isMusicTrack);
    const musicPlaylists = playlists.map((pl) => ({
      ...pl,
      tracks: pl.tracks.filter(isMusicTrack),
    }));
    const recentMusic = playbackHistoryService.getRecentTracks(20).filter(isMusicTrack).slice(0, 8);

    setCollections(recommendationService.getPersonalizedCollections(musicLiked, musicPlaylists));

    Promise.allSettled([
      recommendationService.getDiscoveryForYouWindows(musicLiked, musicPlaylists, recentMusic),
      recommendationService.getPersonalizedChannels(musicLiked, musicPlaylists),
    ])
      .then(([discRes, chanRes]) => {
        if (cancelled) return;
        if (discRes.status === 'fulfilled') {
          setDiscoveryWindows(
            discRes.value
              .map((w) => ({
                ...w,
                tracks: w.tracks.filter(
                  (t) => isMusicTrack(t) && !/\bpodcast\b/i.test(`${t.title} ${t.artist}`)
                ),
              }))
              .filter((w) => w.tracks.length > 0)
              .slice(0, 3)
          );
        }
        if (chanRes.status === 'fulfilled') {
          setChannels(
            chanRes.value.filter(
              (t) => isMusicTrack(t) && !/\bpodcast\b/i.test(`${t.title} ${t.artist}`)
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [likedTracks.length, playlists.length]);

  const quickCards = playlists.slice(0, 5);

  return (
    <div className="space-y-8 pb-8">
      {/* Greeting + Quick Access Grid */}
      <section>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-4">
          {greeting}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Favorites Quick Card */}
          <div
            onClick={onOpenFavorites}
            className="group flex items-center gap-3 p-2 pr-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-lg bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">Favoritos</p>
              <p className="text-xs text-[var(--text-muted)]">{likedTracks.length} canciones</p>
            </div>
            {likedTracks.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playTrack(likedTracks[0], likedTracks);
                }}
                className="w-9 h-9 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition cursor-pointer"
                title="Reproducir favoritos"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            )}
          </div>

          {quickCards.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group flex items-center gap-3 p-2 pr-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center shrink-0">
                {pl.coverUrl || pl.tracks[0]?.thumbnail ? (
                  <img
                    src={pl.coverUrl || pl.tracks[0]?.thumbnail}
                    alt={pl.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="w-5 h-5 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{pl.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{pl.tracks.length} pistas</p>
              </div>
              {pl.tracks.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playTape(pl, 0);
                  }}
                  className="w-9 h-9 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition cursor-pointer"
                  title="Reproducir lista"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Resume In-Progress Playlists */}
      {inProgressTapes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[var(--theme-accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Continuar donde lo dejaste
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inProgressTapes.map(({ playlist, progress }) => {
              const pct =
                progress.duration > 0
                  ? Math.min(100, Math.round((progress.currentTime / progress.duration) * 100))
                  : 0;
              return (
                <div
                  key={playlist.id}
                  onClick={() => playTape(playlist, progress.trackIndex, progress.currentTime)}
                  className="group p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center gap-3.5 transition cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 shrink-0 relative">
                    {playlist.coverUrl || playlist.tracks[0]?.thumbnail ? (
                      <img
                        src={playlist.coverUrl || playlist.tracks[0]?.thumbnail}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        <ListMusic className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {playlist.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      #{progress.trackIndex + 1} · {progress.trackTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--border-strong)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: 'var(--theme-accent)' }}
                        />
                      </div>
                      <span className="text-[10px] font-mono-tech text-[var(--text-muted)]">
                        {formatDuration(progress.currentTime)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Studio Quick Tools */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={onOpenRpmModal}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-left transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">Generador BPM / RPM</p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              Sesiones 33⅓, 45, 78 RPM o exactas
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSpotifyCsvModal}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-left transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">Importar Spotify CSV</p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              Convierte tus playlists al instante
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSyncModal}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-left transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">Sincronizar con QR</p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              Vincula móvil y PC en tiempo real
            </p>
          </div>
        </button>
      </section>

      {/* Quick Genre Chips */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-[var(--theme-accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Explorar por estilo</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => onSearchGenre(genre)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--theme-badge-bg)] hover:text-[var(--theme-accent)] border border-[var(--border-subtle)] hover:border-[var(--theme-badge-border)] text-[var(--text-secondary)] transition cursor-pointer"
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Collections */}
      {collections.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Colecciones para ti
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {collections.map((col) => (
              <div
                key={col.id}
                onClick={() => onSearchGenre(col.query)}
                className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--theme-badge-border)] transition cursor-pointer"
              >
                {col.badge && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] mb-2">
                    {col.badge}
                  </span>
                )}
                <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">
                  {col.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {col.subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {recentTracks.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">
            Escuchado recientemente
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            {recentTracks.slice(0, 6).map((track, idx) => (
              <TrackRow
                key={`${track.id}_${idx}`}
                track={track}
                queue={recentTracks}
                onAddToPlaylist={onAddTrackToPlaylist}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Personalized Discovery Windows */}
      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--theme-accent)]" />
          Cargando recomendaciones personalizadas...
        </div>
      ) : (
        <>
          {discoveryWindows.map((win) =>
            win.tracks.length > 0 ? (
              <section key={win.id}>
                <div className="mb-3">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">{win.title}</h2>
                  {win.subtitle && (
                    <p className="text-xs text-[var(--text-muted)]">{win.subtitle}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {win.tracks.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, win.tracks)}
                      className="group p-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute right-2 bottom-2 w-9 h-9 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 shadow-lg transition-all">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          )}

          {/* Continuous Channels / Live Concerts */}
          {channels.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-[var(--theme-accent)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Conciertos y Sesiones Continuas
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => playTrack(ch, channels)}
                    className="group flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 shrink-0 relative">
                      <img
                        src={ch.thumbnail}
                        alt={ch.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--text-primary)] line-clamp-2">
                        {ch.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                        {ch.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
