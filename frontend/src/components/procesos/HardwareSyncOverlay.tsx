'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Weight, Cpu, Zap } from 'lucide-react';
import { HudButton } from '@/components/tactical/HudButton';

interface HardwareSyncOverlayProps {
  mode: 'WEIGHT' | 'LEY';
  weight: string;
  ley: string;
  onWeightChange: (v: string) => void;
  onLeyChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HardwareSyncOverlay({ mode, weight, ley, onWeightChange, onLeyChange, onConfirm, onCancel }: HardwareSyncOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="hw-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        style={{
          background: 'rgba(0,0,0,0.96)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Technical grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Scanning radar line */}
        <motion.div
          className="absolute left-0 right-0 h-px z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.6), transparent)',
            boxShadow: '0 0 12px rgba(0,229,255,0.3)',
          }}
          animate={{ top: ['20%', '75%', '20%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center gap-8 w-full max-w-lg px-6">
          {/* Device icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-2xl border border-cyan-500/30 flex items-center justify-center"
            style={{ background: 'rgba(0,229,255,0.06)' }}
          >
            {mode === 'WEIGHT' ? (
              <Weight className="w-9 h-9 text-cyan-400" />
            ) : (
              <Cpu className="w-9 h-9 text-cyan-400" />
            )}
          </motion.div>

          {/* Status text */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-cyan-400/80 tracking-wider animate-pulse">
              [ SIMULANDO CONEXIÓN CON DISPOSITIVO EXTERNO ]
            </span>
          </div>

          {/* Capture panel */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full p-6 rounded-2xl border border-cyan-500/15 space-y-5"
            style={{ background: 'rgba(0,229,255,0.03)' }}
          >
            {mode === 'WEIGHT' ? (
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-cyan-400/60 uppercase tracking-wider">
                  PESO BÁSCULA (g)
                </label>
                <input type="number" step="0.0001" value={weight}
                  onChange={e => onWeightChange(e.target.value)}
                  className="w-full bg-black/60 border border-cyan-500/25 rounded-xl px-5 py-4 text-2xl font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-cyan-400/50 transition-colors"
                  placeholder="0.0000"
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-cyan-400/60 uppercase tracking-wider">
                    LEY AU (‰)
                  </label>
                  <input type="number" min="0" max="1000" step="0.1" value={ley}
                    onChange={e => onLeyChange(e.target.value)}
                    className="w-full bg-black/60 border border-cyan-500/25 rounded-xl px-5 py-4 text-2xl font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-cyan-400/50 transition-colors"
                    placeholder="0.0"
                    autoFocus
                  />
                </div>
                </div>
            )}

            {/* Footnote */}
            <p className="text-[10px] font-mono text-red-400/60 text-center pt-1">
              {'>_'} NOTA: INTEGRACIÓN AUTOMÁTICA DISPONIBLE EN VERSIÓN 3.0
            </p>
          </motion.div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            <HudButton variant="ghost" className="flex-1 text-[11px]"
              onClick={onCancel}
            >
              CANCELAR
            </HudButton>
            <HudButton variant="primary" className="flex-1 text-[11px]"
              onClick={onConfirm}
            >
              <Zap className="w-3 h-3" />
              SYNC &amp; CONFIRM
            </HudButton>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
