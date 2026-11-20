import React, { useState } from 'react';
import { X, Gauge, Play, Save, Loader2, Sparkles } from 'lucide-react';
import { bpmService, RPM_ZONES, type RpmPreset } from '../services/bpmService';
import type { Track } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from './TrackRow';

interface RpmGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RpmGeneratorModal: React.FC<RpmGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { playlists, likedTracks, createPlaylist } = useLibrary();
  const { playTrack } = usePlayer();

  const [preset, setPreset] = useState<RpmPreset>('45');
  const [customBpm, setCustomBpm] = useState<number>(118);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSavedNotice(false);
    try {
      const userTracks = [
        ...likedTracks,
        ...playlists.flatMap((p) => p.tracks),
      ];
      const targetBpm =
        preset === '33' ? 82 : preset === '45' ? 112 : preset === '78' ? 148 : customBpm;
      const result = await bpmService.generateRpmSession(preset, targetBpm, userTracks);
      setTracks(result);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playTrack(tracks[0], tracks);
    onClose();
  };

  const handleSaveAsPlaylist = () => {
    if (tracks.length === 0) return;
    const label =
      preset === 'custom'
        ? `Sesión ${customBpm} BPM`
        : `Sesión ${RPM_ZONES[preset].rpmLabel} (${RPM_ZONES[preset].title})`;
    createPlaylist(label, 'Generada automáticamente por ritmo BPM/RPM', tracks[0]?.thumbnail, 'tape', undefined, undefined, tracks);
    setSavedNotice(true);
  };

  const presetCards: { id: '33' | '45' | '78'; title: string; bpm: string; desc: string }[] = [
    { id: '33', title: '33⅓ RPM', bpm: '60 – 95 BPM', desc: 'Baladas, Chill & Relax' },
    { id: '45', title: '45 RPM', bpm: '96 – 122 BPM', desc: 'Groove, Caminar & Cruising' },
    { id: '78', title: '78 RPM', bpm: '123 – 175 BPM', desc: 'Turbo, Running & Energía' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Gauge className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Generador de Sesiones por Ritmo (BPM / RPM)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Crea una sesión progresiva calibrada a tu cadencia exacta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 3 Presets + Custom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {presetCards.map((card) => {
              const active = preset === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setPreset(card.id)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-[var(--theme-badge-bg)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--text-primary)]">
                      {card.title}
                    </span>
                    <span className="text-[10px] font-mono-tech text-[var(--theme-accent)] font-bold">
                      {card.bpm}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{card.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Custom Exact BPM Slider */}
          <div
            onClick={() => setPreset('custom')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              preset === 'custom'
                ? 'bg-[var(--theme-badge-bg)] border-[var(--theme-badge-border)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Cadencia Manual Exacta
              </span>
              <span className="text-sm font-mono-tech font-extrabold text-[var(--theme-accent)]">
                {customBpm} BPM
              </span>
            </div>
            <input
              type="range"
              min={65}
              max={175}
              step={1}
              value={customBpm}
              onChange={(e) => {
                setPreset('custom');
                setCustomBpm(Number(e.target.value));
              }}
              className="w-full studio-slider"
            />
            <div className="flex justify-between text-[10px] font-mono-tech text-[var(--text-muted)] mt-1">
              <span>65 BPM (Lento)</span>
              <span>120 BPM (Ritmo)</span>
              <span>175 BPM (Sprint)</span>
            </div>
          </div>

          {/* Generate CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-[var(--theme-accent)] text-black font-bold text-sm hover:brightness-110 disabled:opacity-60 transition cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Analizando y generando...' : 'Generar Sesión'}
            </button>

            {tracks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] font-bold text-xs hover:opacity-90 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Reproducir ({tracks.length})
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsPlaylist}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savedNotice ? '¡Guardada!' : 'Guardar Lista'}
                </button>
              </>
            )}
          </div>

          {/* Generated Tracks Preview */}
          {tracks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Pistas seleccionadas ({tracks.length})
              </div>
              {tracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queue={tracks}
                  showBpm
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
