import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  User,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Radio,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccessGateModal: React.FC = () => {
  const {
    deviceId,
    isAccessGranted,
    isTrialActive,
    isTrialExpired,
    trialRemainingSeconds,
    isLoginModalOpen,
    setLoginModalOpen,
    login,
    startFreeTrial,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedDevice, setCopiedDevice] = useState(false);

  // Only render when access is locked OR when the user explicitly opened the Login modal during trial
  if (isAccessGranted && !isLoginModalOpen) {
    return null;
  }

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId).catch(() => {});
    setCopiedDevice(true);
    setTimeout(() => setCopiedDevice(false), 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(username, password);
    if (!res.success) {
      setError(res.error || 'Error de autenticación');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto select-none">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl relative my-auto overflow-hidden">
        {/* Close button only if access is currently granted (e.g. user is in active trial) */}
        {isAccessGranted && (
          <button
            type="button"
            onClick={() => setLoginModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] flex items-center justify-center mb-3">
              <Lock className="w-5.5 h-5.5" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono-tech text-[11px] font-semibold text-[var(--theme-accent)] mb-1.5">
              <Radio className="w-3 h-3" />
              <span>Mixtape 2 Studio · Acceso Privado</span>
            </span>

            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {isTrialExpired ? 'Tiempo de prueba finalizado' : 'Control de acceso'}
            </h2>

            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs leading-relaxed">
              {isTrialExpired
                ? 'Tu hora de prueba gratuita ha concluido. Introduce tu usuario y contraseña vinculada a este dispositivo para continuar.'
                : 'Acceso exclusivo con credenciales vinculadas a tu equipo.'}
            </p>
          </div>

          {/* Device Hardware ID Box (Anti-Sharing Lock) */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                ID único de este equipo
              </span>
              <span className="text-[10px] font-mono-tech font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]">
                1 usuario = 1 equipo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] font-mono-tech text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-widest flex-1 text-center border border-[var(--border-strong)]">
                {deviceId}
              </div>

              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="px-3 py-2 rounded-xl bg-[var(--theme-badge-bg)] hover:brightness-110 text-[var(--theme-accent)] border border-[var(--theme-badge-border)] text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                title="Copiar ID de equipo para solicitar acceso"
              >
                {copiedDevice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Envía este código al administrador para recibir tu contraseña personal. Las claves están ligadas a este ID y no funcionan en otros dispositivos.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] focus:border-[var(--theme-accent)] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Contraseña / Clave de equipo
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ej: MX-XXXX-XXXX"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] focus:border-[var(--theme-accent)] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono-tech"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-sm transition active:scale-[0.99] cursor-pointer"
            >
              Desbloquear reproductor
            </button>
          </form>

          {/* 1-Hour Free Trial Option (shown if trial has not started yet) */}
          {!isTrialExpired && !isTrialActive && (
            <div className="pt-4 border-t border-[var(--border-subtle)] text-center space-y-2.5">
              <p className="text-xs text-[var(--text-secondary)]">
                ¿Aún no tienes tu clave vinculada? Disfruta de una sesión de prueba completa:
              </p>
              <button
                type="button"
                onClick={startFreeTrial}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Clock className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>Probar gratis durante 1 hora (60:00)</span>
              </button>
            </div>
          )}

          {/* Active trial indicator inside modal if opened voluntarily */}
          {isTrialActive && (
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono-tech">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                Prueba activa restante:
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {formatCountdown(trialRemainingSeconds)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
