import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Link2,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Disc3,
  Sparkles,
  Radio,
  Check,
  CheckCheck,
  Copy,
  Music2,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { parseSpotifyCsv, type ParsedSpotifyTrack } from '../services/spotifyCsvParser';
import { importPlaylistFromUrl, detectPlaylistUrl } from '../services/playlistUrlImporter';
import {
  findStrictBestMatch,
  cleanTitle,
  extractArtists,
  type FailedTrackReport,
} from '../services/trackMatcher';
import { streamResolver } from '../services/streamResolver';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../types/music';

interface SpotifyCsvTapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlaylist?: (playlistId: string) => void;
}

// Demo CSV template for instant testing
const DEMO_SPOTIFY_CSV = `Track URI,Track Name,Artist Name(s),Album Name,Duration (ms)
spotify:track:4u7EnebtmKWzUH433cf5Qv,Bohemian Rhapsody,Queen,A Night At The Opera,354320
spotify:track:2b8O0cI44dYt42k1tGkS3e,Sultans of Swing,Dire Straits,Dire Straits,348640
spotify:track:37ZJ0p5Jm13um7xPp7rZqR,Hotel California,Eagles,Hotel California,391376
spotify:track:2WfaOiMkCvy7F5fcp2PxZ8,Sweet Child O' Mine,Guns N' Roses,Appetite For Destruction,356066
spotify:track:1w8OXn3aM3Yc3H5u3eQ3yR,Back In Black,AC/DC,Back In Black,255493`;

type ModalStep = 'input' | 'preview' | 'recording' | 'complete';

export const SpotifyCsvTapeModal: React.FC<SpotifyCsvTapeModalProps> = ({
  isOpen,
  onClose,
  onOpenPlaylist,
}) => {
  const { createPlaylist, addTracksToPlaylist } = useLibrary();
  const { playTrack, setFullScreenPlayerOpen } = usePlayer();

  const [step, setStep] = useState<ModalStep>('input');
  const [inputTab, setInputTab] = useState<'url' | 'upload' | 'paste'>('url');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [rawText, setRawText] = useState('');
  const [tapeName, setTapeName] = useState('Mixtape Spotify');
  const [tapeType, setTapeType] = useState<'type1' | 'type2' | 'type4'>('type2');
  const [parsedTracks, setParsedTracks] = useState<ParsedSpotifyTrack[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Tape types explanation accordion
  const [showTypeExplanation, setShowTypeExplanation] = useState(false);

  // Recording phase state
  const [recordProgress, setRecordProgress] = useState<{
    current: number;
    total: number;
    currentTitle: string;
    currentArtist: string;
    successCount: number;
    failedCount: number;
  }>({
    current: 0,
    total: 0,
    currentTitle: '',
    currentArtist: '',
    successCount: 0,
    failedCount: 0,
  });

  const [resolvedTracks, setResolvedTracks] = useState<Track[]>([]);
  const [failedTracks, setFailedTracks] = useState<FailedTrackReport[]>([]);
  const [copiedMissing, setCopiedMissing] = useState(false);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessParsed = (
    tracks: ParsedSpotifyTrack[],
    suggestedName: string = 'Mixtape Spotify'
  ) => {
    if (tracks.length === 0) {
      setErrorMsg('No se detectaron canciones válidas en el archivo CSV.');
      return;
    }
    setErrorMsg(null);
    setParsedTracks(tracks);
    setTapeName(suggestedName);
    setSelectedIds(new Set(tracks.map((t) => t.id)));
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseSpotifyCsv(text, file.name);
      handleProcessParsed(res.tracks, res.suggestedName);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!rawText.trim()) {
      setErrorMsg('Pega el texto de tu CSV o lista de canciones.');
      return;
    }
    const res = parseSpotifyCsv(rawText);
    handleProcessParsed(res.tracks, res.suggestedName);
  };

  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = playlistUrl.trim();
    if (!trimmed) {
      setErrorMsg('Pega la URL pública de una lista de Spotify o Apple Music.');
      return;
    }
    setErrorMsg(null);
    setIsFetchingUrl(true);
    try {
      const res = await importPlaylistFromUrl(trimmed);
      handleProcessParsed(res.tracks, res.suggestedName || res.playlistTitle);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'No se pudo leer la lista desde esa URL. Comprueba que la playlist sea pública.'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleLoadDemo = () => {
    setRawText(DEMO_SPOTIFY_CSV);
    const res = parseSpotifyCsv(DEMO_SPOTIFY_CSV, 'Rock Clásico Spotify');
    handleProcessParsed(res.tracks, 'Cinta: Rock Clásico Spotify');
  };

  const toggleSelectTrack = (id: string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

  // Start the physical 80s tape recording process with strict exact matching
  const startTapeRecording = async () => {
    const activeTracks = parsedTracks.filter((t) => selectedIds.has(t.id));
    if (activeTracks.length === 0) {
      setErrorMsg('Selecciona al menos una canción para grabar en la cinta.');
      return;
    }

    setStep('recording');
    setErrorMsg(null);
    isCancelledRef.current = false;
    const finalResolved: Track[] = [];
    const unrecordedList: FailedTrackReport[] = [];

    setRecordProgress({
      current: 0,
      total: activeTracks.length,
      currentTitle: activeTracks[0].title,
      currentArtist: activeTracks[0].artist,
      successCount: 0,
      failedCount: 0,
    });

    for (let i = 0; i < activeTracks.length; i++) {
      if (isCancelledRef.current) break;

      const spTrack = activeTracks[i];
      setRecordProgress({
        current: i + 1,
        total: activeTracks.length,
        currentTitle: spTrack.title,
        currentArtist: spTrack.artist,
        successCount: finalResolved.length,
        failedCount: unrecordedList.length,
      });

      try {
        const cleaned = cleanTitle(spTrack.title);
        const expArtists = extractArtists(spTrack.artist);
        const primaryArtist = expArtists[0] || spTrack.artist;

        // Pass 1: Canonical Title + Primary Artist (cleanest search for YouTube / streaming)
        const query1 = `${cleaned || spTrack.title} ${primaryArtist}`;
        let searchMatches = await streamResolver.search(query1, 'youtube', 1);
        let matchResult = findStrictBestMatch(spTrack, searchMatches);

        // Pass 2: Canonical Title + Full Artist String (if multiple artists)
        if (!matchResult.matchedTrack && spTrack.artist !== primaryArtist) {
          const query2 = `${cleaned || spTrack.title} ${spTrack.artist}`;
          const altMatches = await streamResolver.search(query2, 'youtube', 1);
          matchResult = findStrictBestMatch(spTrack, altMatches);
        }

        // Pass 3: Artist + Canonical Title
        if (!matchResult.matchedTrack) {
          const query3 = `${primaryArtist} ${cleaned || spTrack.title}`;
          const altMatches = await streamResolver.search(query3, 'youtube', 1);
          matchResult = findStrictBestMatch(spTrack, altMatches);
        }

        // Pass 4: Title alone (evaluateTrackMatch strictly enforces artist confirmation)
        if (!matchResult.matchedTrack && cleaned) {
          const titleMatches = await streamResolver.search(cleaned, 'youtube', 1);
          matchResult = findStrictBestMatch(spTrack, titleMatches);
        }

        // Pass 5: Comprehensive search across all providers (Audius / Local catalog / YouTube)
        if (!matchResult.matchedTrack) {
          const query5 = `${cleaned || spTrack.title} ${primaryArtist}`;
          const allMatches = await streamResolver.search(query5, 'all', 1);
          matchResult = findStrictBestMatch(spTrack, allMatches);
        }

        if (matchResult.matchedTrack) {
          finalResolved.push(matchResult.matchedTrack);
        } else {
          // STRICT RULE: Do not import anything if no verified match is confirmed
          unrecordedList.push({
            track: spTrack,
            reason: matchResult.reason || 'Sin coincidencia verificada',
          });
        }
      } catch (err) {
        console.warn(`Error buscando "${spTrack.title}":`, err);
        unrecordedList.push({
          track: spTrack,
          reason: 'Error al consultar servidores de streaming',
        });
      }

      // Small throttle to ensure smooth network pacing and retro recording physics
      await new Promise((res) => setTimeout(res, 180));
    }

    setResolvedTracks(finalResolved);
    setFailedTracks(unrecordedList);

    if (finalResolved.length > 0) {
      // 1. Create the new Cassette Tape Playlist
      const biasLabel =
        tapeType === 'type1'
          ? 'TYPE I (FERRO 120µs)'
          : tapeType === 'type4'
          ? 'TYPE IV (METAL 70µs)'
          : 'TYPE II (CHROME 70µs)';
      const tapeDescription = `Cinta grabada desde Spotify CSV (${finalResolved.length} de ${activeTracks.length} grabadas) • Calidad Hi-Fi ${biasLabel}`;
      const newPlaylist = createPlaylist(tapeName, tapeDescription);

      // 2. Add all strictly resolved audio tracks to it
      addTracksToPlaylist(newPlaylist.id, finalResolved);
      setCreatedPlaylistId(newPlaylist.id);
      setStep('complete');
    } else {
      // All tracks failed strict matching
      setStep('complete');
    }
  };

  const handleCopyMissingTracks = () => {
    if (failedTracks.length === 0) return;
    const textLines = [
      `📋 Pistas de Spotify no grabadas en "${tapeName}":`,
      `Total omitidas por falta de coincidencia exacta: ${failedTracks.length}`,
      '',
      ...failedTracks.map(
        (f, idx) => `${idx + 1}. ${f.track.artist} - ${f.track.title} [Motivo: ${f.reason}]`
      ),
    ].join('\n');

    navigator.clipboard.writeText(textLines).then(() => {
      setCopiedMissing(true);
      setTimeout(() => setCopiedMissing(false), 3000);
    });
  };

  const handlePlayNow = () => {
    if (resolvedTracks.length > 0) {
      playTrack(resolvedTracks[0], resolvedTracks, false, 'tape');
      setFullScreenPlayerOpen(true);
      onClose();
    }
  };

  const handleOpenInLibrary = () => {
    if (createdPlaylistId && onOpenPlaylist) {
      onOpenPlaylist(createdPlaylistId);
      onClose();
    } else {
      onClose();
    }
  };

  const resetModal = () => {
    setStep('input');
    setPlaylistUrl('');
    setIsFetchingUrl(false);
    setRawText('');
    setParsedTracks([]);
    setSelectedIds(new Set());
    setErrorMsg(null);
    setResolvedTracks([]);
    setFailedTracks([]);
    setCopiedMissing(false);
    setCreatedPlaylistId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88dvh] flex flex-col rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                  Importar Playlist (URL o CSV)
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono-tech font-semibold text-[var(--theme-accent)] bg-[var(--theme-badge-bg)] px-2 py-0.5 rounded-md border border-[var(--theme-badge-border)] shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Coincidencia exacta
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Enlace directo de Spotify / Apple Music o archivo CSV/TXT
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Error Notification */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ==============================================================
              STEP 1: INPUT CSV (FILE OR PASTE)
             ============================================================== */}
          {step === 'input' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Pega el enlace público de una playlist de{' '}
                <strong className="text-[var(--text-primary)]">Spotify</strong> o{' '}
                <strong className="text-[var(--text-primary)]">Apple Music</strong>, o sube un archivo{' '}
                <strong className="text-[var(--text-primary)]">.csv / .txt</strong>. Mixtape buscará cada canción con coincidencia estricta.
              </p>

              {/* Input Mode Selector */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setInputTab('url');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputTab === 'url'
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Por URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setInputTab('upload');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputTab === 'upload'
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Archivo CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setInputTab('paste');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputTab === 'paste'
                      ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Pegar texto</span>
                </button>
              </div>

              {inputTab === 'url' ? (
                <form onSubmit={handleUrlSubmit} className="space-y-3">
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        URL pública de Spotify o Apple Music
                      </label>
                      {playlistUrl.trim() && detectPlaylistUrl(playlistUrl) && (
                        <span className="text-[10px] font-mono-tech font-bold px-2 py-0.5 rounded-md bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]">
                          {detectPlaylistUrl(playlistUrl)?.platform === 'spotify'
                            ? 'Spotify detectado'
                            : 'Apple Music detectado'}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Link2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                        placeholder="https://open.spotify.com/playlist/... o https://music.apple.com/..."
                        disabled={isFetchingUrl}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)] disabled:opacity-60"
                      />
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Funciona con listas y álbumes públicos (en Spotify hasta 100 canciones por URL). Si tu lista es privada, cámbiala a pública antes de importarla.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isFetchingUrl || !playlistUrl.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extrayendo canciones de la URL...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Extraer canciones de la lista</span>
                      </>
                    )}
                  </button>
                </form>
              ) : inputTab === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[var(--border-strong)] hover:border-[var(--theme-accent)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-xl p-7 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)]">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      Haz clic para seleccionar tu archivo CSV
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Compatible con archivos .csv y .txt (Spotify, Apple Music, TuneMyMusic, Soundiiz)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Pega aquí el contenido de tu CSV...\nEjemplo:\nTrack Name,Artist Name(s),Album Name,Duration (ms)\nBohemian Rhapsody,Queen,A Night At The Opera,354320`}
                    className="w-full h-36 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-xs font-mono-tech text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition active:scale-[0.99] cursor-pointer"
                  >
                    Analizar canciones
                  </button>
                </div>
              )}

              {/* Quick Demo Button */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">¿No tienes un CSV a mano?</span>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-xs font-semibold text-[var(--theme-accent)] hover:underline flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cargar lista demo de prueba</span>
                </button>
              </div>
            </div>
          )}

          {/* ==============================================================
              STEP 2: PREVIEW DETECTED TRACKS & CONFIGURE PLAYLIST
             ============================================================== */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Playlist Name Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Nombre de la playlist
                </label>
                <input
                  type="text"
                  value={tapeName}
                  onChange={(e) => setTapeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>

              {/* Audio Profile / Tape Type */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Perfil de archivo
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTypeExplanation(!showTypeExplanation)}
                    className="text-xs text-[var(--theme-accent)] hover:underline flex items-center gap-1 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Ver diferencias</span>
                    {showTypeExplanation ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'type1', name: 'Type I (Ferro)', desc: '120µs · Cálido' },
                    { id: 'type2', name: 'Type II (Chrome)', desc: '70µs · Estándar' },
                    { id: 'type4', name: 'Type IV (Metal)', desc: '70µs · Master' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTapeType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        tapeType === t.id
                          ? 'bg-[var(--theme-badge-bg)] text-[var(--text-primary)] border-[var(--theme-badge-border)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <p className="text-xs font-bold">{t.name}</p>
                      <p className="text-[11px] font-mono-tech text-[var(--text-muted)] mt-0.5">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {showTypeExplanation && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs space-y-2 text-[var(--text-secondary)]">
                    <div className="border-b border-[var(--border-subtle)] pb-2">
                      <p className="font-bold text-[var(--text-primary)]">Type I - Normal / Ferro (120µs)</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Perfil clásico con medios cálidos, ideal para voces y acústico.
                      </p>
                    </div>
                    <div className="border-b border-[var(--border-subtle)] pb-2">
                      <p className="font-bold text-[var(--text-primary)]">Type II - Chrome / CrO₂ (70µs)</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Equilibrio nítido y transparente. Recomendado para rock, pop y electrónica.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Type IV - Metal (70µs)</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Máximo rango dinámico y respuesta contundente en graves.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Detected Tracks Header */}
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-[var(--theme-accent)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {selectedIds.size} de {parsedTracks.length} canciones seleccionadas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.size === parsedTracks.length) setSelectedIds(new Set());
                    else setSelectedIds(new Set(parsedTracks.map((t) => t.id)));
                  }}
                  className="text-xs font-semibold text-[var(--theme-accent)] hover:underline cursor-pointer"
                >
                  {selectedIds.size === parsedTracks.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              </div>

              {/* Scrollable Track List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {parsedTracks.map((tr, idx) => {
                  const isSelected = selectedIds.has(tr.id);
                  return (
                    <div
                      key={tr.id}
                      onClick={() => toggleSelectTrack(tr.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-surface)]/40 border-[var(--border-subtle)] text-[var(--text-muted)] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-6 text-right font-mono-tech text-xs text-[var(--text-muted)]">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate leading-tight text-[var(--text-primary)]">
                            {tr.title}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                            {tr.artist} {tr.album ? `· ${tr.album}` : ''}
                            {tr.durationMs
                              ? ` · ${Math.floor(tr.durationMs / 60000)}:${String(
                                  Math.floor((tr.durationMs % 60000) / 1000)
                                ).padStart(2, '0')}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs transition cursor-pointer"
                >
                  Volver
                </button>

                <button
                  type="button"
                  onClick={startTapeRecording}
                  disabled={selectedIds.size === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition active:scale-[0.99] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Importar playlist ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {/* ==============================================================
              STEP 3: ACTIVE MATCHING & IMPORT PROGRESS
             ============================================================== */}
          {step === 'recording' && (
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <Disc3 className="w-5 h-5 text-[var(--theme-accent)] animate-spin" />
                <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                  Buscando coincidencias exactas
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-base font-bold text-[var(--text-primary)] truncate">
                  {recordProgress.currentTitle}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {recordProgress.currentArtist}
                </p>
              </div>

              {/* Live Counters */}
              <div className="flex items-center justify-center gap-3 text-xs font-mono-tech">
                <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] text-emerald-400 border border-[var(--border-subtle)]">
                  Importadas: {recordProgress.successCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  Omitidas: {recordProgress.failedCount}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-2 rounded-full bg-[var(--border-strong)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--theme-accent)] transition-all duration-200"
                    style={{
                      width: `${recordProgress.total > 0 ? (recordProgress.current / recordProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono-tech text-[var(--text-secondary)]">
                  <span>
                    Pista {recordProgress.current} de {recordProgress.total}
                  </span>
                  <span>
                    {recordProgress.total > 0
                      ? Math.round((recordProgress.current / recordProgress.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  isCancelledRef.current = true;
                  setStep('preview');
                }}
                className="py-2 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-[var(--text-secondary)] text-xs font-semibold transition cursor-pointer"
              >
                Cancelar importación
              </button>
            </div>
          )}

          {/* ==============================================================
              STEP 4: COMPLETE REPORT
             ============================================================== */}
          {step === 'complete' && (
            <div className="space-y-4">
              {resolvedTracks.length > 0 && failedTracks.length === 0 ? (
                <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-center space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Importación completada al 100%
                    </h3>
                    <p className="text-sm font-semibold text-[var(--theme-accent)] mt-0.5">
                      {tapeName}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Se verificaron e importaron {resolvedTracks.length} canciones con coincidencia exacta en tu biblioteca.
                    </p>
                  </div>
                </div>
              ) : resolvedTracks.length > 0 && failedTracks.length > 0 ? (
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                      <AlertTriangle className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        Importación completada con avisos
                      </h3>
                      <p className="text-xs font-semibold text-[var(--theme-accent)] truncate">
                        {tapeName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                      <p className="text-xs font-bold text-emerald-400 font-mono-tech">
                        {resolvedTracks.length} importadas
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">Coincidencia exacta</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                      <p className="text-xs font-bold text-[var(--theme-accent)] font-mono-tech">
                        {failedTracks.length} omitidas
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">Sin resultado exacto</p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Para proteger la precisión de tu lista, Mixtape omitió las canciones que no coincidían de forma exacta en artista, título o duración.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-red-500/30 text-center space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      No se pudo importar la lista
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Ninguna de las {failedTracks.length} canciones superó la verificación estricta de título y artista.
                    </p>
                  </div>
                </div>
              )}

              {/* UNRECORDED TRACKS REPORT */}
              {failedTracks.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[var(--theme-accent)]" />
                      <span>Pistas omitidas ({failedTracks.length})</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyMissingTracks}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedMissing ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar omitidas</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {failedTracks.map((item, idx) => (
                      <div
                        key={item.track.id || idx}
                        className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate leading-tight">
                            {idx + 1}. {item.track.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                            {item.track.artist} {item.track.album ? `· ${item.track.album}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono-tech font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)] shrink-0">
                          {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Action Buttons */}
              {resolvedTracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handlePlayNow}
                    className="py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Reproducir ahora ({resolvedTracks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInLibrary}
                    className="py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-semibold text-xs border border-[var(--border-strong)] transition cursor-pointer"
                  >
                    Ver en Biblioteca
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={resetModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition cursor-pointer"
                >
                  Volver a intentar con otra lista
                </button>
              )}

              {resolvedTracks.length > 0 && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
                  >
                    Importar otra playlist desde CSV
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotifyCsvTapeModal;
