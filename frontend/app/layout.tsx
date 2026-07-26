'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoldTraceabilityProvider } from '@/context/GoldTraceabilityContext';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Flame,
  ArrowLeftRight, FileText, FolderUp, LogOut,
  Calendar, History, ClipboardList, Menu, X,
} from 'lucide-react';
import './globals.css';

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
  { id: 'ingresos', name: 'Ingresos', icon: ClipboardList },
  { id: 'procesos', name: 'Procesos', icon: Flame },
  { id: 'egresos', name: 'Egresos', icon: ArrowLeftRight },
  { id: 'reportes', name: 'Reportes', icon: FileText },
  { id: 'historicos', name: 'Históricos', icon: History },
];

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Proveedores',
  packing: 'Packing',
  ingresos: 'Ingresos de Material',
  procesos: 'Procesos de Fundición',
  egresos: 'Egresos de Material',
  reportes: 'Reportes',
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
          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-dim)] group-hover:text-[var(--pm-text-primary)]'}`} />
          <span>{item.name}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-gold)] animate-pulse" />
          )}
        </Link>
      );
    });

  return (
    <html lang="es">
      <head>
        <title>Control Mining</title>
        <link rel="icon" type="image/png" href="/Bandes.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <GoldTraceabilityProvider>
            <div className="v2-premium min-h-screen text-[var(--pm-text-primary)] font-sans flex overflow-hidden">

              {/* ═══ DESKTOP SIDEBAR ═══ */}
              <aside className="v2-sidebar hidden lg:flex lg:flex-col">
                <div className="flex items-center gap-3 h-16 px-5 shrink-0 border-b border-[var(--pm-border)]">
                  <img src="/Bandes.png" alt="Bandes" className="w-8 h-8 rounded-lg object-contain" />
                  <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] tracking-widest">
                    CONTROL MINING
                  </span>
                </div>
                <nav className="flex-1 flex flex-col gap-0.5 py-4 overflow-y-auto">
                  {renderNavItems()}
                </nav>
                <div className="px-3 py-4 border-t border-[var(--pm-border)] space-y-1">
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
                bg-gradient-to-b from-[var(--pm-bg-primary)] to-[var(--pm-bg-deepest)]
                border-r border-[var(--pm-border)]
                transition-transform duration-300 ease-in-out
                lg:hidden
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
              `}>
                <div className="flex items-center justify-between h-16 px-5 shrink-0 border-b border-[var(--pm-border)]">
                  <div className="flex items-center gap-3">
                    <img src="/Bandes.png" alt="Bandes" className="w-8 h-8 rounded-lg object-contain" />
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] tracking-widest">
                      CONTROL MINING
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="flex-1 flex flex-col gap-0.5 py-4 overflow-y-auto">
                  {renderNavItems(() => setMobileOpen(false))}
                </nav>
                <div className="px-3 py-4 border-t border-[var(--pm-border)] space-y-1">
                  <button className="nav-item w-full text-[10px] active:scale-95">
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Salir</span>
                  </button>
                </div>
              </aside>

              {/* ═══ MAIN AREA ═══ */}
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Header */}
                <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--pm-border)] bg-[var(--pm-bg-primary)]/80 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileOpen(true)}
                      className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] transition-colors cursor-pointer"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-[0.15em]">
                      {routeLabels[activeTab] || activeTab}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--pm-border)] rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-emerald)] animate-pulse" />
                      <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{sysTime}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 border border-[var(--pm-border)] rounded-md">
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
                  <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
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
                    <span className="hidden sm:inline">BANDES Premium</span>
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
