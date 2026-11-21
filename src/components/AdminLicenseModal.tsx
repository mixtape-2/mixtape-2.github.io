import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  UserPlus,
  Copy,
  Check,
  Trash2,
  X,
  Smartphone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DURATION_OPTIONS: { label: string; hours: number | null }[] = [
  { label: 'Permanente (Sin caducidad)', hours: null },
  { label: '30 Días', hours: 24 * 30 },
  { label: '7 Días', hours: 24 * 7 },
  { label: '24 Horas', hours: 24 },
];

export const AdminLicenseModal: React.FC = () => {
  const {
    session,
    isAdminModalOpen,
    setAdminModalOpen,
    generateUserPassword,
    generatedLicenses,
    deleteLicenseRecord,
  } = useAuth();

  const [targetUser, setTargetUser] = useState('');
  const [targetDevice, setTargetDevice] = useState('');
  const [selectedDurationIdx, setSelectedDurationIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<{
    username: string;
    deviceId: string;
    password: string;
    durationLabel: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isAdminModalOpen || session?.role !== 'admin') {
    return null;
  }

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const opt = DURATION_OPTIONS[selectedDurationIdx];
    const res = generateUserPassword(targetUser, targetDevice, opt.hours, opt.label);
    if ('error' in res) {
      setError(res.error);
      return;
    }

    setLastGenerated({
      username: targetUser.trim(),
      deviceId: res.normalizedDeviceId,
      password: res.password,
      durationLabel: opt.label,
    });
    setTargetUser('');
    setTargetDevice('');
  };

  const copyWhatsAppMessage = (
    id: string,
    username: string,
    password: string,
    deviceId: string,
    durationLabel: string
  ) => {
    const text = [
      `🎸 *Acceso Privado Mixtape Hi-Fi*`,
      `👤 Usuario: ${username}`,
      `🔑 Contraseña: ${password}`,
      `🔒 Equipo vinculado: ${deviceId}`,
      `⏱️ Validez: ${durationLabel}`,
      `(Nota: esta clave solo funciona en tu dispositivo ${deviceId})`,
    ].join('\n');

    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm px-3 pb-6 safe-top overflow-y-auto select-none"
      onClick={() => setAdminModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl relative my-auto max-h-[86dvh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                Generador de Claves por Equipo
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Administrador · {session.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAdminModalOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer shrink-0"
            aria-label="Cerrar panel de administrador"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Generator Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <UserPlus className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="Ej: carlos"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] focus:border-[var(--theme-accent)] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  ID de equipo del invitado
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetDevice}
                    onChange={(e) => setTargetDevice(e.target.value)}
                    placeholder="EQ-XXXX-XXXX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] focus:border-[var(--theme-accent)] focus:outline-none text-sm text-[var(--theme-accent)] placeholder:text-[var(--text-muted)] font-mono-tech uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                Duración del acceso
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedDurationIdx(idx)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      selectedDurationIdx === idx
                        ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {idx === 0 ? 'Permanente' : opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Generar contraseña vinculada</span>
            </button>
          </form>

          {/* Newly Generated Result Banner */}
          {lastGenerated && (
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--theme-badge-border)] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--theme-accent)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Clave generada con éxito
                </span>
                <span className="text-xs font-mono-tech text-[var(--text-secondary)]">
                  {lastGenerated.durationLabel}
                </span>
              </div>

              <div className="bg-[var(--bg-elevated)] rounded-xl p-3 font-mono-tech text-xs space-y-1.5 border border-[var(--border-subtle)]">
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--text-muted)]">Usuario:</span>
                  <span className="text-[var(--text-primary)] font-bold">{lastGenerated.username}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--text-muted)]">Equipo autorizado:</span>
                  <span className="text-[var(--text-primary)] font-bold">{lastGenerated.deviceId}</span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Contraseña:</span>
                  <span className="text-[var(--theme-accent)] font-bold text-sm tracking-wider">
                    {lastGenerated.password}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyWhatsAppMessage(
                    'latest',
                    lastGenerated.username,
                    lastGenerated.password,
                    lastGenerated.deviceId,
                    lastGenerated.durationLabel
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedId === 'latest' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Mensaje copiado para WhatsApp</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar credenciales para WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* History of Generated Licenses */}
          {generatedLicenses.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                Historial de accesos ({generatedLicenses.length})
              </h3>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {generatedLicenses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)] truncate">
                          {item.username}
                        </span>
                        <span className="text-[11px] font-mono-tech px-1.5 py-0.5 rounded-md bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]">
                          {item.deviceId}
                        </span>
                      </div>
                      <p className="font-mono-tech text-[var(--text-primary)] font-semibold text-xs mt-1">
                        {item.password}{' '}
                        <span className="text-[var(--text-secondary)] font-normal">
                          · {item.durationLabel}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          copyWhatsAppMessage(
                            item.id,
                            item.username,
                            item.password,
                            item.deviceId,
                            item.durationLabel
                          )
                        }
                        className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                        title="Copiar para WhatsApp"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLicenseRecord(item.id)}
                        className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-red-500/15 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-400 transition cursor-pointer"
                        title="Borrar del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
