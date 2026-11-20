import React, { useState } from 'react';
import {
  X,
  Type,
  Volume2,
  Baby,
  Cloud,
  Info,
  Download,
  Upload,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import type { TextSizeType } from '../types/music';
import { APP_VERSION, APP_RELEASE_NAME, checkAppUpdate } from '../version';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKidsModal: () => void;
  onOpenSyncModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenKidsModal,
  onOpenSyncModal,
}) => {
  const { settings, updateSettings, exportBackup, importBackup } = useLibrary();

  const [section, setSection] = useState<'appearance' | 'audio' | 'data' | 'about'>('appearance');
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mixtape-v2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackup(String(reader.result || ''));
      setImportStatus(res.success ? 'Copia restaurada correctamente.' : res.error || 'Error al importar.');
    };
    reader.readAsText(file);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    const res = await checkAppUpdate();
    setUpdateMsg(res.message);
    setCheckingUpdate(false);
  };

  const textSizes: { id: TextSizeType; label: string }[] = [
    { id: 'small', label: 'Pequeño' },
    { id: 'medium', label: 'Normal' },
    { id: 'large', label: 'Grande' },
    { id: 'xlarge', label: 'Extra' },
  ];

  const tabs = [
    { id: 'appearance', label: 'Lectura', icon: Type },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'data', label: 'Datos y Sync', icon: Cloud },
    { id: 'about', label: 'Versión', icon: Info },
  ] as const;

  const ToggleRow: React.FC<{
    label: string;
    desc: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }> = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0">
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
          checked ? 'bg-[var(--theme-accent)]' : 'bg-[var(--border-strong)]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Ajustes</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-[var(--border-subtle)] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = section === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {section === 'appearance' && (
            <>
              {/* Text Size */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                  Tamaño de Texto
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {textSizes.map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => updateSettings({ textSize: sz.id })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        (settings.textSize || 'medium') === sz.id
                          ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kids Mode Shortcut */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenKidsModal();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-badge-text)] hover:brightness-110 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 text-xs font-bold">
                    <Baby className="w-4.5 h-4.5" />
                    Configurar o Activar Modo Infantil (PIN y Límite de Volumen)
                  </span>
                </button>
              </div>
            </>
          )}

          {section === 'audio' && (
            <div className="space-y-4">
              {/* Quality */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Calidad de Streaming
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['auto', 'high', 'medium', 'low'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => updateSettings({ audioQuality: q })}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition cursor-pointer ${
                        settings.audioQuality === q
                          ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {q === 'high' ? 'Alta' : q === 'medium' ? 'Media' : q === 'low' ? 'Baja' : 'Auto'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-4">
                <ToggleRow
                  label="Saltar patrocinadores (SponsorBlock)"
                  desc="Omite automáticamente intros largas y segmentos patrocinados"
                  checked={settings.skipSponsors}
                  onChange={(v) => updateSettings({ skipSponsors: v })}
                />
                <ToggleRow
                  label="Normalizar volumen"
                  desc="Equilibra el nivel sonoro entre pistas"
                  checked={settings.normalizeVolume}
                  onChange={(v) => updateSettings({ normalizeVolume: v })}
                />
                <ToggleRow
                  label="Letras sincronizadas (LRC)"
                  desc="Descarga automáticamente letras karaoke desde LRCLIB"
                  checked={settings.enableLrcLyrics}
                  onChange={(v) => updateSettings({ enableLrcLyrics: v })}
                />
                <ToggleRow
                  label="Caché offline en IndexedDB"
                  desc="Guarda audio reproducido para acelerar futuras escuchas"
                  checked={settings.cacheSongsOffline}
                  onChange={(v) => updateSettings({ cacheSongsOffline: v })}
                />
                <ToggleRow
                  label="Crossfade entre canciones"
                  desc="Transición suave encadenada al cambiar de pista"
                  checked={!!settings.crossfadeEnabled}
                  onChange={(v) => updateSettings({ crossfadeEnabled: v })}
                />
              </div>

              {settings.crossfadeEnabled && (
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[var(--text-primary)]">Duración del Crossfade</span>
                    <span className="font-mono-tech text-[var(--theme-accent)]">
                      {settings.crossfadeDuration ?? 5}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    step={1}
                    value={settings.crossfadeDuration ?? 5}
                    onChange={(e) => updateSettings({ crossfadeDuration: Number(e.target.value) })}
                    className="w-full studio-slider"
                  />
                </div>
              )}
            </div>
          )}

          {section === 'data' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSyncModal();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] hover:brightness-110 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <QrCode className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Sincronización Multi-Dispositivo por QR</p>
                    <p className="text-xs opacity-80">
                      Vincula móvil y ordenador en tiempo real sin cuentas
                    </p>
                  </div>
                </div>
              </button>

              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Copia de Seguridad Local (JSON)
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Biblioteca
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Importar JSON
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
                {importStatus && (
                  <p className="text-xs text-emerald-400 font-medium">{importStatus}</p>
                )}
              </div>
            </div>
          )}

          {section === 'about' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
                <div className="text-lg font-extrabold text-[var(--text-primary)]">
                  {APP_RELEASE_NAME}
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-mono-tech font-bold bg-[var(--theme-badge-bg)] text-[var(--theme-accent)]">
                  v{APP_VERSION}
                </div>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto pt-1">
                  Interfaz v2 moderna, rápida y minimalista impulsada por el motor completo Hi-Fi
                  de Mixtape (streaming sin anuncios, letras LRC, BPM/RPM, podcasts y sync QR).
                </p>
              </div>

              <button
                type="button"
                disabled={checkingUpdate}
                onClick={handleCheckUpdate}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${checkingUpdate ? 'animate-spin' : ''}`} />
                {checkingUpdate ? 'Comprobando...' : 'Buscar actualizaciones'}
              </button>

              {updateMsg && (
                <p className="text-center text-xs text-[var(--text-secondary)]">{updateMsg}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
