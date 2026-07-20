'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TacticalSidebar } from '@/components/tactical/TacticalSidebar';
import { UIModeProvider } from '@/context/UIModeContext';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { Calendar, Shield, ShieldCheck } from 'lucide-react';

function RoleBadge() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const roles = ['ADMIN', 'OWNER', 'SUPERADMIN'] as const;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 border border-[var(--tac-border)] text-[9px] font-mono text-[var(--tac-text-dim)] hover:border-[var(--tac-accent-cyan)]/40 transition-colors"
      >
        {role === 'SUPERADMIN' ? <ShieldCheck className="w-3 h-3 text-[var(--tac-accent-amber)]" /> : <Shield className="w-3 h-3 text-[var(--tac-text-dim)]" />}
        {role}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--tac-bg-secondary)] border border-[var(--tac-border)] shadow-lg z-50 min-w-[140px]">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-[10px] font-mono transition-colors ${role === r ? 'text-[var(--tac-accent-cyan)] bg-[var(--tac-bg-tertiary)]' : 'text-[var(--tac-text-dim)] hover:text-[var(--tac-text-primary)] hover:bg-[var(--tac-bg-tertiary)]/50'}`}
            >
              {r === 'SUPERADMIN' && <><ShieldCheck className="w-3 h-3 inline mr-1 text-[var(--tac-accent-amber)]" /></>}
              {r === 'OWNER' && <><Shield className="w-3 h-3 inline mr-1 text-[var(--tac-accent-cyan)]" /></>}
              {r === 'ADMIN' && <><Shield className="w-3 h-3 inline mr-1 text-[var(--tac-text-dim)]" /></>}
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TacticalLayout({ children }: { children: React.ReactNode }) {
  const currentPath = usePathname();
  const activeSection = currentPath.split('/').pop() || 'DASHBOARD';
  const [sysTime, setSysTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSysTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <UIModeProvider>
    <RoleProvider>
    <div className="min-h-screen bg-[var(--tac-bg-primary)] text-[var(--tac-text-primary)] font-sans flex overflow-hidden">
      <TacticalSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-14">
        {/* HUD Header */}
        <header className="h-12 border-b border-[var(--tac-border)] bg-[var(--tac-bg-primary)]/90 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-cyan)] uppercase tracking-[0.2em]">
              {'>'} {activeSection}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <RoleBadge />
            <div className="flex items-center gap-1.5 px-2 py-1 border border-[var(--tac-border)]">
              <Calendar className="w-3 h-3 text-[var(--tac-accent-cyan)]" />
              <span className="text-[10px] font-mono text-[var(--tac-text-dim)]">
                {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 border border-[var(--tac-border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--tac-text-dim)]">{sysTime}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--tac-bg-primary)]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Status bar */}
        <footer className="h-6 border-t border-[var(--tac-border)] bg-[var(--tac-bg-primary)] flex items-center px-4 shrink-0">
          <div className="flex items-center gap-3 text-[8px] font-mono text-[var(--tac-text-dim)]">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[var(--tac-accent-green)]" />
              SYS OK
            </span>
            <span>BANDES v2.0 TACTICAL</span>
            <span>API: localhost:3001</span>
          </div>
        </footer>
      </div>
    </div>
    </RoleProvider>
    </UIModeProvider>
  );
}
