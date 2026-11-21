import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Laptop,
  Link2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Camera,
  Radio,
  Sparkles,
  ImageIcon,
} from 'lucide-react';
import jsQR from 'jsqr';
import { useLibrary } from '../context/LibraryContext';
import { syncService } from '../services/syncService';
import { generateQrMatrix } from '../utils/qrCode';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const {
    playlists,
    likedTracks,
    syncState,
    linkSyncCode,
    syncNow,
    exportBackup,
    importBackup,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'my-qr' | 'connect'>('my-qr');
  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isLinking, setIsLinking] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedSuccess, setScannedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrImageInputRef = useRef<HTMLInputElement | null>(null);

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setScannedSuccess(false);
    isProcessingRef.current = false;
  };

  const setVideoElement = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.muted = true;
      el.play().catch(() => {});
    }
  };

  const shareUrl = useMemo(() => syncService.getShareUrl(), [syncState.syncCode]);
  const qrMatrix = useMemo(() => {
    if (!isOpen) return [];
    try {
      return generateQrMatrix(shareUrl);
    } catch {
      return generateQrMatrix(syncState.syncCode);
    }
  }, [isOpen, shareUrl, syncState.syncCode]);

  useEffect(() => {
    if (isOpen) {
      // Push latest library state whenever sync modal opens so room is ready immediately
      syncNow();
    } else {
      stopCamera();
      setFeedback(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Real-time automatic QR scanner loop (Native BarcodeDetector + high-speed downscaled jsQR)
  useEffect(() => {
    if (!isCameraOpen) {
      setScannedSuccess(false);
      return;
    }

    let isMounted = true;
    let animId: number | null = null;
    let lastScanTime = 0;
    let scanCanvas: HTMLCanvasElement | null = document.createElement('canvas');
    let ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
    let cropCanvas: HTMLCanvasElement | null = document.createElement('canvas');
    let cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    let nativeDetector: any = null;
    if (BarcodeDetectorClass) {
      try {
        nativeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      } catch {}
    }

    const scanTick = async () => {
      if (!isMounted) return;

      const video = videoRef.current;
      const now = performance.now();

      // Scan every ~75ms (approx 13fps) while keeping UI smooth
      if (video && video.readyState >= 2 && video.videoWidth > 0 && now - lastScanTime >= 75) {
        lastScanTime = now;

        // 1. Try Native BarcodeDetector (instant GPU-accelerated scanning on supported browsers)
        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const rawVal: string = barcodes[0].rawValue || '';
              if (rawVal) {
                onQrDetected(rawVal);
                return;
              }
            }
          } catch {}
        }

        // 2. High-speed jsQR fallback
        if (ctx && scanCanvas) {
          try {
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            // Pass 1: Center viewfinder crop at native 1:1 sensor resolution (razor-sharp, zero blur)
            if (cropCtx && cropCanvas) {
              const cropSize = Math.round(Math.min(vw, vh) * 0.72);
              const cropX = Math.round((vw - cropSize) / 2);
              const cropY = Math.round((vh - cropSize) / 2);
              const targetCrop = Math.min(cropSize, 640);

              if (cropCanvas.width !== targetCrop || cropCanvas.height !== targetCrop) {
                cropCanvas.width = targetCrop;
                cropCanvas.height = targetCrop;
              }

              cropCtx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, targetCrop, targetCrop);
              const cropImgData = cropCtx.getImageData(0, 0, targetCrop, targetCrop);
              const qrCenter = jsQR(cropImgData.data, targetCrop, targetCrop, { inversionAttempts: 'attemptBoth' });

              if (qrCenter && qrCenter.data) {
                onQrDetected(qrCenter.data);
                return;
              }
            }

            // Pass 2: Full frame scaled (max 640px) if user holds QR off-center
            const maxDim = 640;
            const scale = Math.min(1, maxDim / Math.max(vw, vh));
            const sw = Math.round(vw * scale);
            const sh = Math.round(vh * scale);

            if (scanCanvas.width !== sw || scanCanvas.height !== sh) {
              scanCanvas.width = sw;
              scanCanvas.height = sh;
            }

            ctx.drawImage(video, 0, 0, sw, sh);
            const fullImgData = ctx.getImageData(0, 0, sw, sh);
            const qrFull = jsQR(fullImgData.data, sw, sh, { inversionAttempts: 'attemptBoth' });

            if (qrFull && qrFull.data) {
              onQrDetected(qrFull.data);
              return;
            }
          } catch {}
        }
      }

      if (isMounted) {
        animId = requestAnimationFrame(scanTick);
      }
    };

    animId = requestAnimationFrame(scanTick);

    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);
      scanCanvas = null;
      ctx = null;
      cropCanvas = null;
      cropCtx = null;
    };
  }, [isCameraOpen]);

  if (!isOpen) return null;

  const onQrDetected = (rawCode: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Haptic feedback (vibration on iPhone / Android)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {}
    }

    // High quality chime sound
    playSuccessChime();

    // Visual emerald pulse & checkmark
    setScannedSuccess(true);

    // Brief 350ms delay so the user perceives the green scan confirmation before modal links
    setTimeout(() => {
      handleScannedValue(rawCode);
    }, 350);
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    setFeedback(null);
    setScannedSuccess(false);
    isProcessingRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Este navegador o contexto no permite acceso a la cámara. Puedes subir una captura del QR con el botón de abajo o introducir el código TAPE-XXXX-XXXX.'
      );
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // 1. Prefer back camera on mobile devices (ideal constraint won't throw on PCs with only webcams)
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      try {
        // 2. Graceful fallback: any video camera / webcam available
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: any) {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setCameraError(
            'Permiso de cámara denegado. Permite el acceso a la cámara en los ajustes de tu navegador o escribe el código TAPE-XXXX-XXXX.'
          );
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setCameraError('No se encontró ninguna cámara conectada en este equipo.');
        } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
          setCameraError('La cámara está siendo utilizada por otra aplicación.');
        } else {
          setCameraError(
            'No se pudo abrir la cámara. Puedes subir una captura del QR con el botón de abajo o escribir el código TAPE-XXXX-XXXX.'
          );
        }
        return;
      }
    }

    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        const capabilities = (track as any).getCapabilities?.() || {};
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as any],
          }).catch(() => {});
        }
      }
    } catch {}

    streamRef.current = stream;
    setIsCameraOpen(true);
  };

  const handleDecodeQrFromImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Scale down if image is too large to prevent mobile browser memory spikes
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const qr = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
        if (qr && qr.data) {
          onQrDetected(qr.data);
        } else {
          setCameraError(
            'No se detectó ningún código QR en la imagen seleccionada. Asegúrate de que el código QR sea legible.'
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleScannedValue = async (raw: string) => {
    stopCamera();
    let extractedCode = raw.trim();

    // Universal token matcher: extract TAPE-XXXX-XXXX directly even if inside full URL or query params
    const tokenMatch = raw.match(/TAPE-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}/i);
    if (tokenMatch) {
      extractedCode = tokenMatch[0].toUpperCase();
    } else {
      try {
        if (raw.includes('sync=')) {
          const url = new URL(raw);
          const param = url.searchParams.get('sync');
          if (param) extractedCode = param.trim();
        }
      } catch {}
    }

    setInputCode(extractedCode);
    setIsLinking(true);
    const res = await linkSyncCode(extractedCode);
    setIsLinking(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        text: '¡Código QR detectado y dispositivos vinculados! Tus listas y favoritos ya están sincronizados.',
      });
      setActiveTab('my-qr');
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Código QR no reconocido como código de Mixtape.',
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncState.syncCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!inputCode.trim()) {
      setFeedback({ type: 'error', text: 'Introduce el código TAPE-XXXX-XXXX del otro dispositivo.' });
      return;
    }

    setIsLinking(true);
    const res = await linkSyncCode(inputCode);
    setIsLinking(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        text: '¡Dispositivo vinculado con éxito! Tus listas, favoritos y ajustes se mantendrán sincronizados automáticamente.',
      });
      setInputCode('');
      setTimeout(() => setActiveTab('my-qr'), 1200);
    } else {
      setFeedback({ type: 'error', text: res.error || 'Código inválido.' });
    }
  };

  const handleManualSync = async () => {
    setFeedback(null);
    await syncNow();
    setFeedback({
      type: 'success',
      text: 'Sincronización completada con la nube en tiempo real.',
    });
  };

  const handleDownloadBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mixtape-backup-${syncState.syncCode.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const res = importBackup(content);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: 'Copia de seguridad importada y fusionada con tus listas.',
        });
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Error al importar el archivo.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'Listo para sincronizar';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 10) return 'Hace unos segundos';
    if (diffSec < 60) return `Hace ${diffSec} seg`;
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `Hace ${mins} min`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const qrSize = qrMatrix.length;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-3 pb-6 safe-top bg-black/75 backdrop-blur-sm select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl relative my-auto max-h-[86dvh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                Sincronización por QR
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Vincula móvil, tablet y PC en tiempo real
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
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('my-qr');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'my-qr'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Mi código QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('connect')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'connect'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Vincular otro</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {activeTab === 'my-qr' ? (
            <div className="space-y-4">
              {/* QR Card */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col items-center text-center">
                <p className="text-xs text-[var(--text-secondary)] mb-3 max-w-sm leading-relaxed">
                  Escanea este código QR con tu <strong className="text-[var(--text-primary)]">móvil, tablet o PC</strong> para conectar ambos dispositivos y sincronizar tus listas y favoritos automáticamente.
                </p>

                {/* Crisp SVG QR Code */}
                <div className="p-3.5 bg-white rounded-xl border border-[var(--border-strong)] mb-3.5">
                  <svg
                    viewBox={`0 0 ${qrSize + 8} ${qrSize + 8}`}
                    className="w-44 h-44 sm:w-52 sm:h-52 block"
                    shapeRendering="crispEdges"
                  >
                    <rect width={qrSize + 8} height={qrSize + 8} fill="#ffffff" />
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx + 4}
                            y={rIdx + 4}
                            width={1}
                            height={1}
                            fill="#000000"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>

                {/* Sync Code Badge */}
                <div className="w-full max-w-xs space-y-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                    Código de sincronización
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 py-2 px-3 rounded-xl bg-[var(--bg-elevated)] font-mono-tech text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-widest border border-[var(--border-strong)] text-center">
                      {syncState.syncCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-2 rounded-xl bg-[var(--theme-badge-bg)] hover:brightness-110 text-[var(--theme-accent)] border border-[var(--theme-badge-border)] text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedCode ? (
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
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-3 text-xs text-[var(--theme-accent)] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>
                    {copiedLink
                      ? 'Enlace directo copiado al portapapeles'
                      : 'Copiar enlace directo de sincronización'}
                  </span>
                </button>
              </div>

              {/* Live Sync Status Bar */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-1.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--theme-accent)]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)]">
                      <Laptop className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {playlists.filter((p) => p.mediaType !== 'vinyl' && !p.description?.toLowerCase().includes('vinilo')).length} listas ·{' '}
                        {playlists.filter((p) => p.mediaType === 'vinyl' || p.description?.toLowerCase().includes('vinilo')).length} álbumes ·{' '}
                        {likedTracks.length} favoritos
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono-tech mt-0.5">
                      {syncState.status === 'syncing'
                        ? 'Sincronizando con la nube...'
                        : `Última sincr.: ${formatLastSync(syncState.lastSyncedAt)}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncState.status === 'syncing'}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 border border-[var(--border-strong)] transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[var(--theme-accent)] ${
                      syncState.status === 'syncing' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connect Another Device Box */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Abre <strong className="text-[var(--text-primary)]">Sincronización por QR</strong> en tu otro dispositivo y escanea su código o introduce su clave{' '}
                    <strong className="text-[var(--text-primary)] font-mono-tech">TAPE-XXXX-XXXX</strong>.
                  </p>
                </div>

                {!isCameraOpen ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Abrir cámara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => qrImageInputRef.current?.click()}
                      className="py-2.5 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-[var(--theme-accent)]" />
                      <span>Subir foto del QR</span>
                    </button>
                    <input
                      ref={qrImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDecodeQrFromImage}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="relative rounded-xl overflow-hidden border border-[var(--theme-accent)] bg-black aspect-video flex items-center justify-center">
                      <video
                        ref={setVideoElement}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                        onLoadedMetadata={(e) => {
                          (e.target as HTMLVideoElement).play().catch(() => {});
                        }}
                      />

                      {/* Viewfinder Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div
                          className={`w-44 h-44 sm:w-48 sm:h-48 rounded-2xl relative transition-all duration-300 flex items-center justify-center ${
                            scannedSuccess
                              ? 'border-4 border-emerald-400 bg-emerald-500/20 scale-105'
                              : 'border-2 border-[var(--theme-accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
                          }`}
                        >
                          {scannedSuccess ? (
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <div className="w-12 h-12 rounded-full bg-emerald-400 text-black flex items-center justify-center">
                                <Check className="w-7 h-7 stroke-[3]" />
                              </div>
                              <span className="text-[11px] font-mono-tech font-bold text-white bg-black/80 px-2.5 py-1 rounded-full border border-emerald-400/50">
                                QR reconocido
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-white" />
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-white" />
                              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-white" />
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-white" />
                            </>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
                        <div className="bg-black/75 px-3 py-1 rounded-full border border-white/15 text-[11px] font-mono-tech text-zinc-200">
                          {scannedSuccess ? 'Vinculando biblioteca...' : 'Enfoca el código QR de la otra pantalla'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-[var(--text-secondary)] text-xs font-semibold transition cursor-pointer"
                    >
                      Cerrar cámara
                    </button>
                  </div>
                )}

                {cameraError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2.5">
                    {cameraError}
                  </p>
                )}

                {/* Manual Code Form */}
                <form onSubmit={handleConnectSubmit} className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    O introduce el código del otro dispositivo
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Ej: TAPE-8F4A-92C1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus:border-[var(--theme-accent)] focus:outline-none text-center font-mono-tech text-base font-bold text-[var(--text-primary)] tracking-widest placeholder:text-[var(--text-muted)] uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isLinking ? 'Vinculando y fusionando listas...' : 'Vincular y sincronizar ahora'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Offline File Backup Footer */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text-secondary)] text-xs">
              Copia de seguridad local:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                <span>Exportar .JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                <span>Importar .JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleUploadBackup}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
