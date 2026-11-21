import React from 'react';
import { Play, RotateCcw, X, Clock } from 'lucide-react';
import type { TapeProgress } from '../services/tapeProgressService';
import { formatDuration } from './TrackRow';

interface ResumeTapeModalProps {
  isOpen: boolean;
  progress: TapeProgress | null;
  onResume: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const ResumeTapeModal: React.FC<ResumeTapeModalProps> = ({
  isOpen,
  progress,
  onResume,
  onRestart,
  onClose,
}) => {
  if (!isOpen || !progress) return null;

  const pct =
    progress.duration > 0
      ? Math.min(100, Math.round((progress.currentTime / progress.duration) * 100))
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[var(--theme-accent)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Continuar reproducción
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Dejaste <strong className="text-[var(--text-primary)]">{progress.playlistName}</strong>{' '}
            en curso. ¿Quieres reanudar exactamente donde lo dejaste?
          </p>

          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)] truncate">
                #{progress.trackIndex + 1} · {progress.trackTitle}
              </span>
              <span className="font-mono-tech text-[var(--theme-accent)] shrink-0 ml-2">
                {formatDuration(progress.currentTime)} / {formatDuration(progress.duration)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] truncate">{progress.trackArtist}</p>
            <div className="h-1.5 w-full rounded-full bg-[var(--border-strong)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: 'var(--theme-accent)' }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] text-white font-bold text-xs hover:brightness-110 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Continuar donde se quedó
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Desde el principio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
