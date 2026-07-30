'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoldTraceabilityProvider } from '@/context/GoldTraceabilityContext';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Flame,
  ArrowLeftRight, FolderUp, LogOut,
  Calendar, History, Menu, X,
} from 'lucide-react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: process.env.NODE_ENV === 'development' ? 0 : 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10_000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', name: 'Proveedores', icon: Users },
  { id: 'packing', name: 'Packing', icon: FolderUp },
  { id: 'procesos', name: 'Procesos', icon: Flame },
  { id: 'egresos', name: 'Egresos', icon: ArrowLeftRight },
  { id: 'historicos', name: 'Históricos', icon: History },
];

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Proveedores',
  packing: 'Packing',
  procesos: 'Procesos de Fundición',
  egresos: 'Egresos de Material',
  historicos: 'Históricos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = pathname.split('/').pop() || 'dashboard';
  const [sysTime, setSysTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderNavItems = (onItemClick?: () => void) =>
    menuItems.map(item => {
      const IconComponent = item.icon;
      const isActive = activeTab === item.id;
      const href = `/${item.id}`;
      return (
        <Link
          key={item.id}
          href={href}
          onClick={onItemClick}
          className={`
            nav-item group ${isActive ? 'active' : ''}
            active:scale-[0.97] transition-all duration-150
          `}
        >
          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--hud-text-dim)] group-hover:text-[var(--hud-text-primary)]'}`} />
          <span>{item.name}</span>
        </Link>
      );
    });

  return (
    <html lang="es">
      <head>
        <title>Control Mining</title>
        <link rel="icon" type="image/png" href="/Bandes2.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased text-[var(--hud-text-primary)] bg-[var(--hud-bg-deepest)]`}>
        <QueryClientProvider client={queryClient}>
          <GoldTraceabilityProvider>
            <div className="hud-grid min-h-screen text-[var(--hud-text-primary)] font-sans flex overflow-hidden">

              {/* ═══ DESKTOP SIDEBAR ═══ */}
              <aside className="hud-sidebar hidden lg:flex lg:flex-col">
                  <div className="flex items-center gap-3 h-16 px-5 shrink-0">
                  <img src="/Bandes2.png" alt="Bandes" className="w-8 h-8 rounded-xl object-contain" />
                  <span className="text-xs font-mono font-bold text-slate-50 tracking-[0.2em] uppercase">
                    Bandes
                  </span>
                </div>
                  <nav className="flex-1 flex flex-col gap-0.5 py-4 overflow-y-auto">
                    {renderNavItems()}
                  </nav>
                  <div className="px-3 py-4 space-y-1">
                  <button className="nav-item w-full text-[10px] active:scale-95">
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Salir</span>
                  </button>
                </div>
              </aside>

              {/* ═══ MOBILE BACKDROP ═══ */}
              {mobileOpen && (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                  onClick={() => setMobileOpen(false)}
                />
              )}

              {/* ═══ MOBILE DRAWER ═══ */}
              <aside className={`
                fixed inset-y-0 left-0 z-50 flex flex-col w-72
                bg-[var(--hud-bg-base)] border-r border-[var(--hud-border)]
                transition-transform duration-300 ease-in-out
                lg:hidden
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
              `}>
                  <div className="flex items-center justify-between h-16 px-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <img src="/Bandes2.png" alt="Bandes" className="w-8 h-8 rounded-xl object-contain" />
                    <span className="text-xs font-mono font-bold text-slate-50 tracking-[0.2em] uppercase">
                      Bandes
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-[var(--hud-bg-card)] text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="flex-1 flex flex-col gap-0.5 py-4 overflow-y-auto">
                  {renderNavItems(() => setMobileOpen(false))}
                </nav>
                <div className="px-3 py-4 space-y-1">
                  <button className="nav-item w-full text-[10px] active:scale-95">
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Salir</span>
                  </button>
                </div>
              </aside>

              {/* ═══ MAIN AREA ═══ */}
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Header */}
                <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[var(--hud-bg-card)]/90 backdrop-blur-md border-b border-[var(--hud-border)]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileOpen(true)}
                      className="lg:hidden p-1.5 rounded-xl hover:bg-[var(--hud-bg-elevated)] text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-colors cursor-pointer"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-[var(--hud-accent-gold)] uppercase tracking-[0.18em]">
                      {routeLabels[activeTab] || activeTab}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--hud-bg-deepest)] rounded-xl border border-[var(--hud-border)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--hud-accent-emerald)] animate-pulse" />
                      <span className="text-[10px] font-mono text-[var(--hud-text-dim)]">{sysTime}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--hud-bg-deepest)] rounded-xl border border-[var(--hud-border)]">
                      <Calendar className="w-3 h-3 text-[var(--hud-accent-gold)]" />
                      <span className="text-[10px] font-mono text-[var(--hud-text-dim)]">
                        {new Date().toLocaleDateString('es-ES', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto hud-scroll">
                  <div className="w-full p-4 sm:p-6 md:p-8 space-y-6">
                    {children}
                  </div>
                </main>

                {/* Status bar */}
                <footer className="h-7 shrink-0 flex items-center px-6 bg-[var(--hud-bg-card)]/80 border-t border-[var(--hud-border)]">
                  <div className="flex items-center gap-4 text-[9px] font-mono text-[var(--hud-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--hud-accent-emerald)]" />
                      SYS ONLINE
                    </span>
                    <span className="hidden sm:inline">Bandes Analytics</span>
                  </div>
                </footer>
              </div>
            </div>
          </GoldTraceabilityProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
