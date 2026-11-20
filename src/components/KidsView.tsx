import React, { useState } from 'react';
import { Lock, Play, Pause, Volume2, Moon, ArrowLeft } from 'lucide-react';
import { KIDS_STATIONS, type KidsStation } from '../data/kidsAnthology';
import { useKidsMode } from '../context/KidsModeContext';
import { usePlayer } from '../context/PlayerContext';

interface KidsViewProps {
  onOpenExitModal: () => void;
}

export const KidsView: React.FC<KidsViewProps> = ({ onOpenExitModal }) => {
  const { maxVolume, sleepTimerRemaining } = useKidsMode();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [selectedStation, setSelectedStation] = useState<KidsStation | null>(null);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Safe Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-sky-500/20 border border-amber-400/30">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎈</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              Mixtape Kids
            </h1>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-0.5">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Volumen máx. {Math.round(maxVolume * 100)}%
              </span>
              {sleepTimerRemaining !== null && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Moon className="w-3.5 h-3.5" />
                  Apagado en {formatTimer(sleepTimerRemaining)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenExitModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Salir (Padres)
        </button>
      </div>

      {/* Station Detail or Grid */}
      {selectedStation ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedStation(null)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Todas las emisoras
          </button>

          <div
            className="p-5 rounded-3xl text-white flex items-center justify-between gap-4 shadow-xl"
            style={{ backgroundColor: selectedStation.color }}
          >
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedStation.emoji}</span>
              <div>
                <h2 className="text-2xl font-extrabold">{selectedStation.title}</h2>
                <p className="text-sm text-white/90">{selectedStation.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => playTrack(selectedStation.tracks[0], selectedStation.tracks)}
              className="px-5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition cursor-pointer shrink-0"
            >
              <Play className="w-4.5 h-4.5 fill-current" />
              ¡Escuchar!
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedStation.tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() =>
                    isCurrent ? togglePlay() : playTrack(track, selectedStation.tracks)
                  }
                  className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--theme-badge-bg)] border-[var(--theme-accent)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center shrink-0">
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4.5 h-4.5 fill-current" />
                    ) : (
                      <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {KIDS_STATIONS.map((station) => (
            <div
              key={station.id}
              onClick={() => setSelectedStation(station)}
              className="group p-6 rounded-3xl text-white shadow-xl hover:scale-[1.02] active:scale-[0.99] transition cursor-pointer flex flex-col justify-between min-h-[170px]"
              style={{
                background: `linear-gradient(135deg, ${station.color} 0%, ${station.color}cc 100%)`,
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl drop-shadow">{station.emoji}</span>
                <span className="px-2.5 py-1 rounded-full bg-black/20 text-[11px] font-bold">
                  {station.tracks.length} canciones
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-extrabold leading-tight">{station.title}</h2>
                <p className="text-xs text-white/90 mt-1">{station.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
