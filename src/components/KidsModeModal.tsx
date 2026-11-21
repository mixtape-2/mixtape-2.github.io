import React, { useState } from 'react';
import { X, Baby, Volume2, Moon, Lock, ShieldCheck, Check, Eye, EyeOff } from 'lucide-react';
import { useKidsMode } from '../context/KidsModeContext';

interface KidsModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KidsModeModal: React.FC<KidsModeModalProps> = ({ isOpen, onClose }) => {
  const {
    isKidsMode,
    enableKidsMode,
    parentalPassword,
    setParentalPassword,
    maxVolume,
    setMaxVolume,
    sleepTimerMinutes,
    startSleepTimer,
    cancelSleepTimer,
  } = useKidsMode();

  const [passwordInput, setPasswordInput] = useState(parentalPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!isOpen) return null;

  const handleSavePassword = () => {
    if (passwordInput.trim().length >= 3) {
      setParentalPassword(passwordInput.trim());
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    }
  };

  const handleStartKidsMode = () => {
    enableKidsMode();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl max-h-[88dvh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
              <Baby className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="truncate">Modo Seguro para Niños</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Filtro infantil, volumen protegido y candado parental
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2 text-[var(--text-secondary)]">
              <ShieldCheck className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
              <span>Filtro estricto infantil</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2 text-[var(--text-secondary)]">
              <Volume2 className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
              <span>Límite de decibelios</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2 text-[var(--text-secondary)]">
              <Moon className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
              <span>Temporizador de sueño</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2 text-[var(--text-secondary)]">
              <Lock className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
              <span>Candado PIN / reto</span>
            </div>
          </div>

          {/* Setting 1: Safe Volume Limit */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Volume2 className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>Protección auditiva (volumen máx.)</span>
              </div>
              <span className="text-xs font-mono-tech font-bold text-[var(--theme-accent)]">
                {Math.round(maxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.85"
              step="0.05"
              value={maxVolume}
              onChange={(e) => setMaxVolume(parseFloat(e.target.value))}
              className="w-full studio-slider"
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              Impide que la música suba por encima de este nivel en auriculares o altavoz.
            </p>
          </div>

          {/* Setting 2: Sleep Timer */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Moon className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>Temporizador de sueño</span>
              </div>
              {sleepTimerMinutes && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] font-mono-tech font-bold">
                  {sleepTimerMinutes}m activo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    sleepTimerMinutes === mins ? cancelSleepTimer() : startSleepTimer(mins)
                  }
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono-tech border transition cursor-pointer ${
                    sleepTimerMinutes === mins
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
              {sleepTimerMinutes && (
                <button
                  type="button"
                  onClick={cancelSleepTimer}
                  className="py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold cursor-pointer"
                >
                  Off
                </button>
              )}
            </div>
          </div>

          {/* Setting 3: Parental Password */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Lock className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>Contraseña parental de desbloqueo</span>
              </div>
              {passwordSaved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Guardada
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={20}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Contraseña (ej: 1234)"
                  className="w-full py-2 pl-3 pr-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-sm font-mono-tech text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={passwordInput.trim().length < 3}
                className="py-2 px-3.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] disabled:opacity-40 text-xs font-bold text-[var(--text-primary)] transition cursor-pointer"
              >
                Guardar
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Imprescindible para autorizar la salida del Modo Niños. Por defecto:{' '}
              <span className="text-[var(--text-secondary)] font-mono-tech font-bold">1234</span>.
            </p>
          </div>

          {/* Activate Button */}
          <button
            type="button"
            onClick={handleStartKidsMode}
            className="w-full py-3 px-5 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Baby className="w-4.5 h-4.5" />
            <span>{isKidsMode ? 'Volver al Modo Niños' : 'Activar Modo Niños'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
