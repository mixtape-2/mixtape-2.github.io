import React, { useEffect, useRef, useState } from 'react';
import { X, ListMusic, Mic2, Trash2, Play, Music, Save, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
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
    playbackContext,
    playTrack,
    removeFromQueue,
    lyrics,
    activeLyricIndex,
    seek,
  } = usePlayer();

  const { createPlaylist } = useLibrary();
  const [isSavingFormOpen, setIsSavingFormOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

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

  const handleOpenSaveForm = () => {
    const defaultTitle =
      playbackContext && playbackContext !== 'songs-mini' && playbackContext !== 'favorites'
        ? playbackContext
        : `Cola guardada (${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})`;
    setSaveName(defaultTitle);
    setIsSavingFormOpen(true);
    setJustSaved(false);
  };

  const handleSaveQueue = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = saveName.trim();
    if (!clean || queue.length === 0) return;
    createPlaylist(
      clean,
      `Lista guardada desde la cola (${queue.length} pistas)`,
      queue[0]?.thumbnail,
      'tape',
      undefined,
      undefined,
      queue
    );
    setIsSavingFormOpen(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
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
          <div className="flex-1 min-h-0 flex flex-col">
            {queue.length > 0 && (
              <div className="px-3 pt-3 pb-2 border-b border-[var(--border-subtle)] space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                    {playbackContext && playbackContext !== 'songs-mini' && playbackContext !== 'favorites'
                      ? playbackContext
                      : 'Cola en reproducción'}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenSaveForm}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-badge-text)] text-xs font-bold hover:brightness-110 transition shrink-0 cursor-pointer"
                  >
                    {justSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        ¡Guardada!
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Guardar lista
                      </>
                    )}
                  </button>
                </div>

                {isSavingFormOpen && (
                  <form onSubmit={handleSaveQueue} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Nombre de la playlist..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[var(--theme-accent)] text-white text-xs font-bold cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSavingFormOpen(false)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            )}

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
                      onClick={() => playTrack(track)}
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

                      <span className="text-xs font-mono-tech font-medium text-[var(--text-secondary)] shrink-0 tabular-nums">
                        {formatDuration(track.duration)}
                      </span>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(idx);
                          }}
                          className="p-1 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--theme-accent)] transition cursor-pointer"
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
