'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Check, Shield, Eye, EyeOff } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  title?: string;
  subtitle?: string;
  mode?: 'unlock' | 'confirm';
  barInfo?: { barNumber: string; grossWeight: string; purity: string };
  onConfirmSave?: (data: { grossWeight: string; purity: string }) => void;
  isSaving?: boolean;
}

const SECURITY_PIN = '1234';

export function PinPadModal({
  isOpen,
  onClose,
  onUnlock,
  title = 'PIN DE SEGURIDAD',
  subtitle = 'Ingrese 4 dígitos para desbloquear',
  mode = 'unlock',
  barInfo,
  onConfirmSave,
  isSaving = false,
}: PinPadModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [grossWeight, setGrossWeight] = useState('');
  const [purity, setPurity] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setUnlocked(false);
      setShowPin(false);
      if (barInfo) {
        setGrossWeight(barInfo.grossWeight);
        setPurity(barInfo.purity);
      }
    }
  }, [isOpen, barInfo]);

  useEffect(() => {
    if (!isOpen || unlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPin(prev => prev.length < 4 ? prev + e.key : prev);
        setError(false);
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
        setError(false);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, unlocked, onClose]);

  useEffect(() => {
    if (pin.length === 4) {
      const timer = setTimeout(() => {
        if (pin === SECURITY_PIN) {
          setUnlocked(true);
          if (mode === 'unlock') {
            onUnlock();
          }
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pin, mode, onUnlock]);

  const handleDigitPress = (digit: string) => {
    if (unlocked) return;
    setError(false);
    setPin(prev => prev.length < 4 ? prev + digit : prev);
  };

  const handleDeletePress = () => {
    if (unlocked) return;
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handleSave = () => {
    if (onConfirmSave && grossWeight && purity) {
      onConfirmSave({ grossWeight, purity });
    }
  };

  const pinPadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} noHeader noPadding size="sm">
      <div ref={containerRef} className="p-6 flex flex-col items-center pointer-events-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background: unlocked
                ? 'rgba(16,185,129,0.12)'
                : error
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(212,175,55,0.1)',
              border: `1px solid ${unlocked ? 'rgba(16,185,129,0.3)' : error ? 'rgba(239,68,68,0.3)' : 'rgba(212,175,55,0.2)'}`,
              boxShadow: unlocked
                ? '0 0 24px rgba(16,185,129,0.15)'
                : error
                  ? '0 0 24px rgba(239,68,68,0.15)'
                  : '0 0 24px rgba(212,175,55,0.1)',
            }}>
            {unlocked ? (
              <Check className="w-6 h-6 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
            ) : error ? (
              <AlertTriangle className="w-6 h-6 text-[var(--pm-accent-red)]" />
            ) : (
              <Shield className="w-6 h-6 text-[var(--pm-accent-gold)]" />
            )}
          </div>
          <h2 className="text-sm font-mono font-bold text-[var(--pm-text-primary)] tracking-wider uppercase">
            {unlocked ? 'ACCESO CONCEDIDO' : title}
          </h2>
          <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">
            {unlocked ? '>_ BARRA DESBLOQUEADA' : subtitle}
          </p>
        </motion.div>

        {/* PIN Display */}
        {!unlocked && (
          <motion.div
            animate={error ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 mb-6"
          >
            {[0, 1, 2, 3].map(i => {
              const filled = i < pin.length;
              return (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-xl flex items-center justify-center text-lg font-mono font-bold transition-all duration-150 ${
                    error
                      ? 'border-2 border-[var(--pm-accent-red)]/50 bg-[var(--pm-accent-red)]/5'
                      : filled
                        ? 'border-2 border-[var(--pm-accent-gold)]/50 bg-[var(--pm-accent-gold)]/5 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]'
                  }`}
                  style={{ color: error ? 'var(--pm-accent-red)' : filled ? 'var(--pm-accent-gold)' : 'var(--pm-text-dim)' }}
                >
                  {showPin ? (filled ? pin[i] : '·') : (filled ? '●' : '')}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg mb-4"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-red)] tracking-wider">
                {'>_ ACCESO DENEGADO'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Pad */}
        {!unlocked && (
          <div className="w-full max-w-[240px] mb-4 pointer-events-auto">
            <div className="grid grid-cols-3 gap-2">
              {pinPadKeys.map((key, i) => {
                if (key === '') return <div key={i} />;
                const isDelete = key === '←';
                return (
                  <button
                    key={i}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (isDelete) {
                        handleDeletePress();
                      } else {
                        handleDigitPress(key);
                      }
                    }}
                    className="h-12 rounded-xl font-mono font-bold text-sm transition-all active:scale-90 cursor-pointer pointer-events-auto select-none touch-manipulation border border-[var(--pm-border)]/60 text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-hover)]/60 active:bg-[var(--pm-accent-gold)]/10"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isDelete ? '←' : key}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[9px] font-mono text-[var(--pm-text-dim)]/50 mt-3 tracking-wider">
              o escriba con el teclado
            </p>
          </div>
        )}

        {/* Show/Hide PIN toggle */}
        {!unlocked && (
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] transition-colors mb-4 cursor-pointer pointer-events-auto"
          >
            {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showPin ? 'OCULTAR' : 'MOSTRAR'} PIN
          </button>
        )}

        {/* Edit Fields - only shown when unlocked in confirm mode */}
        {unlocked && mode === 'confirm' && barInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4 pointer-events-auto"
          >
            <div className="text-center mb-2">
              <span className="text-[11px] font-mono text-[var(--pm-accent-gold)] tracking-wider">
                EDITAR VALORES — {barInfo.barNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">
                  PESO FÍSICO (g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={grossWeight}
                  onChange={e => setGrossWeight(e.target.value)}
                  className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all pointer-events-auto"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">
                  LEY FÍSICA (‰)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="1000"
                  value={purity}
                  onChange={e => setPurity(e.target.value)}
                  className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all pointer-events-auto"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer pointer-events-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !grossWeight || !purity}
                className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 pointer-events-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                  color: 'var(--pm-accent-emerald)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 16px rgba(16,185,129,0.15)',
                }}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-emerald)]/30 border-t-[var(--pm-accent-emerald)] rounded-full animate-spin" />
                    GUARDANDO...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    GUARDAR CAMBIOS
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Status indicator */}
        {unlocked && mode === 'unlock' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg pointer-events-auto"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <Check className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
            <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-emerald)] tracking-wider">
              {'>_ EDICIÓN HABILITADA'}
            </span>
          </motion.div>
        )}
      </div>
    </ModalShell>
  );
}
