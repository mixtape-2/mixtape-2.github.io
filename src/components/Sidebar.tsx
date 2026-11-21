import React from 'react';
import {
  Home,
  Search,
  Library,
  Podcast,
  BookOpen,
  Heart,
  Plus,
  FileSpreadsheet,
  Gauge,
  Baby,
  QrCode,
  Settings,
  ShieldCheck,
  KeyRound,
  LogOut,
  Disc3,
  ListMusic,
  Play,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useKidsMode } from '../context/KidsModeContext';
import { APP_VERSION } from '../version';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  openNewPlaylistModal: () => void;
  openSpotifyCsvModal: () => void;
  openRpmModal: () => void;
  openSettingsModal: () => void;
  openSyncModal: () => void;
  openKidsModal: () => void;
  openExitKidsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectPlaylist,
  openNewPlaylistModal,
  openSpotifyCsvModal,
  openRpmModal,
  openSettingsModal,
  openSyncModal,
  openKidsModal,
  openExitKidsModal,
}) => {
  const { playlists, likedTracks } = useLibrary();
  const { playTape, activeTapeId } = usePlayer();
  const { session, setAdminModalOpen, setLoginModalOpen, logout } = useAuth();
  const { isKidsMode } = useKidsMode();

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'explore', label: 'Buscar', icon: Search },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'podcasts', label: 'Podcasts', icon: Podcast },
    { id: 'audiobooks', label: 'Audiolibros', icon: BookOpen },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 h-full shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] select-none z-20">
      {/* Brand Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--theme-accent)' }}
          >
            <Disc3 className="w-4.5 h-4.5" />
          </div>
          <div className="leading-none">
            <div className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              Mixtape
            </div>
            <div className="text-[10px] font-mono-tech text-[var(--text-muted)] mt-0.5">
              STUDIO v{APP_VERSION}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Tools */}
      <div className="px-3 mt-5">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Estudio & Herramientas
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] border border-[var(--theme-badge-border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-[var(--theme-accent)]" />
              Favoritos
            </span>
            <span className="text-[11px] font-mono-tech text-[var(--text-muted)]">
              {likedTracks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={openRpmModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
          >
            <Gauge className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Generador BPM / RPM</span>
          </button>

          <button
            type="button"
            onClick={openSpotifyCsvModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Importar Spotify CSV</span>
          </button>
        </div>
      </div>

      {/* Playlists List */}
      <div className="px-3 mt-5 flex-1 min-h-0 flex flex-col">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Tus Listas ({playlists.length})
          </span>
          <button
            type="button"
            onClick={openNewPlaylistModal}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            title="Crear nueva lista"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {playlists.length === 0 ? (
            <button
              type="button"
              onClick={openNewPlaylistModal}
              className="w-full px-3 py-3 rounded-xl border border-dashed border-[var(--border-strong)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--theme-accent)] transition text-center cursor-pointer"
            >
              + Crea tu primera lista
            </button>
          ) : (
            playlists.map((pl) => {
              const isSelected = activeTab === `playlist:${pl.id}`;
              const isActivePlaying = activeTapeId === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ListMusic
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActivePlaying ? 'text-[var(--theme-accent)]' : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <span className="truncate">{pl.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pl.tracks.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTape(pl, 0);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-[var(--theme-accent)] text-black transition cursor-pointer"
                        title="Reproducir lista"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </button>
                    )}
                    <span className="text-[10px] font-mono-tech text-[var(--text-muted)] group-hover:hidden">
                      {pl.tracks.length}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Utility Bar */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={isKidsMode ? openExitKidsModal : openKidsModal}
            className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
              isKidsMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
            }`}
            title="Modo Infantil"
          >
            <Baby className="w-4 h-4 mb-0.5" />
            <span>Kids</span>
          </button>
          <button
            type="button"
            onClick={openSyncModal}
            className="flex flex-col items-center justify-center py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] text-[10px] font-semibold transition cursor-pointer"
            title="Sincronizar con QR"
          >
            <QrCode className="w-4 h-4 mb-0.5" />
            <span>Sync QR</span>
          </button>
          <button
            type="button"
            onClick={openSettingsModal}
            className="flex flex-col items-center justify-center py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] text-[10px] font-semibold transition cursor-pointer"
            title="Ajustes"
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span>Ajustes</span>
          </button>
        </div>

        {/* Account Pill */}
        {session ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold truncate text-[var(--text-primary)]">
                {session.username}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {session.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(true)}
                  className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/15 transition cursor-pointer"
                  title="Panel Claves VIP"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLoginModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] text-xs font-bold hover:brightness-110 transition cursor-pointer"
          >
            Activar Licencia
          </button>
        )}
      </div>
    </aside>
  );
};
