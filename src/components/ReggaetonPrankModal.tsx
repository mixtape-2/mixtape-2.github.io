import React from 'react';

interface ReggaetonPrankModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const ReggaetonPrankModal: React.FC<ReggaetonPrankModalProps> = ({
  isOpen,
  onAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onAccept}
    >
      <div
        className="relative w-full max-w-md p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] flex items-center justify-center text-2xl">
          🎧
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-mono-tech uppercase tracking-widest text-[var(--theme-accent)] font-bold">
            Aviso del Reproductor
          </p>
          <p className="text-base font-medium text-[var(--text-primary)] leading-relaxed px-2">
            “Para escuchal este tipo de ruido, no necesitas una aplicación. Lo que tú necesitas es un psicólogo, mi amol”
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-2.5 px-6 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-sm transition active:scale-[0.99] cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReggaetonPrankModal;
