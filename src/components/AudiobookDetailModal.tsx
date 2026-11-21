import React, { useEffect, useState } from 'react';
import { X, Play, Pause, BookOpen, Bookmark, BookmarkCheck, Loader2, Clock } from 'lucide-react';
import type { AudiobookItem, Track } from '../types/music';
import { audiobookService } from '../services/audiobookService';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from './TrackRow';

interface AudiobookDetailModalProps {
  book: AudiobookItem | null;
  onClose: () => void;
}

export const AudiobookDetailModal: React.FC<AudiobookDetailModalProps> = ({ book, onClose }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isAudiobookSaved, toggleSaveAudiobook } = useLibrary();

  const [chapters, setChapters] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!book) return;
    if (book.provider === 'youtube') {
      setChapters([audiobookService.toYouTubeTrack(book)]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setChapters([]);
    audiobookService
      .getArchiveChapters(book)
      .then((list) => {
        if (!cancelled) setChapters(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book]);

  if (!book) return null;

  const saved = isAudiobookSaved(book.id);
  const latestProg = audiobookService.getBookLatestProgress(book.id);

  const handlePlayChapter = (chapter: Track) => {
    if (currentTrack?.id === chapter.id) {
      togglePlay();
      return;
    }
    const prog = audiobookService.getProgress(chapter.id);
    const startSec = prog && prog.currentTime > 5 ? prog.currentTime : undefined;
    playTrack(chapter, chapters, false, 'tape', book.title, null, startSec);
  };

  const handleResumeOrStart = () => {
    if (chapters.length === 0) return;
    if (latestProg) {
      const target = chapters.find((c) => c.id === latestProg.trackId) || chapters[0];
      handlePlayChapter(target);
    } else {
      handlePlayChapter(chapters[0]);
    }
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

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-black/40 shadow-lg shrink-0">
            {book.artwork ? (
              <img src={book.artwork} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--theme-accent)]">
                <BookOpen className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] mb-1.5">
              {book.provider === 'archive' ? 'Clásico · Capítulos MP3' : 'YouTube Audiolibro'}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight">
              {book.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{book.author}</p>

            {book.description && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1.5">
                {book.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              <button
                type="button"
                disabled={loading || chapters.length === 0}
                onClick={handleResumeOrStart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {latestProg
                  ? `Reanudar (${formatDuration(latestProg.currentTime)})`
                  : 'Escuchar audiolibro'}
              </button>

              <button
                type="button"
                onClick={() => toggleSaveAudiobook(book)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  saved
                    ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] border border-[var(--theme-badge-border)]'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    Guardar en Biblioteca
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Chapters / Audio List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--theme-accent)] mb-2" />
              <p className="text-xs font-medium">Cargando capítulos del audiolibro...</p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No se encontraron capítulos de audio para este título.
            </div>
          ) : (
            chapters.map((ch, idx) => {
              const isCurrent = currentTrack?.id === ch.id;
              const prog = audiobookService.getProgress(ch.id);
              const pct =
                prog && prog.duration > 0
                  ? Math.min(100, Math.round((prog.currentTime / prog.duration) * 100))
                  : 0;

              return (
                <div
                  key={ch.id}
                  onClick={() => handlePlayChapter(ch)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--theme-badge-bg)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--theme-accent)] text-white shrink-0 cursor-pointer"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${
                          isCurrent ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {chapters.length > 1 ? `${idx + 1}. ` : ''}
                        {ch.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm font-mono-tech font-medium text-[var(--text-secondary)]">
                        {ch.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(ch.duration)}
                          </span>
                        )}
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
