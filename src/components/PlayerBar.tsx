import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Plus,
  ListMusic,
  Mic2,
  Maximize2,
  Loader2,
  Gauge,
  Music,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from './TrackRow';

interface PlayerBarProps {
  onOpenAddToPlaylist: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ onOpenAddToPlaylist }) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    buffered,
    volume,
    playbackRate,
    scrubDirection,
    scrubSpeed,
    repeatMode,
    isShuffle,
    isQueueOpen,
    isLyricsOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    fastForward,
    rewind,
    stopScrub,
    seek,
    setVolume,
    setPlaybackRate,
    toggleRepeat,
    toggleShuffle,
    setFullScreenPlayerOpen,
    setQueueOpen,
    setLyricsOpen,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const [showPitchPopover, setShowPitchPopover] = useState(false);
  const [prevVol, setPrevVol] = useState(0.8);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVol(volume);
      setVolume(0);
    } else {
      setVolume(prevVol || 0.8);
    }
  };

  return (
    <>
      {/* MOBILE FLOATING MINI-PLAYER */}
      <div
        onClick={() => setFullScreenPlayerOpen(true)}
        className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+8px)] left-2.5 right-2.5 z-40 rounded-2xl bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--border-strong)] shadow-2xl overflow-hidden cursor-pointer"
      >
        {/* Top micro progress bar */}
        <div className="h-[2px] w-full bg-white/10">
          <div
            className="h-full transition-all duration-200"
            style={{ width: `${progressPct}%`, backgroundColor: 'var(--theme-accent)' }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/30 shrink-0">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <Music className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {currentTrack.artist}
            </p>
          </div>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              className={`p-2 rounded-full transition cursor-pointer ${
                liked ? 'text-[var(--theme-accent)]' : 'text-[var(--text-secondary)]'
              }`}
              aria-label="Favorito"
            >
              <Heart className={`w-4.5 h-4.5 ${liked ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--theme-accent)] text-white active:scale-95 transition cursor-pointer"
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4.5 h-4.5 fill-current" />
              ) : (
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="p-2 rounded-full text-[var(--text-primary)] active:scale-95 transition cursor-pointer"
              aria-label="Siguiente"
            >
              <SkipForward className="w-4.5 h-4.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP PERSISTENT PLAYER BAR */}
      <footer className="hidden md:flex items-center justify-between gap-4 h-20 px-5 bg-[var(--bg-sidebar)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] z-30 shrink-0 select-none">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 w-[28%] min-w-0">
          <div
            onClick={() => setFullScreenPlayerOpen(true)}
            className="relative group w-12 h-12 rounded-xl overflow-hidden bg-black/30 shrink-0 cursor-pointer shadow-md"
          >
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <Music className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p
              onClick={() => setFullScreenPlayerOpen(true)}
              className="text-sm font-bold text-[var(--text-primary)] truncate hover:underline cursor-pointer"
            >
              {currentTrack.title}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {currentTrack.artist}
            </p>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                liked
                  ? 'text-[var(--theme-accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onOpenAddToPlaylist}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
              title="Añadir a lista"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Transport & Seekbar */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl">
          <div className="flex items-center gap-2.5 mb-1.5">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isShuffle
                  ? 'text-[var(--theme-accent)] bg-[var(--theme-badge-bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Aleatorio"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={prevTrack}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              title="Anterior"
            >
              <SkipBack className="w-4.5 h-4.5 fill-current" />
            </button>

            <button
              type="button"
              onClick={rewind}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                scrubDirection === 'backward'
                  ? 'text-[var(--theme-accent)] bg-[var(--theme-badge-bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Rebobinar (1.5x / 2x / 4x / 8x)"
            >
              <Rewind className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => (scrubDirection ? stopScrub(true) : togglePlay())}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:scale-105 active:scale-95 transition shadow-md cursor-pointer"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : isPlaying && !scrubDirection ? (
                <Pause className="w-4.5 h-4.5 fill-current" />
              ) : (
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={fastForward}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                scrubDirection === 'forward'
                  ? 'text-[var(--theme-accent)] bg-[var(--theme-badge-bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Avance rápido (1.5x / 2x / 4x / 8x)"
            >
              <FastForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              title="Siguiente"
            >
              <SkipForward className="w-4.5 h-4.5 fill-current" />
            </button>

            <button
              type="button"
              onClick={toggleRepeat}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                repeatMode !== 'off'
                  ? 'text-[var(--theme-accent)] bg-[var(--theme-badge-bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={
                repeatMode === 'one'
                  ? 'Repetir pista'
                  : repeatMode === 'all'
                  ? 'Repetir cola'
                  : 'Repetición desactivada'
              }
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>

            {scrubDirection && scrubSpeed && (
              <button
                type="button"
                onClick={() => stopScrub(true)}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold bg-[var(--theme-accent)] text-black cursor-pointer"
              >
                {scrubDirection === 'forward' ? 'FF' : 'REW'} {scrubSpeed}x
              </button>
            )}
          </div>

          {/* Interactive Seekbar */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[11px] font-mono-tech text-[var(--text-muted)] w-10 text-right tabular-nums">
              {formatDuration(currentTime)}
            </span>

            <div className="relative flex-1 h-4 flex items-center group">
              <div className="w-full h-1 rounded-full bg-[var(--border-strong)] overflow-hidden relative">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-white/15"
                  style={{ width: `${bufferedPct}%` }}
                />
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: 'var(--theme-accent)',
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={Math.min(currentTime, duration || 100)}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                aria-label="Progreso"
              />
            </div>

            <span className="text-[11px] font-mono-tech text-[var(--text-muted)] w-10 tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Right: Speed, Lyrics, Queue, Volume, Expand */}
        <div className="flex items-center justify-end gap-2 w-[28%]">
          {/* Pitch / Playback Speed Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPitchPopover((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono-tech font-bold transition flex items-center gap-1 cursor-pointer ${
                playbackRate !== 1
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
              title="Velocidad / Pitch"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{playbackRate.toFixed(2)}x</span>
            </button>

            {showPitchPopover && (
              <div className="absolute bottom-11 right-0 w-52 p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl z-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Velocidad / Pitch
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlaybackRate(1)}
                    className="text-[11px] font-semibold text-[var(--theme-accent)] hover:underline cursor-pointer"
                  >
                    Reset 1.0x
                  </button>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.35}
                  step={0.05}
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="w-full studio-slider"
                />
                <div className="flex justify-between text-[10px] font-mono-tech text-[var(--text-muted)] mt-1">
                  <span>0.75x</span>
                  <span>1.00x</span>
                  <span>1.35x</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setLyricsOpen(!isLyricsOpen);
              if (!isLyricsOpen) setQueueOpen(false);
            }}
            className={`p-2 rounded-lg transition cursor-pointer ${
              isLyricsOpen
                ? 'text-[var(--theme-accent)] bg-[var(--theme-badge-bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Letras sincronizadas"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setQueueOpen(!isQueueOpen);
              if (!isQueueOpen) setLyricsOpen(false);
            }}
            className={`p-2 rounded-lg transition cursor-pointer ${
              isQueueOpen
                ? 'text-[var(--theme-accent)] bg-[var(--theme-badge-bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Cola de reproducción"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
              title="Silenciar"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 studio-slider"
              aria-label="Volumen"
            />
          </div>

          <button
            type="button"
            onClick={() => setFullScreenPlayerOpen(true)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </>
  );
};
