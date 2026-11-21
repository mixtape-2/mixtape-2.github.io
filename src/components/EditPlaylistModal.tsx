import React, { useState, useEffect } from 'react';
import { X, ListMusic, Disc3 } from 'lucide-react';
import type { Playlist } from '../types/music';
import { useLibrary } from '../context/LibraryContext';

interface EditPlaylistModalProps {
  playlist: Playlist | null;
  onClose: () => void;
}

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({ playlist, onClose }) => {
  const { updatePlaylist } = useLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [mediaType, setMediaType] = useState<'tape' | 'vinyl'>('tape');

  useEffect(() => {
    if (playlist) {
      setName(playlist.name || '');
      setDescription(playlist.description || '');
      setCoverUrl(playlist.coverUrl || '');
      setArtist(playlist.artist || '');
      setYear(playlist.year || '');
      setMediaType(playlist.mediaType || 'tape');
    }
  }, [playlist]);

  if (!playlist) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updatePlaylist(playlist.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      artist: artist.trim() || undefined,
      year: year.trim() || undefined,
      mediaType,
    });
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
          <h3 className="text-base font-bold text-[var(--text-primary)]">Editar Lista</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Artista (opcional)
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Año (opcional)
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              URL de portada (opcional)
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMediaType('tape')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
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
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                mediaType === 'vinyl'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
              }`}
            >
              <Disc3 className="w-4 h-4" />
              Álbum
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--theme-accent)] text-white hover:brightness-110 transition cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
