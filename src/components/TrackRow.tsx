import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  Heart,
  Plus,
  ListEnd,
  ListStart,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  Radio,
  Podcast,
  Music,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type { Track } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

export function formatDuration(seconds?: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface TrackRowProps {
  track: Track;
  index?: number;
  queue?: Track[];
  onPlay?: () => void;
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  showBpm?: boolean;
  compact?: boolean;
  hideThumbnail?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  queue,
  onPlay,
  onAddToPlaylist,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  selectable,
  selected,
  onToggleSelect,
  showBpm,
  compact = false,
  hideThumbnail = false,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, playNext } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const liked = isLiked(track.id);

  const handleRowPlay = () => {
    if (selectable && onToggleSelect) {
      onToggleSelect();
      return;
    }
    if (isCurrent) {
      togglePlay();
      return;
    }
    if (onPlay) {
      onPlay();
    } else {
      playTrack(track, queue);
    }
  };

  const runAndClose = (fn: () => void) => {
    fn();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div
        onClick={handleRowPlay}
        className={`group flex items-center gap-3 rounded-xl transition-colors cursor-pointer select-none ${
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5 sm:py-2'
        } ${
          isCurrent
            ? 'bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)]'
            : selected
            ? 'bg-[var(--theme-badge-bg)]/60 border border-[var(--theme-badge-border)]'
            : 'hover:bg-[var(--bg-surface-hover)] border border-transparent'
        }`}
      >
        {/* Optional Multi-select Checkbox or Index */}
        {selectable ? (
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
              selected
                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white'
                : 'border-[var(--border-strong)] bg-transparent'
            }`}
          >
            {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        ) : index !== undefined ? (
          <div
            className={`w-6 text-center text-xs font-mono-tech text-[var(--text-muted)] shrink-0 items-center justify-center ${
              hideThumbnail ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {isCurrent && isPlaying ? (
              <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]" />
            ) : (
              <span className="group-hover:hidden">{index + 1}</span>
            )}
            {!(isCurrent && isPlaying) && (
              <Play className="w-3.5 h-3.5 hidden group-hover:block text-[var(--text-primary)] fill-current" />
            )}
          </div>
        ) : null}

        {/* Artwork (hidden for album tracklists) */}
        {!hideThumbnail && (
          <div
            className={`relative shrink-0 rounded-lg overflow-hidden bg-black/30 ${
              compact ? 'w-9 h-9' : 'w-11 h-11'
            }`}
          >
            {track.thumbnail ? (
              <img
                src={track.thumbnail}
                alt={track.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <Music className="w-4 h-4" />
              </div>
            )}
            <div
              className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
                isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-4 h-4 text-white fill-white" />
              ) : (
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              )}
            </div>
          </div>
        )}

        {/* Title & Artist (full width on mobile, up to 2 lines for long titles) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-1.5 min-w-0">
            <p
              className={`font-semibold leading-snug line-clamp-2 sm:line-clamp-1 ${
                compact ? 'text-xs sm:text-xs' : 'text-sm'
              } ${isCurrent ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]'}`}
            >
              {track.title}
            </p>
            {track.source === 'podcast' && (
              <Podcast className="w-3 h-3 text-[var(--theme-accent)] shrink-0 mt-0.5 sm:mt-0" />
            )}
            {track.source === 'audius' && (
              <Radio className="w-3 h-3 text-[var(--text-muted)] shrink-0 mt-0.5 sm:mt-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            {liked && (
              <Heart className="w-3 h-3 text-[var(--theme-accent)] fill-current shrink-0 sm:hidden" />
            )}
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {track.artist}
              {track.album && track.album !== track.artist ? ` · ${track.album}` : ''}
            </p>
            {track.duration > 0 && (
              <span className="sm:hidden text-xs font-mono-tech font-medium text-[var(--text-secondary)] shrink-0 tabular-nums">
                · {formatDuration(track.duration)}
              </span>
            )}
          </div>
        </div>

        {/* Optional BPM Pill (Desktop) */}
        {showBpm && track.bpm && (
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono-tech bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shrink-0">
            {track.bpm} BPM
          </span>
        )}

        {/* MOBILE: Single clean ⋯ menu trigger (keeps ~90% width free for song title) */}
        {!selectable && (
          <div className="flex sm:hidden items-center shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -mr-1 rounded-xl text-[var(--text-secondary)] active:bg-[var(--bg-elevated)] transition cursor-pointer"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* DESKTOP: Direct quick actions + Duration */}
        <div
          className="hidden sm:flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {(onMoveUp || onMoveDown) && (
            <div className="flex items-center mr-1">
              {onMoveUp && (
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={onMoveUp}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-25 transition cursor-pointer"
                  title="Subir"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={onMoveDown}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-25 transition cursor-pointer"
                  title="Bajar"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleLike(track)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              liked
                ? 'text-[var(--theme-accent)]'
                : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]'
            }`}
            title={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => playNext(track)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title="Reproducir a continuación"
          >
            <ListStart className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => addToQueue(track)}
            className="hidden md:flex p-1.5 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title="Añadir a la cola"
          >
            <ListEnd className="w-4 h-4" />
          </button>

          {onAddToPlaylist && (
            <button
              type="button"
              onClick={() => onAddToPlaylist(track)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
              title="Añadir a lista"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-badge-bg)] transition cursor-pointer"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <span className="text-xs sm:text-sm font-mono-tech font-medium text-[var(--text-secondary)] min-w-[3.25rem] text-right tabular-nums ml-1.5">
            {formatDuration(track.duration)}
          </span>
        </div>
      </div>

      {/* MOBILE BOTTOM ACTION SHEET (rendered via Portal to avoid modal overflow clipping) */}
      {isMobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-xs sm:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl bg-[var(--bg-elevated)] border-t border-[var(--border-strong)] p-4 pb-6 safe-bottom shadow-2xl space-y-3"
            >
              {/* Drag indicator */}
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-1" />

              {/* Track Summary Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 shrink-0">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                    {track.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    {track.artist}
                    {track.duration > 0 ? ` · ${formatDuration(track.duration)}` : ''}
                    {showBpm && track.bpm ? ` · ${track.bpm} BPM` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action List */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => runAndClose(() => toggleLike(track))}
                  className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] transition text-left cursor-pointer"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      liked ? 'text-[var(--theme-accent)] fill-current' : 'text-[var(--text-secondary)]'
                    }`}
                  />
                  <span>{liked ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => runAndClose(() => playNext(track))}
                  className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] transition text-left cursor-pointer"
                >
                  <ListStart className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span>Reproducir a continuación</span>
                </button>

                <button
                  type="button"
                  onClick={() => runAndClose(() => addToQueue(track))}
                  className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] transition text-left cursor-pointer"
                >
                  <ListEnd className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span>Añadir a la cola</span>
                </button>

                {onAddToPlaylist && (
                  <button
                    type="button"
                    onClick={() => runAndClose(() => onAddToPlaylist(track))}
                    className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] transition text-left cursor-pointer"
                  >
                    <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
                    <span>Añadir a playlist</span>
                  </button>
                )}

                {(onMoveUp || onMoveDown) && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {onMoveUp && (
                      <button
                        type="button"
                        disabled={!canMoveUp}
                        onClick={() => runAndClose(onMoveUp)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] disabled:opacity-35 cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                        Subir orden
                      </button>
                    )}
                    {onMoveDown && (
                      <button
                        type="button"
                        disabled={!canMoveDown}
                        onClick={() => runAndClose(onMoveDown)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] disabled:opacity-35 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Bajar orden
                      </button>
                    )}
                  </div>
                )}

                {onRemove && (
                  <button
                    type="button"
                    onClick={() => runAndClose(onRemove)}
                    className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--theme-accent)] active:bg-[var(--theme-badge-bg)] transition text-left cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Eliminar de esta lista</span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
