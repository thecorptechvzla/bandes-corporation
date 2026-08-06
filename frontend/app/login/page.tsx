'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { getSession, setSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (getSession()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!username.trim() || !password.trim()) {
      setError('Ingrese usuario y contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setSession(username.trim());
      router.replace('/dashboard');
    }, 650);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--hud-bg-deepest)]">
      {/* ─── VIDEO DE FONDO ─── */}
      <div className="absolute inset-0">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/bandes-login-refinery.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        />
        {(!videoReady || videoFailed) && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#0F111A] via-[#151720] to-[#1A1D23]"
            aria-hidden
          />
        )}
        {/* Overlay para legibilidad */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F111A]/95 via-transparent to-[#0F111A]/70" aria-hidden />
      </div>

      {/* ─── CARD DE LOGIN ─── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="flex w-full max-w-[400px] flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full"
          >
          <div className="glass-panel p-6 sm:p-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--hud-border-glow)] bg-[var(--hud-bg-deepest)]/80 shadow-[0_0_32px_-8px_rgba(251,191,36,0.45)]">
                <img src="/Bandes2.png" alt="Bandes" className="h-12 w-12 rounded-xl object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-mono font-bold uppercase tracking-[0.28em] text-[var(--hud-text-primary)]">
                  Bandes
                </h1>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--hud-text-dim)]">
                  Control Mining · Acceso Restringido
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {/* Usuario */}
              <div className="group flex items-center gap-3 rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg-deepest)]/70 px-3.5 py-3 transition-all focus-within:border-[var(--hud-accent-gold)] focus-within:shadow-[0_0_0_3px_rgba(251,191,36,0.12)]">
                <User className="h-4 w-4 shrink-0 text-[var(--hud-text-dim)] group-focus-within:text-[var(--hud-accent-gold)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                  className="w-full bg-transparent text-sm text-[var(--hud-text-primary)] placeholder:text-[var(--hud-text-muted)]"
                />
              </div>

              {/* Contraseña */}
              <div className="group flex items-center gap-3 rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg-deepest)]/70 px-3.5 py-3 transition-all focus-within:border-[var(--hud-accent-gold)] focus-within:shadow-[0_0_0_3px_rgba(251,191,36,0.12)]">
                <Lock className="h-4 w-4 shrink-0 text-[var(--hud-text-dim)] group-focus-within:text-[var(--hud-accent-gold)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-[var(--hud-text-primary)] placeholder:text-[var(--hud-text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="cursor-pointer text-[var(--hud-text-dim)] transition-colors hover:text-[var(--hud-text-primary)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-xs text-[var(--hud-accent-red)]">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(251,191,36,0.35)] bg-gradient-to-r from-[#D5B042] to-[#FBBF24] px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#0F111A] shadow-[0_8px_28px_-8px_rgba(251,191,36,0.55)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Ingresando…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[10px] font-mono text-[var(--hud-text-muted)]">
              Sistema de control de fundición · BANDES
            </p>
          </div>
        </motion.div>

        {/* ─── MARCA DE AGUA ─── */}
        <p className="pointer-events-none mt-8 w-full select-none whitespace-nowrap text-center font-mono text-sm font-bold uppercase tracking-[0.4em] text-white/85">
          © Desarrollado por The Corp Tech
        </p>
        </div>
      </div>
    </div>
  );
}
