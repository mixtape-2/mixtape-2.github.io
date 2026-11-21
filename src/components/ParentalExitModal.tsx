import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  AlertCircle,
  Lock,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';
import { useKidsMode } from '../context/KidsModeContext';

interface ParentalExitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParentalExitModal: React.FC<ParentalExitModalProps> = ({ isOpen, onClose }) => {
  const {
    disableKidsMode,
    mathChallenge,
    generateNewChallenge,
    verifyMathChallenge,
  } = useKidsMode();

  const [step, setStep] = useState<'math' | 'password'>('math');
  const [mathInput, setMathInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mathSolved, setMathSolved] = useState(false);
  const [mathError, setMathError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('math');
      setMathInput('');
      setPasswordInput('');
      setShowPassword(false);
      setMathSolved(false);
      setMathError(null);
      setPasswordError(null);
      generateNewChallenge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Handle Math Challenge Submission
  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mathInput.trim()) return;

    const isCorrect = verifyMathChallenge(mathInput);
    if (isCorrect) {
      setMathSolved(true);
      setMathError(null);
      setStep('password');
    } else {
      setMathError('Resultado incorrecto. Operación actualizada.');
      setMathInput('');
    }
  };

  // Step 2: Handle Password Verification & Exit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Por favor, introduce la contraseña.');
      return;
    }

    const success = disableKidsMode(passwordInput);
    if (success) {
      setPasswordError(null);
      setPasswordInput('');
      onClose();
    } else {
      setPasswordError('Contraseña incorrecta. Introduce la clave de la app (por defecto: 1234).');
      setPasswordInput('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
              {step === 'math' ? <ShieldCheck className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                Control Parental
              </h3>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {step === 'math' ? 'Paso 1: Operación matemática' : 'Paso 2: Contraseña parental'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 p-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] text-xs">
            <div
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-semibold flex items-center justify-center gap-1 transition ${
                step === 'math'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'text-emerald-400'
              }`}
            >
              {mathSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>1. Operación</span>
            </div>

            <div
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-semibold flex items-center justify-center gap-1 transition ${
                step === 'password'
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>2. Contraseña</span>
            </div>
          </div>

          {/* STEP 1: MATH CHALLENGE */}
          {step === 'math' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-1">
                <span className="text-[11px] font-mono-tech uppercase text-[var(--theme-accent)] tracking-wider font-bold block">
                  Operación de seguridad
                </span>
                <p className="text-2xl font-extrabold font-mono-tech text-[var(--text-primary)] tracking-wider py-1">
                  {mathChallenge.question}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Resuelve esta operación para continuar al desbloqueo.
                </p>
              </div>

              <form onSubmit={handleMathSubmit} className="space-y-3">
                <input
                  type="number"
                  autoFocus
                  value={mathInput}
                  onChange={(e) => {
                    setMathInput(e.target.value);
                    if (mathError) setMathError(null);
                  }}
                  placeholder="Tu respuesta..."
                  className="w-full text-center text-xl font-bold font-mono-tech py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
                />

                {mathError && (
                  <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{mathError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      generateNewChallenge();
                      setMathInput('');
                      setMathError(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-xs text-[var(--text-secondary)] font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Cambiar reto"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Cambiar</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!mathInput.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Bypass for adults who know the password */}
                <div className="pt-2 text-center border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('password');
                      setMathError(null);
                    }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--theme-accent)] underline cursor-pointer transition"
                  >
                    Acceder con contraseña directamente
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: PARENTAL PASSWORD */}
          {step === 'password' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {mathSolved
                    ? 'Operación resuelta con éxito.'
                    : 'Verificación de contraseña requerida.'}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Introduce la <strong className="text-[var(--text-primary)]">contraseña parental</strong> para autorizar la salida del Modo Niños.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Contraseña parental..."
                    className="w-full text-center text-base font-bold font-mono-tech py-2.5 pl-4 pr-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-medium text-center">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <p className="text-[11px] text-[var(--text-muted)] text-center font-mono-tech">
                  Por defecto si no la has cambiado: <span className="text-[var(--text-secondary)] font-bold">1234</span>
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('math');
                      setPasswordError(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-xs text-[var(--text-secondary)] font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!passwordInput.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold text-xs transition active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Salir del Modo Niños</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
