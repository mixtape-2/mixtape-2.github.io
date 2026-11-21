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

const LAST_RPM_SESSION_KEY = 'mixtape_last_rpm_session_v2';
const LEGACY_RPM_SESSION_KEY = 'mixtape_last_rpm_session_v1';

interface SavedRpmSessionDraft {
  preset: RpmPreset;
  customBpm: number;
  sourceMode: 'mixed' | 'discovery';
  label: string;
  tracks: Track[];
}

export const RpmGeneratorModal: React.FC<RpmGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { playlists, likedTracks, createPlaylist } = useLibrary();
  const { playTrack, setQueueOpen } = usePlayer();

  const initialDraft: SavedRpmSessionDraft | null = (() => {
    try {
      localStorage.removeItem(LEGACY_RPM_SESSION_KEY);
      const raw = localStorage.getItem(LAST_RPM_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [preset, setPreset] = useState<RpmPreset>(initialDraft?.preset || '45');
  const [customBpm, setCustomBpm] = useState<number>(initialDraft?.customBpm || 118);
  const [sourceMode, setSourceMode] = useState<'mixed' | 'discovery'>(
    initialDraft?.sourceMode || 'mixed'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<Track[]>(initialDraft?.tracks || []);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const savedIds = new Set<string>([
    ...likedTracks.map((t) => t.id),
    ...playlists.flatMap((p) => p.tracks.map((t) => t.id)),
  ]);

  const getSessionLabel = (p: RpmPreset = preset, bpm: number = customBpm) =>
    p === 'custom'
      ? `Sesión ${bpm} BPM`
      : `Sesión ${RPM_ZONES[p].rpmLabel} (${RPM_ZONES[p].title})`;

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
      const result = await bpmService.generateRpmSession(preset, targetBpm, userTracks, sourceMode);
      setTracks(result);
      try {
        const draft: SavedRpmSessionDraft = {
          preset,
          customBpm,
          sourceMode,
          label: getSessionLabel(preset, customBpm),
          tracks: result,
        };
        localStorage.setItem(LAST_RPM_SESSION_KEY, JSON.stringify(draft));
      } catch {}
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playTrack(tracks[0], tracks, false, 'tape', getSessionLabel());
    // Open the Queue panel on desktop so the user can always inspect or save the active rhythm list
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setQueueOpen(true);
    }
    onClose();
  };

  const handleSaveAsPlaylist = () => {
    if (tracks.length === 0) return;
    createPlaylist(
      getSessionLabel(),
      'Generada automáticamente por ritmo BPM/RPM',
      tracks[0]?.thumbnail,
      'tape',
      undefined,
      undefined,
      tracks
    );
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

          {/* Source Mode Selector: Mixed vs Discovery Only */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSourceMode('mixed')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sourceMode === 'mixed'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
              }`}
            >
              Biblioteca + Descubrimientos nuevos
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('discovery')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sourceMode === 'discovery'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
              }`}
            >
              Solo canciones nuevas (no guardadas)
            </button>
          </div>

          {/* Generate CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-[var(--theme-accent)] text-white font-bold text-sm hover:brightness-110 disabled:opacity-60 transition cursor-pointer"
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
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                <span>Pistas seleccionadas ({tracks.length})</span>
                <span className="font-mono-tech text-[11px] text-[var(--theme-accent)] normal-case">
                  {tracks.filter((t) => !savedIds.has(t.id)).length} nuevas ·{' '}
                  {tracks.filter((t) => savedIds.has(t.id)).length} de tu biblioteca
                </span>
              </div>
              {tracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queue={tracks}
                  onPlay={() => playTrack(track, tracks, false, 'tape', getSessionLabel())}
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
