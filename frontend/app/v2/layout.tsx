'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Flame,
  ArrowLeftRight, FileText, FolderUp, Coins, LogOut,
  Calendar, ArrowLeftRight as ModeIcon, History,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', name: 'Proveedores', icon: Users },
  { id: 'packing', name: 'Packing', icon: FolderUp },
  { id: 'procesos', name: 'Procesos', icon: Flame },
  { id: 'egresos', name: 'Egresos', icon: ArrowLeftRight },
  { id: 'reportes', name: 'Reportes', icon: FileText },
  { id: 'historicos', name: 'Históricos', icon: History },
];

export default function V2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname.split('/').pop() || 'dashboard';
  const [sysTime, setSysTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSysTime(now.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="v2-premium min-h-screen text-[var(--pm-text-primary)] font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="v2-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-5 shrink-0 border-b border-[var(--pm-border)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pm-accent-gold)] to-amber-700 flex items-center justify-center">
            <Coins className="w-4 h-4 text-[var(--pm-bg-deepest)]" />
          </div>
          <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] tracking-widest">
            CONTROL MINING
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 py-4 overflow-y-auto">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const href = `/v2/${item.id}`;
            return (
              <Link
                key={item.id}
                href={href}
                className={`
                  nav-item group ${isActive ? 'active' : ''}
                  active:scale-[0.97] transition-all duration-150
                `}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-dim)] group-hover:text-[var(--pm-text-primary)]'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-gold)] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-[var(--pm-border)] space-y-1">
          <button
            onClick={() => {
              localStorage.setItem('bandes_ui_mode', 'classic');
              router.push('/dashboard');
            }}
            className="nav-item w-full text-[10px] active:scale-95"
          >
            <ModeIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Modo Clásico</span>
          </button>
          <button className="nav-item w-full text-[10px] active:scale-95">
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[var(--pm-border)] bg-[var(--pm-bg-primary)]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-[0.15em]">
              / {activeTab}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--pm-border)] rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-emerald)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{sysTime}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 border border-[var(--pm-border)] rounded-md">
              <Calendar className="w-3 h-3 text-[var(--pm-accent-gold)]" />
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto v2-scroll">
          <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
            {children}
          </div>
        </main>

        {/* Status bar */}
        <footer className="h-7 shrink-0 flex items-center px-6 border-t border-[var(--pm-border)] bg-[var(--pm-bg-primary)]">
          <div className="flex items-center gap-4 text-[8px] font-mono text-[var(--pm-text-dim)]">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[var(--pm-accent-emerald)]" />
              SYS ONLINE
            </span>
            <span className="hidden sm:inline">BANDES v2 Premium</span>
            <span className="hidden md:inline">API: localhost:3001</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
