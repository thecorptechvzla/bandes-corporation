'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoldTraceabilityProvider } from '@/context/GoldTraceabilityContext';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Flame,
  ArrowLeftRight, FolderUp, LogOut,
  Calendar, History, Menu, X, Loader2, ChevronDown, FileText,
} from 'lucide-react';
import { getSession, clearSession } from '@/lib/auth';
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
  { id: 'reportes', name: 'Reportes', icon: FileText },
  { id: 'historicos', name: 'Históricos', icon: History },
];

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Proveedores',
  packing: 'Packing',
  procesos: 'Procesos de Fundición',
  egresos: 'Egresos de Material',
  reportes: 'Reportes',
  historicos: 'Históricos',
};

const historicoChilds = [
  { href: '/historicos/consolidado', label: 'Consolidado' },
  { href: '/historicos/balance', label: 'Balance' },
  { href: '/historicos/barras', label: 'Barras' },
];

const reportesChilds = [
  { href: '/reportes/packing', label: 'Detalle del Packing' },
  { href: '/reportes/procesos', label: 'Procesos' },
  { href: '/reportes/egresos', label: 'Egresos' },
  { href: '/reportes/saldos', label: 'Balance' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname.split('/')[1] || 'dashboard';
  const isHistoricoRoute = pathname.startsWith('/historicos');
  const isReporteRoute = pathname.startsWith('/reportes');
  const [manualOpen, setManualOpen] = useState(false);
  const [reportesManualOpen, setReportesManualOpen] = useState(false);
  const isLoginPage = pathname === '/login';
  const [sysTime, setSysTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setManualOpen(isHistoricoRoute);
  }, [isHistoricoRoute]);

  useEffect(() => {
    setReportesManualOpen(isReporteRoute);
  }, [isReporteRoute]);

  const historicoOpen = manualOpen;
  const reportesOpen = reportesManualOpen;

  useEffect(() => {
    setHasSession(Boolean(getSession()));
    setSessionReady(true);
  }, [pathname]);

  useEffect(() => {
    if (!sessionReady) return;
    const authed = Boolean(getSession());
    if (pathname === '/login' && authed) router.replace('/dashboard');
    if (pathname !== '/login' && !authed) router.replace('/login');
  }, [sessionReady, pathname, router]);

  const handleLogout = () => {
    clearSession();
    setHasSession(false);
    router.push('/login');
  };

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

      if (item.id === 'historicos') {
        return (
          <div key={item.id} className="flex flex-col w-full">
            <div className={`
              nav-item group ${isHistoricoRoute ? 'active' : ''}
              active:scale-[0.97] transition-all duration-150
            `}>
              <Link
                href={href}
                onClick={() => {
                  setManualOpen(prev => !prev);
                  onItemClick?.();
                }}
                className="flex items-center gap-[0.69rem] flex-1 min-w-0"
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isHistoricoRoute ? 'text-[#139169]' : 'text-[var(--hud-text-dim)] group-hover:text-[var(--hud-text-primary)]'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
              <button
                type="button"
                aria-label={historicoOpen ? 'Colapsar submenú de Históricos' : 'Expandir submenú de Históricos'}
                onClick={(e) => {
                  e.stopPropagation();
                  setManualOpen(o => !o);
                }}
                className="shrink-0 p-1 rounded-md hover:bg-[var(--hud-bg-elevated)] text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-colors duration-150 cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${historicoOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${historicoOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
              {historicoChilds.map(sub => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onItemClick}
                    className={`
                      flex items-center gap-2 pl-10 pr-3 py-2 text-sm font-medium
                      border-l-2 transition-all duration-200 active:scale-[0.97]
                      ${subActive
                        ? 'text-white border-[#139169] bg-[var(--hud-bg-elevated)]'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-[var(--hud-bg-elevated)]'}
                    `}
                  >
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      }

      if (item.id === 'reportes') {
        return (
          <div key={item.id} className="flex flex-col w-full">
            <div className={`
              nav-item group ${isReporteRoute ? 'active' : ''}
              active:scale-[0.97] transition-all duration-150
            `}>
              <Link
                href={href}
                onClick={() => {
                  setReportesManualOpen(prev => !prev);
                  onItemClick?.();
                }}
                className="flex items-center gap-[0.69rem] flex-1 min-w-0"
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isReporteRoute ? 'text-[#139169]' : 'text-[var(--hud-text-dim)] group-hover:text-[var(--hud-text-primary)]'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
              <button
                type="button"
                aria-label={reportesOpen ? 'Colapsar submenú de Reportes' : 'Expandir submenú de Reportes'}
                onClick={(e) => {
                  e.stopPropagation();
                  setReportesManualOpen(o => !o);
                }}
                className="shrink-0 p-1 rounded-md hover:bg-[var(--hud-bg-elevated)] text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-colors duration-150 cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${reportesOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${reportesOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
              {reportesChilds.map(sub => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onItemClick}
                    className={`
                      flex items-center gap-2 pl-10 pr-3 py-2 text-sm font-medium
                      border-l-2 transition-all duration-200 active:scale-[0.97]
                      ${subActive
                        ? 'text-white border-[#139169] bg-[var(--hud-bg-elevated)]'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-[var(--hud-bg-elevated)]'}
                    `}
                  >
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      }

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
          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#139169]' : 'text-[var(--hud-text-dim)] group-hover:text-[var(--hud-text-primary)]'}`} />
          <span>{item.name}</span>
        </Link>
      );
    });

  const bodyClass = `${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased text-[var(--hud-text-primary)] bg-[var(--hud-bg-deepest)]`;

  const head = (
    <>
      <title>Control Mining</title>
      <link rel="icon" type="image/png" href="/Bandes2.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  );

  if (!sessionReady) {
    return (
      <html lang="es">
        <head>{head}</head>
        <body className={bodyClass}>
          <div className="flex min-h-screen items-center justify-center bg-[var(--hud-bg-deepest)]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--hud-accent-gold)]" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--hud-text-dim)]">
                Cargando…
              </span>
            </div>
          </div>
        </body>
      </html>
    );
  }

  if (isLoginPage && !hasSession) {
    return (
      <html lang="es">
        <head>{head}</head>
        <body className={bodyClass}>
          <QueryClientProvider client={queryClient}>
            <GoldTraceabilityProvider>{children}</GoldTraceabilityProvider>
          </QueryClientProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <head>{head}</head>
      <body className={bodyClass}>
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
                  <button onClick={handleLogout} className="nav-item w-full text-[11px] active:scale-95">
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
                fixed inset-y-0 left-0 z-50 flex flex-col w-[300px]
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
                  <button onClick={handleLogout} className="nav-item w-full text-[11px] active:scale-95">
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
                      <span className="text-[11px] font-mono text-[var(--hud-text-dim)]">{sysTime}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--hud-bg-deepest)] rounded-xl border border-[var(--hud-border)]">
                      <Calendar className="w-3 h-3 text-[var(--hud-accent-gold)]" />
                      <span className="text-[11px] font-mono text-[var(--hud-text-dim)]">
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
                  <div className="flex items-center gap-4 text-[10px] font-mono text-[var(--hud-text-muted)]">
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
