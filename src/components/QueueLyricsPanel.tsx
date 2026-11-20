import React, { useEffect, useRef } from 'react';
import { X, ListMusic, Mic2, Trash2, Play, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from './TrackRow';

export const QueueLyricsPanel: React.FC = () => {
  const {
    isQueueOpen,
    isLyricsOpen,
    setQueueOpen,
    setLyricsOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    lyrics,
    activeLyricIndex,
    seek,
  } = usePlayer();

  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isLyricsOpen && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, isLyricsOpen]);

  if (!isQueueOpen && !isLyricsOpen) return null;

  const mode = isLyricsOpen ? 'lyrics' : 'queue';

  const closeAll = () => {
    setQueueOpen(false);
    setLyricsOpen(false);
  };

  return (
    <aside className="fixed md:static inset-0 md:inset-auto z-50 md:z-20 flex justify-end bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
      <div className="w-full max-w-sm md:w-80 lg:w-96 h-full bg-[var(--bg-sidebar)] border-l border-[var(--border-subtle)] flex flex-col shadow-2xl md:shadow-none">
        {/* Header with Mode Switcher */}
        <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setQueueOpen(true);
                setLyricsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'queue'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              Cola ({queue.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLyricsOpen(true);
                setQueueOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'lyrics'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              Letras
            </button>
          </div>

          <button
            type="button"
            onClick={closeAll}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        {mode === 'queue' ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 text-[var(--text-muted)]">
                <ListMusic className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  Tu cola está vacía
                </p>
                <p className="text-xs mt-1">
                  Reproduce cualquier canción, álbum o lista para verla aquí.
                </p>
              </div>
            ) : (
              queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${track.id}_${idx}`}
                    onClick={() => playTrack(track, queue)}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)]'
                        : 'hover:bg-[var(--bg-surface-hover)] border border-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/30 shrink-0 relative">
                      {track.thumbnail ? (
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <Music className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {!isCurrent && (
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isCurrent ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">
                        {track.artist}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono-tech text-[var(--text-muted)] shrink-0">
                      {formatDuration(track.duration)}
                    </span>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(idx);
                        }}
                        className="p-1 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-rose-400 transition cursor-pointer"
                        title="Quitar de la cola"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {!currentTrack ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
                <Mic2 className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-semibold">Reproduce una canción</p>
              </div>
            ) : lyrics.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
                <Mic2 className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  Sin letra sincronizada
                </p>
                <p className="text-xs mt-1">
                  No se encontró archivo LRC para «{currentTrack.title}».
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-12">
                {lyrics.map((line, i) => {
                  const isActive = i === activeLyricIndex;
                  return (
                    <button
                      key={`${line.time}_${i}`}
                      ref={isActive ? activeLineRef : null}
                      type="button"
                      onClick={() => seek(line.time)}
                      className={`block w-full text-left transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'text-lg font-extrabold text-[var(--theme-accent)] scale-[1.01]'
                          : i < activeLyricIndex
                          ? 'text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                          : 'text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {line.text}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
