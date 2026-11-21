import React, { useState } from 'react';
import {
  Search,
  Clock,
  QrCode,
  Settings,
  KeyRound,
  LogOut,
  CheckCircle2,
  X,
  Disc3,
  Baby,
} from 'lucide-react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { ThemeProvider } from './context/ThemeContext';
import { KidsModeProvider, useKidsMode } from './context/KidsModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PlayerBar } from './components/PlayerBar';
import { QueueLyricsPanel } from './components/QueueLyricsPanel';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { HomeView } from './components/HomeView';
import { ExploreView } from './components/ExploreView';
import { LibraryView } from './components/LibraryView';
import { PodcastsView } from './components/PodcastsView';
import { AudiobooksView } from './components/AudiobooksView';
import { KidsView } from './components/KidsView';
import { PlaylistModal } from './components/PlaylistModal';
import { RpmGeneratorModal } from './components/RpmGeneratorModal';
import { SettingsModal } from './components/SettingsModal';
import { SyncModal } from './components/SyncModal';
import { SpotifyCsvTapeModal } from './components/SpotifyCsvTapeModal';
import { KidsModeModal } from './components/KidsModeModal';
import { ParentalExitModal } from './components/ParentalExitModal';
import { AccessGateModal } from './components/AccessGateModal';
import { AdminLicenseModal } from './components/AdminLicenseModal';
import { ReggaetonPrankModal } from './components/ReggaetonPrankModal';
import { isReggaetonTag, shouldTriggerReggaetonJoke } from './services/prankService';
import type { Track } from './types/music';
import { APP_VERSION } from './version';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickSearchInput, setQuickSearchInput] = useState<string>('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Modals
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isSpotifyCsvModalOpen, setIsSpotifyCsvModalOpen] = useState(false);
  const [isRpmModalOpen, setIsRpmModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isKidsModalOpen, setIsKidsModalOpen] = useState(false);
  const [isParentalExitOpen, setIsParentalExitOpen] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);
  const [tracksToAdd, setTracksToAdd] = useState<Track[] | null>(null);
  const [prankPendingAction, setPrankPendingAction] = useState<(() => void) | null>(null);

  const { currentTrack, isFullScreenPlayerOpen, setFullScreenPlayerOpen, setActiveNavigationTab } =
    usePlayer();
  const { syncState, dismissJustLinkedBanner } = useLibrary();
  const { isKidsMode } = useKidsMode();
  const {
    session,
    isTrialActive,
    trialRemainingSeconds,
    setLoginModalOpen,
    setAdminModalOpen,
    logout,
  } = useAuth();

  React.useEffect(() => {
    setActiveNavigationTab(activeTab);
  }, [activeTab, setActiveNavigationTab]);

  const formatTrialTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOpenAddToPlaylist = (track?: Track | null) => {
    setTrackToAdd(track ?? currentTrack);
    setTracksToAdd(null);
    setIsPlaylistModalOpen(true);
  };

  const handleOpenAddMultipleToPlaylist = (tracks: Track[]) => {
    setTracksToAdd(tracks);
    setTrackToAdd(null);
    setIsPlaylistModalOpen(true);
  };

  const handleSearchGenre = (genre: string) => {
    const go = () => {
      setSearchQuery(genre);
      setActiveTab('explore');
    };
    if (isReggaetonTag(genre) && shouldTriggerReggaetonJoke()) {
      setPrankPendingAction(() => go);
    } else {
      go();
    }
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearchInput.trim()) return;
    handleSearchGenre(quickSearchInput.trim());
    setQuickSearchInput('');
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab(`playlist:${playlistId}`);
  };

  const isPlaylistRoute = activeTab.startsWith('playlist:');
  const playlistIdFromRoute = isPlaylistRoute ? activeTab.replace('playlist:', '') : null;

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Main Horizontal Workspace: Sidebar + Content + Optional Right Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!isKidsMode && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (!tab.startsWith('playlist:')) setSelectedPlaylistId(null);
            }}
            onSelectPlaylist={handleSelectPlaylist}
            openNewPlaylistModal={() => {
              setTrackToAdd(null);
              setTracksToAdd(null);
              setIsPlaylistModalOpen(true);
            }}
            openSpotifyCsvModal={() => setIsSpotifyCsvModalOpen(true)}
            openRpmModal={() => setIsRpmModalOpen(true)}
            openSettingsModal={() => setIsSettingsModalOpen(true)}
            openSyncModal={() => setIsSyncModalOpen(true)}
            openKidsModal={() => setIsKidsModalOpen(true)}
            openExitKidsModal={() => setIsParentalExitOpen(true)}
          />
        )}

        {/* Main Scrollable Canvas */}
        <main
          className={`flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden safe-top ${
            currentTrack ? 'pb-36 md:pb-6' : 'pb-20 md:pb-6'
          }`}
        >
          {/* Sticky Top Bar (Desktop Quick Search + Mobile Brand & Utility Icons) */}
          {!isKidsMode && (
            <header className="sticky top-0 z-20 px-4 sm:px-6 lg:px-10 xl:px-12 py-3 bg-[var(--bg-canvas)]/85 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
              {/* Mobile Brand */}
              <div className="flex md:hidden items-center gap-2 shrink-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                    style={{ background: 'var(--theme-accent)' }}
                  >
                    <Disc3 className="w-4 h-4" />
                  </div>
                <span className="font-extrabold text-sm tracking-tight">Mixtape</span>
                <span className="text-[10px] font-mono-tech text-[var(--text-muted)]">
                  v{APP_VERSION}
                </span>
              </div>

              {/* Desktop Universal Quick Search */}
              <form
                onSubmit={handleQuickSearchSubmit}
                className="hidden md:flex items-center relative flex-1 max-w-xl"
              >
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={quickSearchInput}
                  onChange={(e) => setQuickSearchInput(e.target.value)}
                  placeholder="Búsqueda rápida de canciones, álbumes o podcasts..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
                />
              </form>

              {/* Right Status & Quick Utilities */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {isTrialActive && (
                  <button
                    type="button"
                    onClick={() => setLoginModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono-tech font-bold cursor-pointer"
                    title="Activar licencia"
                  >
                    <Clock className="w-3 h-3 animate-pulse" />
                    <span>{formatTrialTime(trialRemainingSeconds)}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsKidsModalOpen(true)}
                  className="md:hidden p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-amber-400 transition cursor-pointer"
                  title="Modo Infantil"
                >
                  <Baby className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(true)}
                  className="md:hidden p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                  title="Sincronizar QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="md:hidden p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                  title="Ajustes"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {session?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(true)}
                    className="md:hidden p-2 rounded-xl bg-amber-400 text-black transition cursor-pointer"
                    title="Claves VIP"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                )}

                {session && (
                  <button
                    type="button"
                    onClick={logout}
                    className="md:hidden p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-400 transition cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </header>
          )}

          {/* Page Container (Full-width responsive canvas on PC) */}
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 flex-1">
            {/* QR Linked Banner */}
            {syncState.justLinkedFromUrl && (
              <div className="mb-5 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between gap-3 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Dispositivo vinculado por QR ({syncState.syncCode}).</strong> Tu
                    biblioteca se sincroniza automáticamente.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dismissJustLinkedBanner}
                  className="p-1 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isKidsMode ? (
              <KidsView onOpenExitModal={() => setIsParentalExitOpen(true)} />
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeView
                    onSearchGenre={handleSearchGenre}
                    onSelectPlaylist={handleSelectPlaylist}
                    onOpenFavorites={() => setActiveTab('favorites')}
                    onOpenRpmModal={() => setIsRpmModalOpen(true)}
                    onOpenSpotifyCsvModal={() => setIsSpotifyCsvModalOpen(true)}
                    onOpenSyncModal={() => setIsSyncModalOpen(true)}
                    onAddTrackToPlaylist={handleOpenAddToPlaylist}
                  />
                )}

                {activeTab === 'explore' && (
                  <ExploreView
                    initialQuery={searchQuery}
                    onAddTrackToPlaylist={handleOpenAddToPlaylist}
                    onAddMultipleToPlaylist={handleOpenAddMultipleToPlaylist}
                  />
                )}

                {activeTab === 'library' && (
                  <LibraryView
                    selectedPlaylistId={selectedPlaylistId}
                    setSelectedPlaylistId={setSelectedPlaylistId}
                    openNewPlaylistModal={() => {
                      setTrackToAdd(null);
                      setTracksToAdd(null);
                      setIsPlaylistModalOpen(true);
                    }}
                    openSpotifyCsvModal={() => setIsSpotifyCsvModalOpen(true)}
                    openRpmModal={() => setIsRpmModalOpen(true)}
                    onAddTrackToPlaylist={handleOpenAddToPlaylist}
                  />
                )}

                {activeTab === 'favorites' && (
                  <LibraryView
                    selectedPlaylistId="favorites"
                    setSelectedPlaylistId={() => setActiveTab('library')}
                    isFavoritesView
                    openNewPlaylistModal={() => {
                      setTrackToAdd(null);
                      setTracksToAdd(null);
                      setIsPlaylistModalOpen(true);
                    }}
                    openSpotifyCsvModal={() => setIsSpotifyCsvModalOpen(true)}
                    openRpmModal={() => setIsRpmModalOpen(true)}
                    onAddTrackToPlaylist={handleOpenAddToPlaylist}
                  />
                )}

                {isPlaylistRoute && playlistIdFromRoute && (
                  <LibraryView
                    selectedPlaylistId={playlistIdFromRoute}
                    setSelectedPlaylistId={(id) => {
                      if (!id) {
                        setSelectedPlaylistId(null);
                        setActiveTab('library');
                      } else {
                        handleSelectPlaylist(id);
                      }
                    }}
                    openNewPlaylistModal={() => {
                      setTrackToAdd(null);
                      setTracksToAdd(null);
                      setIsPlaylistModalOpen(true);
                    }}
                    openSpotifyCsvModal={() => setIsSpotifyCsvModalOpen(true)}
                    openRpmModal={() => setIsRpmModalOpen(true)}
                    onAddTrackToPlaylist={handleOpenAddToPlaylist}
                  />
                )}

                {activeTab === 'podcasts' && (
                  <PodcastsView onAddTrackToPlaylist={handleOpenAddToPlaylist} />
                )}

                {activeTab === 'audiobooks' && <AudiobooksView />}
              </>
            )}
          </div>
        </main>

        {/* Right Side Drawer for Queue & Synced Lyrics */}
        <QueueLyricsPanel />
      </div>

      {/* Persistent Desktop Player Bar & Mobile Mini-Player */}
      <PlayerBar onOpenAddToPlaylist={() => handleOpenAddToPlaylist(currentTrack)} />

      {/* Mobile Bottom Nav */}
      {!isKidsMode && !isFullScreenPlayerOpen && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedPlaylistId(null);
            setFullScreenPlayerOpen(false);
          }}
        />
      )}

      {/* Full Screen Immersive Player */}
      <FullScreenPlayer onOpenAddToPlaylist={() => handleOpenAddToPlaylist(currentTrack)} />

      {/* Global Modals */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setTrackToAdd(null);
          setTracksToAdd(null);
        }}
        trackToAdd={trackToAdd}
        tracksToAdd={tracksToAdd}
      />

      <RpmGeneratorModal isOpen={isRpmModalOpen} onClose={() => setIsRpmModalOpen(false)} />

      <SpotifyCsvTapeModal
        isOpen={isSpotifyCsvModalOpen}
        onClose={() => setIsSpotifyCsvModalOpen(false)}
        onOpenPlaylist={(id) => {
          handleSelectPlaylist(id);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenKidsModal={() => setIsKidsModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />

      <KidsModeModal isOpen={isKidsModalOpen} onClose={() => setIsKidsModalOpen(false)} />

      <ParentalExitModal
        isOpen={isParentalExitOpen}
        onClose={() => setIsParentalExitOpen(false)}
      />

      <AccessGateModal />
      <AdminLicenseModal />

      <ReggaetonPrankModal
        isOpen={!!prankPendingAction}
        onAccept={() => {
          const action = prankPendingAction;
          setPrankPendingAction(null);
          if (action) action();
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <PlayerProvider>
            <KidsModeProvider>
              <AppContent />
            </KidsModeProvider>
          </PlayerProvider>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
