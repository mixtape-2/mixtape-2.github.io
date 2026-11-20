import React, { useState } from 'react';
import { X, Plus, ListMusic, Disc3, Check } from 'lucide-react';
import type { Track } from '../types/music';
import { useLibrary } from '../context/LibraryContext';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackToAdd?: Track | null;
  tracksToAdd?: Track[] | null;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  trackToAdd,
  tracksToAdd,
}) => {
  const { playlists, createPlaylist, addTrackToPlaylist, addTracksToPlaylist } = useLibrary();

  const incomingTracks: Track[] = tracksToAdd?.length
    ? tracksToAdd
    : trackToAdd
    ? [trackToAdd]
    : [];

  const [mode, setMode] = useState<'pick' | 'create'>(
    incomingTracks.length > 0 && playlists.length > 0 ? 'pick' : 'create'
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'tape' | 'vinyl'>('tape');
  const [addedToId, setAddedToId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddToExisting = (playlistId: string) => {
    if (incomingTracks.length === 1) {
      addTrackToPlaylist(playlistId, incomingTracks[0]);
    } else if (incomingTracks.length > 1) {
      addTracksToPlaylist(playlistId, incomingTracks);
    }
    setAddedToId(playlistId);
    setTimeout(() => {
      setAddedToId(null);
      onClose();
    }, 350);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createPlaylist(
      trimmed,
      description.trim() || undefined,
      incomingTracks[0]?.thumbnail,
      mediaType,
      undefined,
      undefined,
      incomingTracks
    );
    setName('');
    setDescription('');
    onClose();
  };

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
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {incomingTracks.length > 0
                ? incomingTracks.length === 1
                  ? 'Añadir canción a lista'
                  : `Añadir ${incomingTracks.length} canciones`
                : 'Nueva Lista'}
            </h3>
            {incomingTracks.length === 1 && (
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-[280px] mt-0.5">
                {incomingTracks[0].title} · {incomingTracks[0].artist}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {incomingTracks.length > 0 && playlists.length > 0 && (
          <div className="px-5 pt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('pick')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'pick'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              }`}
            >
              Listas existentes ({playlists.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'create'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              }`}
            >
              + Crear nueva
            </button>
          </div>
        )}

        {mode === 'pick' && incomingTracks.length > 0 && playlists.length > 0 ? (
          <div className="p-5 max-h-80 overflow-y-auto space-y-2">
            {playlists.map((pl) => {
              const isAdded = addedToId === pl.id;
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleAddToExisting(pl.id)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center shrink-0">
                      {pl.coverUrl || pl.tracks[0]?.thumbnail ? (
                        <img
                          src={pl.coverUrl || pl.tracks[0]?.thumbnail}
                          alt={pl.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ListMusic className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {pl.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {pl.tracks.length} pistas · {pl.mediaType === 'vinyl' ? 'Álbum' : 'Lista'}
                      </p>
                    </div>
                  </div>
                  {isAdded ? (
                    <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Nombre de la lista
              </label>
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Rock de Carretera, Entrenamiento..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas o ambiente de la lista"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Tipo de colección
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('tape')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    mediaType === 'tape'
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  <ListMusic className="w-4 h-4" />
                  Lista / Mix
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('vinyl')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    mediaType === 'vinyl'
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  <Disc3 className="w-4 h-4" />
                  Álbum
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--theme-accent)] text-black hover:brightness-110 transition cursor-pointer"
              >
                Crear Lista
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
