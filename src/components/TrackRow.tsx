import React from 'react';
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

  return (
    <div
      onClick={handleRowPlay}
      className={`group flex items-center gap-3 rounded-xl transition-all cursor-pointer select-none ${
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
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
              ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-black'
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

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className={`font-semibold truncate leading-tight ${
              compact ? 'text-xs' : 'text-sm'
            } ${isCurrent ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]'}`}
          >
            {track.title}
          </p>
          {track.source === 'podcast' && (
            <Podcast className="w-3 h-3 text-[var(--theme-accent)] shrink-0" />
          )}
          {track.source === 'audius' && (
            <Radio className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {track.artist}
            {track.album && track.album !== track.artist ? ` · ${track.album}` : ''}
          </p>
        </div>
      </div>

      {/* Optional BPM Pill */}
      {showBpm && track.bpm && (
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono-tech bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shrink-0">
          {track.bpm} BPM
        </span>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-0.5 sm:gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reorder Arrows */}
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

        {/* Like */}
        <button
          type="button"
          onClick={() => toggleLike(track)}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            liked
              ? 'text-[var(--theme-accent)]'
              : 'text-[var(--text-muted)] opacity-70 sm:opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]'
          }`}
          title={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        </button>

        {/* Play Next */}
        <button
          type="button"
          onClick={() => playNext(track)}
          className="hidden sm:flex p-1.5 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
          title="Reproducir a continuación"
        >
          <ListStart className="w-4 h-4" />
        </button>

        {/* Add to Queue */}
        <button
          type="button"
          onClick={() => addToQueue(track)}
          className="hidden md:flex p-1.5 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
          title="Añadir a la cola"
        >
          <ListEnd className="w-4 h-4" />
        </button>

        {/* Add to Playlist */}
        {onAddToPlaylist && (
          <button
            type="button"
            onClick={() => onAddToPlaylist(track)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] opacity-80 sm:opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title="Añadir a lista"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Remove */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-[var(--text-muted)] opacity-80 sm:opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Duration */}
        <span className="text-xs sm:text-sm font-mono-tech font-medium text-[var(--text-secondary)] min-w-[3.25rem] text-right tabular-nums ml-1.5">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
};
