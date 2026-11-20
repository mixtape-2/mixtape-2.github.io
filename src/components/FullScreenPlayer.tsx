import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Plus,
  Mic2,
  ListMusic,
  Gauge,
  Volume2,
  VolumeX,
  Loader2,
  Music,
  Trash2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from './TrackRow';

interface FullScreenPlayerProps {
  onOpenAddToPlaylist: () => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ onOpenAddToPlaylist }) => {
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
    queue,
    queueIndex,
    lyrics,
    activeLyricIndex,
    isFullScreenPlayerOpen,
    setFullScreenPlayerOpen,
    togglePlay,
    stopPlayback,
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
    playTrack,
    removeFromQueue,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const [subView, setSubView] = useState<'player' | 'lyrics' | 'queue'>('player');
  const [showPitch, setShowPitch] = useState(false);
  const activeLyricRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (subView === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, subView]);

  if (!isFullScreenPlayerOpen || !currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0b0d] text-[var(--text-primary)] overflow-hidden select-none safe-top safe-bottom">
      {/* Subtle Sober Top Accent Glow (zero heavy blur/GPU cost) */}
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% -20%, rgba(234, 76, 35, 0.14) 0%, rgba(11, 11, 13, 0) 70%)',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-4 pb-3">
        <button
          type="button"
          onClick={() => setFullScreenPlayerOpen(false)}
          className="p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          aria-label="Minimizar reproductor"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <button
            type="button"
            onClick={() => setSubView('player')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              subView === 'player' ? 'bg-white text-black' : 'text-white/75 hover:text-white'
            }`}
          >
            Reproductor
          </button>
          <button
            type="button"
            onClick={() => setSubView('lyrics')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              subView === 'lyrics' ? 'bg-white text-black' : 'text-white/75 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            Letras
          </button>
          <button
            type="button"
            onClick={() => setSubView('queue')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              subView === 'queue' ? 'bg-white text-black' : 'text-white/75 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Cola ({queue.length})
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddToPlaylist}
          className="p-2 -mr-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          title="Añadir a lista"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Center Content */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-6 sm:px-10 max-w-2xl w-full mx-auto">
        {subView === 'player' && (
          <div className="w-full flex flex-col items-center">
            {/* Large Crisp Artwork + Floor Reflection Effect */}
            <div className="flex flex-col items-center mb-3">
              <div className="w-60 h-60 sm:w-76 sm:h-76 rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)] border border-white/10 bg-[#151519] relative z-10">
                {currentTrack.thumbnail ? (
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Subtle Floor Reflection */}
              {currentTrack.thumbnail && (
                <div
                  aria-hidden="true"
                  className="w-60 sm:w-76 h-16 sm:h-20 mt-0.5 rounded-t-2xl overflow-hidden pointer-events-none select-none relative"
                  style={{
                    WebkitMaskImage:
                      'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.14) 48%, rgba(0,0,0,0) 100%)',
                    maskImage:
                      'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.14) 48%, rgba(0,0,0,0) 100%)',
                  }}
                >
                  <img
                    src={currentTrack.thumbnail}
                    alt=""
                    className="w-full h-60 sm:h-76 object-cover scale-y-[-1] opacity-55 blur-[1px]"
                    style={{ objectPosition: 'center bottom' }}
                  />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>
              )}
            </div>

            {/* Title, Artist & Like */}
            <div className="w-full flex items-center justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm sm:text-base text-white/65 truncate mt-0.5">
                  {currentTrack.artist}
                  {currentTrack.album ? ` · ${currentTrack.album}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleLike(currentTrack)}
                className={`p-3 rounded-full transition shrink-0 cursor-pointer ${
                  liked
                    ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)]'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {subView === 'lyrics' && (
          <div className="w-full h-full overflow-y-auto py-4 no-scrollbar">
            {lyrics.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/50">
                <Mic2 className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-base font-semibold text-white/80">Sin letra sincronizada</p>
                <p className="text-xs mt-1">
                  No se encontró letra LRC para «{currentTrack.title}».
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-8">
                {lyrics.map((line, i) => {
                  const isActive = i === activeLyricIndex;
                  return (
                    <button
                      key={`${line.time}_${i}`}
                      ref={isActive ? activeLyricRef : null}
                      type="button"
                      onClick={() => seek(line.time)}
                      className={`block w-full text-left transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'text-2xl sm:text-3xl font-extrabold text-white'
                          : i < activeLyricIndex
                          ? 'text-base sm:text-lg font-semibold text-white/35 hover:text-white/60'
                          : 'text-lg sm:text-xl font-semibold text-white/55 hover:text-white/85'
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

        {subView === 'queue' && (
          <div className="w-full h-full overflow-y-auto py-2 space-y-1.5 no-scrollbar">
            {queue.map((track, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${track.id}_${idx}`}
                  onClick={() => playTrack(track, queue)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition ${
                    isCurrent
                      ? 'bg-white/15 border border-white/20'
                      : 'hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-white/60 truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs font-mono-tech text-white/50">
                    {formatDuration(track.duration)}
                  </span>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Transport Controls */}
      <div className="relative z-10 px-6 sm:px-10 pb-6 pt-3 max-w-2xl w-full mx-auto space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="relative h-5 flex items-center">
            <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden relative">
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/25"
                style={{ width: `${bufferedPct}%` }}
              />
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{ width: `${progressPct}%`, backgroundColor: 'var(--theme-accent)' }}
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
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono-tech text-white/60 mt-1">
            <span>{formatDuration(currentTime)}</span>
            {scrubDirection && scrubSpeed ? (
              <button
                type="button"
                onClick={() => stopScrub(true)}
                className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-bold text-[10px] cursor-pointer"
              >
                {scrubDirection === 'forward' ? 'AVANCE' : 'REBOBINADO'} {scrubSpeed}x · Reanudar
              </button>
            ) : (
              <span>{formatDuration(duration)}</span>
            )}
          </div>
        </div>

        {/* Main Transport Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition cursor-pointer ${
              isShuffle ? 'text-[var(--theme-accent)] bg-white/10' : 'text-white/60 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={rewind}
            className={`p-2 rounded-full transition cursor-pointer ${
              scrubDirection === 'backward'
                ? 'text-amber-400 bg-amber-400/20'
                : 'text-white/70 hover:text-white'
            }`}
            title="Rebobinar"
          >
            <Rewind className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={prevTrack}
            className="p-2.5 rounded-full text-white hover:bg-white/10 transition cursor-pointer"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => (scrubDirection ? stopScrub(true) : togglePlay())}
            className="w-15 h-15 rounded-full flex items-center justify-center bg-white text-black shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : isPlaying && !scrubDirection ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={nextTrack}
            className="p-2.5 rounded-full text-white hover:bg-white/10 transition cursor-pointer"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={fastForward}
            className={`p-2 rounded-full transition cursor-pointer ${
              scrubDirection === 'forward'
                ? 'text-amber-400 bg-amber-400/20'
                : 'text-white/70 hover:text-white'
            }`}
            title="Avance rápido"
          >
            <FastForward className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition cursor-pointer ${
              repeatMode !== 'off'
                ? 'text-[var(--theme-accent)] bg-white/10'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bottom Utility Row: Volume, Stop & Pitch */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="text-white/70 hover:text-white cursor-pointer"
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
              className="w-full studio-slider"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={stopPlayback}
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-white/10 text-white/80 hover:text-[var(--theme-accent)] hover:bg-white/15 transition cursor-pointer"
              title="Detener reproducción"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPitch((p) => !p)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono-tech font-bold flex items-center gap-1.5 transition cursor-pointer ${
                playbackRate !== 1 || showPitch
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] border border-[var(--theme-badge-border)]'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Pitch {playbackRate.toFixed(2)}x</span>
            </button>
          </div>
        </div>

        {showPitch && (
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
            <span className="text-xs font-mono-tech text-white/70 shrink-0">0.75x</span>
            <input
              type="range"
              min={0.75}
              max={1.35}
              step={0.05}
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="flex-1 studio-slider"
            />
            <span className="text-xs font-mono-tech text-white/70 shrink-0">1.35x</span>
            <button
              type="button"
              onClick={() => setPlaybackRate(1)}
              className="px-2.5 py-1 rounded-lg bg-white/15 text-xs font-bold hover:bg-white/25 cursor-pointer"
            >
              1.0x
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
